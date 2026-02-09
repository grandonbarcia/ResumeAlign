import { JobUrlExtractor } from '@/components/JobUrlExtractor';
import { MockModeBanner } from '@/components/MockModeBanner';
import { ResumeUploader } from '@/components/ResumeUploader';
import { TailorRunner } from '@/components/TailorRunner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function UploadPage() {
  return (
    <div className="container max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Tailored Resume
        </h1>
        <p className="text-muted-foreground mt-2">
          Follow the steps below to generate an optimized resume.
        </p>
      </div>

      <MockModeBanner />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>{' '}
              Upload Resume
            </CardTitle>
            <CardDescription className="ml-10">
              Upload your base resume PDF. We extract the text safely.
            </CardDescription>
          </CardHeader>
          <CardContent className="ml-10">
            <ResumeUploader />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>{' '}
              Add Job Posting
            </CardTitle>
            <CardDescription className="ml-10">
              Paste the URL of the job description you want to target.
            </CardDescription>
          </CardHeader>
          <CardContent className="ml-10">
            <JobUrlExtractor />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>{' '}
              Run Tailoring
            </CardTitle>
            <CardDescription className="ml-10">
              Generate your analysis and tailored resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="ml-10">
            <TailorRunner />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
