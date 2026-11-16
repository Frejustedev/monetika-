// Origine publique de l'application, pour bâtir les redirections absolues.
//
// En auto-hébergement (sortie autonome de Next.js, HOSTNAME=0.0.0.0), `req.url`
// vaut l'adresse d'écoute du conteneur (`http(s)://0.0.0.0:3000/...`) : une
// redirection bâtie sur `new URL(chemin, req.url)` enverrait le navigateur vers
// 0.0.0.0. On prend donc, dans l'ordre :
//   1. l'adresse configurée : AUTH_URL (lue à l'exécution), puis
//      NEXT_PUBLIC_APP_URL (figée à la construction) ;
//   2. à défaut, x-forwarded-host / host et x-forwarded-proto, seulement si
//      l'hôte est un nom du site (un en-tête forgé ne devient jamais une cible) ;
//   3. en dernier recours, l'adresse publique par défaut.

export const DEFAULT_PUBLIC_ORIGIN = 'https://monetika.frejusteagboton.info';

const SITE_HOSTS = ['monetika.frejusteagboton.info'];
const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.hostname === '0.0.0.0') return null;
    return url.origin;
  } catch {
    return null;
  }
}

function configuredOrigins(): string[] {
  // NEXT_PUBLIC_APP_URL écrite en toutes lettres : Next.js la fige à la construction.
  return [originOf(process.env.AUTH_URL), originOf(process.env.NEXT_PUBLIC_APP_URL)].filter(
    (o): o is string => o !== null,
  );
}

function firstValue(value: string | null): string {
  return (value ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
}

function allowedHostnames(): Set<string> {
  const hosts = new Set(SITE_HOSTS);
  for (const origin of configuredOrigins()) hosts.add(new URL(origin).hostname);
  if (process.env.NODE_ENV !== 'production') for (const h of LOCAL_HOSTS) hosts.add(h);
  return hosts;
}

export function publicOrigin(headers: Headers): string {
  const configured = configuredOrigins()[0];
  if (configured) return configured;

  const host = firstValue(headers.get('x-forwarded-host')) || firstValue(headers.get('host'));
  const parsed = host ? originOf(`https://${host}`) : null;
  if (parsed) {
    const hostname = new URL(parsed).hostname;
    if (allowedHostnames().has(hostname)) {
      const proto = firstValue(headers.get('x-forwarded-proto'));
      const local = LOCAL_HOSTS.includes(hostname);
      const scheme = proto === 'http' || proto === 'https' ? proto : local ? 'http' : 'https';
      const candidate = originOf(`${scheme}://${host}`);
      if (candidate) return candidate;
    }
  }

  return DEFAULT_PUBLIC_ORIGIN;
}

// Adresse absolue d'un chemin interne (un seul « / » en tête, ni « // » ni « /\ »,
// qui désigneraient un autre hôte) sur l'origine publique.
export function publicUrl(path: string, headers: Headers): URL {
  const safePath = /^\/(?![/\\])/.test(path) ? path : '/';
  return new URL(safePath, publicOrigin(headers));
}
