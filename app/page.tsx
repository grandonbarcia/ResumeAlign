import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Upload, Wand2, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center mx-auto px-4">
          <h1 className="font-sans font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            Tailor your resume for every job application
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Stop sending generic resumes. ResumeAlign uses AI to analyze job
            descriptions and optimize your resume keywords, skills, and summary
            to pass ATS checks.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/upload">Start Tailoring</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container space-y-6 py-8 md:py-12 lg:py-24 mx-auto px-4">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-sans font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
            How it works
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            A simple 3-step pipeline to get you hired faster.
          </p>
        </div>

        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <Card>
            <CardHeader>
              <Upload className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>1. Upload & Paste</CardTitle>
              <CardDescription>
                Upload your existing resume PDF and paste the job description
                URL.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Wand2 className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>2. AI Analysis</CardTitle>
              <CardDescription>
                We extract keywords and identify gaps between your profile and
                the job.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle2 className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>3. Get Tailored PDF</CardTitle>
              <CardDescription>
                Receive a perfectly optimized resume ready for application.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
