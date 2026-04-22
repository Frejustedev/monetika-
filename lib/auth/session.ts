import { redirect } from 'next/navigation';
import { auth } from '@/auth';

// Utilisé côté RSC / server actions : garantit qu'un utilisateur onboardé est présent.
export async function requireOnboardedUser() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!session.user.onboardedAt) redirect('/onboarding/I');
  return session.user;
}

// Utilisé pour les pages d'onboarding : user présent mais onboardedAt null.
export async function requireAuthUser() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}
