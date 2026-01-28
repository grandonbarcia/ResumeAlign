import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const hasClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (hasClerkKeys) {
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');
  }

  return children;
}
