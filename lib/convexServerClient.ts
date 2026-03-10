import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';

export class MissingConvexUrlError extends Error {
  constructor() {
    super(
      'NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` and set it in .env.local to enable Convex-backed features.',
    );
    this.name = 'MissingConvexUrlError';
  }
}

export class AuthenticationRequiredError extends Error {
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'AuthenticationRequiredError';
  }
}

export function getConvexUrl() {
  return process.env.NEXT_PUBLIC_CONVEX_URL;
}

export async function createAuthenticatedServerConvexClient() {
  const convexUrl = getConvexUrl();
  if (!convexUrl) {
    throw new MissingConvexUrlError();
  }

  const token = await convexAuthNextjsToken();
  if (!token) {
    throw new AuthenticationRequiredError();
  }

  return new ConvexHttpClient(convexUrl, { auth: token });
}

export async function createOptionalServerConvexClient() {
  const convexUrl = getConvexUrl();
  if (!convexUrl) {
    throw new MissingConvexUrlError();
  }

  const token = await convexAuthNextjsToken();
  return {
    client: new ConvexHttpClient(
      convexUrl,
      token ? { auth: token } : undefined,
    ),
    token,
  };
}
