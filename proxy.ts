import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server';
import { NextResponse } from 'next/server';

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

const isAuthPage = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);
const isProtectedPage = createRouteMatcher([
  '/dashboard(.*)',
  '/results(.*)',
  '/upload(.*)',
]);
const isProtectedApiRoute = createRouteMatcher([
  '/api/save-job',
  '/api/save-resume',
  '/api/tailor',
  '/api/export(.*)',
]);

export const proxy = hasConvexUrl
  ? convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
      if (isAuthPage(request) && (await convexAuth.isAuthenticated())) {
        return nextjsMiddlewareRedirect(request, '/dashboard');
      }

      if (
        (isProtectedPage(request) || isProtectedApiRoute(request)) &&
        !(await convexAuth.isAuthenticated())
      ) {
        return nextjsMiddlewareRedirect(request, '/sign-in');
      }
    })
  : () => NextResponse.next();

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
};
