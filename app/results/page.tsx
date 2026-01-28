import Link from 'next/link';
import { MockModeBanner } from '@/components/MockModeBanner';

export default function ResultsPage() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Results</h1>
      <div className="mt-4">
        <MockModeBanner />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Results are now available per run.
      </p>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <Link className="underline" href="/upload">
          Go to Upload
        </Link>
        <Link className="underline" href="/dashboard">
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
