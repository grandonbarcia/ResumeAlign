import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-3xl font-semibold">ResumeAlign</h1>
      <p className="mt-2 text-slate-600">
        Upload your resume, paste a job URL, and get an ATS-friendly tailored
        version with transparent diffs.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/upload"
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800 sm:w-auto"
        >
          Start
        </Link>
        <Link
          href="/dashboard"
          className="w-full rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-900 hover:bg-slate-50 sm:w-auto"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
