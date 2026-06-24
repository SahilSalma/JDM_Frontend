'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useInView } from 'framer-motion';

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function CountUp({
  end,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -32px 0px' });
  const animationRef = useRef<number | null>(null);
  const hasStarted = useRef(false);

  const animate = useCallback(() => {
    const startTime = performance.now();

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * end;

      setValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        setValue(end);
      }
    }

    animationRef.current = requestAnimationFrame(step);
  }, [end, duration]);

  useEffect(() => {
    if (isInView && !hasStarted.current) {
      hasStarted.current = true;
      animate();
    }
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInView, animate]);

  const formatted = (value ?? 0).toFixed(decimals);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
