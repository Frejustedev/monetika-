// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PUBLIC_ORIGIN, publicOrigin, publicUrl } from '@/lib/http/public-origin';

const SITE = 'https://monetika.frejusteagboton.info';

function h(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe('publicOrigin', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_URL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prend AUTH_URL en premier et n'en garde que l'origine", () => {
    vi.stubEnv('AUTH_URL', `${SITE}/api/auth`);
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://autre.example');
    expect(publicOrigin(h({ host: '0.0.0.0:3000' }))).toBe(SITE);
  });

  it('prend NEXT_PUBLIC_APP_URL quand AUTH_URL manque ou est invalide', () => {
    vi.stubEnv('AUTH_URL', 'pas une adresse');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', SITE);
    expect(publicOrigin(h({ host: '0.0.0.0:3000' }))).toBe(SITE);
  });

  it('ignore une adresse configurée en 0.0.0.0', () => {
    vi.stubEnv('AUTH_URL', 'http://0.0.0.0:3000');
    expect(publicOrigin(h({ host: '0.0.0.0:3000' }))).toBe(DEFAULT_PUBLIC_ORIGIN);
  });

  it('sans configuration, suit x-forwarded-host et x-forwarded-proto du site', () => {
    expect(
      publicOrigin(
        h({
          host: '0.0.0.0:3000',
          'x-forwarded-host': 'monetika.frejusteagboton.info',
          'x-forwarded-proto': 'https',
        }),
      ),
    ).toBe(SITE);
  });

  it("sans configuration, l'en-tête host du site suffit (https par défaut)", () => {
    expect(publicOrigin(h({ host: 'monetika.frejusteagboton.info' }))).toBe(SITE);
  });

  it("ne garde que la première valeur d'un en-tête à plusieurs valeurs", () => {
    expect(
      publicOrigin(
        h({
          'x-forwarded-host': 'monetika.frejusteagboton.info, evil.example',
          'x-forwarded-proto': 'https, http',
        }),
      ),
    ).toBe(SITE);
  });

  it("refuse un hôte forgé (x-forwarded-host ou host) et retombe sur l'adresse par défaut", () => {
    expect(publicOrigin(h({ 'x-forwarded-host': 'evil.example' }))).toBe(DEFAULT_PUBLIC_ORIGIN);
    expect(publicOrigin(h({ host: 'evil.example' }))).toBe(DEFAULT_PUBLIC_ORIGIN);
    expect(publicOrigin(h({ host: 'monetika.frejusteagboton.info.evil.example' }))).toBe(
      DEFAULT_PUBLIC_ORIGIN,
    );
  });

  it("retombe sur l'adresse par défaut pour 0.0.0.0 ou sans en-tête", () => {
    expect(publicOrigin(h({ host: '0.0.0.0:3000' }))).toBe(DEFAULT_PUBLIC_ORIGIN);
    expect(publicOrigin(h({}))).toBe(DEFAULT_PUBLIC_ORIGIN);
  });

  it('ignore un protocole inconnu', () => {
    expect(
      publicOrigin(
        h({
          'x-forwarded-host': 'monetika.frejusteagboton.info',
          'x-forwarded-proto': 'javascript',
        }),
      ),
    ).toBe(SITE);
  });

  it('admet le poste local hors production seulement', () => {
    expect(publicOrigin(h({ host: 'localhost:3000' }))).toBe('http://localhost:3000');
    vi.stubEnv('NODE_ENV', 'production');
    expect(publicOrigin(h({ host: 'localhost:3000' }))).toBe(DEFAULT_PUBLIC_ORIGIN);
  });
});

describe('publicUrl', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_URL', SITE);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("bâtit l'adresse absolue d'un chemin interne", () => {
    expect(publicUrl('/verify?error=invalid', h({ host: '0.0.0.0:3000' })).href).toBe(
      `${SITE}/verify?error=invalid`,
    );
  });

  it('ramène à la racine un chemin qui désignerait un autre hôte', () => {
    for (const path of ['//evil.example/x', '/\\evil.example', 'https://evil.example', 'x']) {
      expect(publicUrl(path, h({})).href).toBe(`${SITE}/`);
    }
  });
});
