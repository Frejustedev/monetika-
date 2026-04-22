import { requireOnboardedUser } from '@/lib/auth/session';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireOnboardedUser();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="flex min-h-[100dvh]">
        <Sidebar />
        <main className="flex-1 pb-24 md:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
