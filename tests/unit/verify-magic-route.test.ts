// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/magic-link', () => ({ consumeMagicLinkToken: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ prisma: { user: { findUnique: vi.fn() } } }));
vi.mock('@/auth', () => ({ signIn: vi.fn(), signMagicIntent: vi.fn() }));

import { GET } from '@/app/api/auth/verify-magic/route';
import { consumeMagicLinkToken } from '@/lib/auth/magic-link';
import { prisma } from '@/lib/db/client';
import { signIn, signMagicIntent } from '@/auth';

const SITE = 'https://monetika.frejusteagboton.info';
const ECOUTE = 'http://0.0.0.0:3000';

// Requête telle que la voit Next.js en sortie autonome : req.url sur 0.0.0.0:3000.
function requete(query: string, headers: Record<string, string> = {}): Request {
  return new Request(`${ECOUTE}/api/auth/verify-magic${query}`, {
    headers: { host: '0.0.0.0:3000', ...headers },
  });
}

describe('GET /api/auth/verify-magic : redirections sur l’origine publique', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_URL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.mocked(consumeMagicLinkToken).mockReset();
    vi.mocked(signIn).mockReset();
    vi.mocked(signMagicIntent).mockReset().mockResolvedValue('intention');
    vi.mocked(prisma.user.findUnique).mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('jeton ou courriel absent : /verify, sans toucher à la base', async () => {
    const res = await GET(
      requete('?token=x', {
        'x-forwarded-host': 'monetika.frejusteagboton.info',
        'x-forwarded-proto': 'https',
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${SITE}/verify`);
    expect(consumeMagicLinkToken).not.toHaveBeenCalled();
  });

  it('jeton invalide ou expiré : /verify?error=…', async () => {
    vi.mocked(consumeMagicLinkToken).mockResolvedValueOnce({ ok: false, reason: 'invalid' });
    let res = await GET(requete('?token=x&email=a@example.invalid'));
    expect(res.headers.get('location')).toBe(`${SITE}/verify?error=invalid`);

    vi.mocked(consumeMagicLinkToken).mockResolvedValueOnce({ ok: false, reason: 'expired' });
    res = await GET(requete('?token=x&email=a@example.invalid'));
    expect(res.headers.get('location')).toBe(`${SITE}/verify?error=expired`);
  });

  it('échec de signIn : /verify?error=invalid', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(consumeMagicLinkToken).mockResolvedValueOnce({
      ok: true,
      email: 'a@example.invalid',
    });
    vi.mocked(signIn).mockRejectedValueOnce(new Error('refus'));
    const res = await GET(requete('?token=x&email=a@example.invalid'));
    expect(res.headers.get('location')).toBe(`${SITE}/verify?error=invalid`);
  });

  it('connexion réussie : / si onboardé, sinon /onboarding/I', async () => {
    vi.mocked(consumeMagicLinkToken).mockResolvedValue({ ok: true, email: 'a@example.invalid' });
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ onboardedAt: new Date() } as never);
    let res = await GET(requete('?token=x&email=a@example.invalid'));
    expect(res.headers.get('location')).toBe(`${SITE}/`);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ onboardedAt: null } as never);
    res = await GET(requete('?token=x&email=a@example.invalid'));
    expect(res.headers.get('location')).toBe(`${SITE}/onboarding/I`);
  });

  it('hôte forgé : la redirection reste sur le site', async () => {
    const forges: Record<string, string>[] = [
      { 'x-forwarded-host': 'evil.example' },
      { host: 'evil.example' },
    ];
    for (const headers of forges) {
      const res = await GET(requete('?token=x', headers));
      expect(res.headers.get('location')).toBe(`${SITE}/verify`);
    }
  });

  it("suit l'adresse configurée (AUTH_URL) quand elle existe", async () => {
    vi.stubEnv('AUTH_URL', 'https://monetika.example/api/auth');
    const res = await GET(requete('?token=x'));
    expect(res.headers.get('location')).toBe('https://monetika.example/verify');
  });

  it('ne renvoie jamais vers 0.0.0.0', async () => {
    const res = await GET(requete('?token=x'));
    expect(res.headers.get('location')).not.toMatch(/0\.0\.0\.0/);
  });
});
