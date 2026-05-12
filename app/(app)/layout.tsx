import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');

  return (
    <AppShell
      user={{
        name: session.user.name || session.user.nickname || 'Creator',
        email: session.user.email,
        picture: session.user.picture,
      }}
    >
      {children}
    </AppShell>
  );
}
