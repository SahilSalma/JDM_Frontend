'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';

const MIN_DISPLAY_MS = 800;
const MAX_DISPLAY_MS = 15000;

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const mountedAt = useRef(0);

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
    mountedAt.current = Date.now();

    let dismissed = false;

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      const elapsed = Date.now() - mountedAt.current;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => {
        setLoading(false);
        document.body.style.overflow = '';
      }, remaining);
    };

    window.addEventListener('hero-animation-ready', dismiss);

    const fallbackTimer = setTimeout(dismiss, MAX_DISPLAY_MS);

    return () => {
      window.removeEventListener('hero-animation-ready', dismiss);
      clearTimeout(fallbackTimer);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden pointer-events-none"
        >
          <motion.div
            initial={{ x: 0 }}
            exit={{
              x: '-100%',
              transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] },
            }}
            className={`absolute top-0 bottom-0 left-0 w-1/2 pointer-events-auto ${
              isDark ? 'bg-[#0a0a0a]' : 'bg-[#fcfcfc]'
            }`}
          />

          <motion.div
            initial={{ x: 0 }}
            exit={{
              x: '100%',
              transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] },
            }}
            className={`absolute top-0 bottom-0 right-0 w-1/2 pointer-events-auto ${
              isDark ? 'bg-[#0a0a0a]' : 'bg-[#fcfcfc]'
            }`}
          />

          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 0.85,
              transition: { duration: 0.5, ease: 'easeIn' },
            }}
            className="relative flex flex-col items-center justify-center pointer-events-auto z-10"
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: isDark ? [0.15, 0.4, 0.15] : [0.1, 0.25, 0.1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute size-56 rounded-full bg-[#DC2626] blur-3xl"
            />

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
              }}
              src={
                isDark
                  ? '/logo/finallogo-whitelettering-transparent.png'
                  : '/logo/finallogo-blacklettering-transparent.png'
              }
              alt="JDM Tokyo Motorsports"
              className="h-24 w-auto object-contain relative z-10"
            />

            <div className={`mt-8 w-48 h-[2px] rounded-full overflow-hidden relative z-10 ${
              isDark ? 'bg-muted-foreground/10' : 'bg-muted-foreground/20'
            }`}>
              <motion.div
                initial={{ left: '-100%' }}
                animate={{ left: '100%' }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-[#DC2626] to-transparent"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
