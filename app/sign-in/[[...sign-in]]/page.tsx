import Link from 'next/link';
import { InlineAlert } from '@/components/InlineAlert';
import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <InlineAlert variant="info" title="Authentication removed">
          ResumeAlign no longer uses sign-in. Local app data is available
          without an account.
        </InlineAlert>
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
