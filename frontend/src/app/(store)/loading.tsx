'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function Loading() {
  const [isMounted, setIsMounted] = useState(false);

  let isDark = true;
  try {
    const { resolvedTheme } = useTheme();
    isDark = resolvedTheme === 'dark';
  } catch {
    if (typeof window !== 'undefined') {
      isDark = document.documentElement.classList.contains('dark');
    }
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors duration-300 ${
      isDark ? 'bg-[#0a0a0a]' : 'bg-[#fcfcfc]'
    }`}>
      {/* Logo animation wrapper */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Pulsing ring behind the logo */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: isDark ? [0.15, 0.4, 0.15] : [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute size-48 rounded-full bg-[#DC2626] blur-3xl"
        />

        {/* Logo image */}
        <motion.img
          animate={{
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          src={
            isDark
              ? '/logo/finallogo-whitelettering-transparent.png'
              : '/logo/finallogo-blacklettering-transparent.png'
          }
          alt="Loading..."
          className="h-16 w-auto object-contain relative z-10"
        />

        {/* Sleek loader text */}
        <span className="mt-4 text-xs font-mono tracking-widest text-[#DC2626]/80 uppercase animate-pulse">
          Loading
        </span>
      </div>
    </div>
  );
}
