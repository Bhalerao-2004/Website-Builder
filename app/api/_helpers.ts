import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth0';
import { GeminiError } from '@/lib/gemini';

export async function withAuth<T>(handler: (userId: string) => Promise<T>): Promise<Response> {
  try {
    const user = await requireUser();
    const result = await handler(user.sub);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof BadRequestError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const msg = err instanceof Error ? err.message : 'Internal error';
    console.error('[api]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function requireString(value: unknown, field: string, max = 500): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestError(`${field} is required`);
  }
  if (value.length > max) {
    throw new BadRequestError(`${field} too long (max ${max} chars)`);
  }
  return value.trim();
}
