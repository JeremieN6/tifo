'use client';

import { useEffect } from 'react';
import { recordFirstTouch } from '@/lib/first-touch';

export default function FirstTouchTracker() {
  useEffect(() => {
    recordFirstTouch();
  }, []);

  return null;
}
