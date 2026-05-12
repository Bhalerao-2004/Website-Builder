import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client();

export type SessionUser = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
};

export async function requireUser(): Promise<SessionUser> {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    throw new AuthError('Unauthenticated');
  }
  return session.user as SessionUser;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
