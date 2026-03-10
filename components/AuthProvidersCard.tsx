'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { InlineAlert } from '@/components/InlineAlert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Provider = 'google' | 'github';

export function AuthProvidersCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [pendingProvider, setPendingProvider] = React.useState<Provider | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
      router.refresh();
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleSignIn(provider: Provider) {
    setPendingProvider(provider);
    setError(null);

    try {
      const result = await signIn(provider, { redirectTo: '/dashboard' });
      if (result.redirect) {
        window.location.assign(result.redirect.toString());
      }
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'Authentication failed.',
      );
      setPendingProvider(null);
    }
  }

  if (!isLoading && isAuthenticated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Signed in</CardTitle>
          <CardDescription>
            Your session is active. Continue to the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}

        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={Boolean(pendingProvider) || isLoading}
            onClick={() => void handleSignIn('google')}
            className="justify-center"
          >
            {pendingProvider === 'google' ? (
              <Loader2 className="animate-spin" />
            ) : null}
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={Boolean(pendingProvider) || isLoading}
            onClick={() => void handleSignIn('github')}
            className="justify-center"
          >
            {pendingProvider === 'github' ? (
              <Loader2 className="animate-spin" />
            ) : null}
            Continue with GitHub
          </Button>
        </div>

        <p className="text-xs text-slate-500">
          OAuth is limited to Google and GitHub for this app.
        </p>
      </CardContent>
    </Card>
  );
}
