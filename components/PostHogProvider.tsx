'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import posthog from 'posthog-js';

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (!posthogKey) return;

    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
    });
  }, []);

  useEffect(() => {
    if (!posthogKey || !pathname) return;

    const queryString = window.location.search.replace(/^\?/, '');
    const currentUrl = `${window.location.origin}${pathname}${queryString ? `?${queryString}` : ''}`;
    posthog.capture('$pageview', { $current_url: currentUrl });
  }, [pathname]);

  useEffect(() => {
    if (!posthogKey) return;
    if (status !== 'authenticated' || !session?.user?.id) return;

    posthog.identify(session.user.id, {
      email: session.user.email,
      name: session.user.name,
    });
  }, [status, session?.user?.id, session?.user?.email, session?.user?.name]);

  if (!posthogKey) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
