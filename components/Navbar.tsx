'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { Button } from './ui/button';

function NavbarShell({ children }: { children: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center pl-4 sm:pl-8">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl inline-block">ResumeAlign</span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Dashboard
          </Link>
          <Link
            href="/upload"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            New Tailor
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4 pr-4 sm:pr-8">
          {children}
        </div>
      </div>
    </header>
  );
}

function NavbarWithAuth() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/');
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <NavbarShell>
      {!isLoading && isAuthenticated ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleSignOut()}
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Signing out…' : 'Sign Out'}
        </Button>
      ) : (
        <>
          <Button asChild variant="outline" size="sm">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </>
      )}
    </NavbarShell>
  );
}

function NavbarWithoutAuth() {
  return (
    <NavbarShell>
      <Button asChild variant="outline" size="sm">
        <Link href="/sign-in">Sign In</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/sign-up">Get Started</Link>
      </Button>
    </NavbarShell>
  );
}

export function Navbar({ authEnabled = true }: { authEnabled?: boolean }) {
  return authEnabled ? <NavbarWithAuth /> : <NavbarWithoutAuth />;
}
