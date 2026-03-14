import { NextResponse } from 'next/server';

export const proxy = () => NextResponse.next();

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
};
