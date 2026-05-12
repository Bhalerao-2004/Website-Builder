import { withAuth } from '../_helpers';
import { auth0 } from '@/lib/auth0';

export const runtime = 'nodejs';

export async function GET() {
  return withAuth(async () => {
    const session = await auth0.getSession();
    const u = session?.user;
    return {
      user: {
        sub: u?.sub,
        email: u?.email,
        name: u?.name ?? u?.nickname,
        picture: u?.picture,
      },
    };
  });
}
