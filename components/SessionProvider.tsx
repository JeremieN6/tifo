'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import PostHogProvider from '@/components/PostHogProvider';

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <PostHogProvider>{children}</PostHogProvider>
    </NextAuthSessionProvider>
  );
}
