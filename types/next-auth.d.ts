import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      onboardedAt: string | null;
      locale: string;
    } & DefaultSession['user'];
  }

  interface User {
    onboardedAt?: string | null;
    locale?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    onboardedAt?: string | null;
    locale?: string;
  }
}
