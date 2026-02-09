import Link from 'next/link';
import { Button } from './ui/button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          <Button asChild variant="outline" size="sm">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
