import Link from 'next/link';

import { AuthProvidersCard } from '@/components/AuthProvidersCard';
import { InlineAlert } from '@/components/InlineAlert';
import { Button } from '@/components/ui/button';

export default function Page() {
  const hasConvex = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  if (!hasConvex) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <InlineAlert variant="warning" title="Authentication not configured">
            Convex Auth requires{' '}
            <span className="font-mono">NEXT_PUBLIC_CONVEX_URL</span> locally,
            plus OAuth provider secrets and auth keys on your Convex deployment.
          </InlineAlert>
          <div className="flex justify-end">
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <AuthProvidersCard
        title="Sign in to ResumeAlign"
        description="Use Google or GitHub to access your saved resumes, jobs, and tailoring runs."
      />
    </main>
  );
}
