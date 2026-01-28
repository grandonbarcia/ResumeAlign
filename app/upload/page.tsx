import { JobUrlExtractor } from '@/components/JobUrlExtractor';
import { MockModeBanner } from '@/components/MockModeBanner';
import { ResumeUploader } from '@/components/ResumeUploader';
import { TailorRunner } from '@/components/TailorRunner';

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Upload resume</h1>
      <div className="mt-4">
        <MockModeBanner />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Step 1: Upload your resume. We’ll extract text safely (no
        hallucinations).
      </p>

      <div className="mt-6">
        <ResumeUploader />
      </div>

      <hr className="my-10 border-slate-200" />

      <h2 className="text-xl font-semibold">Add job posting</h2>
      <p className="mt-2 text-sm text-slate-600">
        Step 2: Paste the job URL. We’ll extract and structure it.
      </p>

      <div className="mt-6">
        <JobUrlExtractor />
      </div>

      <hr className="my-10 border-slate-200" />

      <h2 className="text-xl font-semibold">Run tailoring</h2>
      <p className="mt-2 text-sm text-slate-600">
        Step 3: Use your saved ids to run the multi-step tailoring pipeline.
      </p>

      <div className="mt-6">
        <TailorRunner />
      </div>
    </main>
  );
}
