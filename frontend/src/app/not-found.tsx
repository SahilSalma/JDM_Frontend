'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Home, Search, ArrowLeft, Gauge } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Floating particle component                                       */
/* ------------------------------------------------------------------ */
function Particle({ delay, isDark }: { delay: number; isDark: boolean }) {
  const style = useMemo(() => {
    const left = Math.random() * 100;
    const size = Math.random() * 4 + 2;
    const duration = Math.random() * 6 + 8;
    return { left: `${left}%`, width: size, height: size, duration, delay };
  }, [delay]);

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: style.left,
        width: style.width,
        height: style.height,
        background: isDark
          ? 'rgba(220, 38, 38, 0.3)'
          : 'rgba(220, 38, 38, 0.2)',
      }}
      initial={{ bottom: -20, opacity: 0 }}
      animate={{
        bottom: ['0%', '100%'],
        opacity: [0, 0.8, 0],
        x: [0, Math.random() * 60 - 30, 0],
      }}
      transition={{
        duration: style.duration,
        delay: style.delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Animated tachometer needle                                        */
/* ------------------------------------------------------------------ */
function TachNeedle({ isDark }: { isDark: boolean }) {
  return (
    <div className="relative flex items-center justify-center mb-8">
      {/* Outer glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${
            isDark ? 'rgba(220,38,38,0.15)' : 'rgba(220,38,38,0.08)'
          } 0%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Gauge circle */}
      <div
        className="relative flex items-center justify-center rounded-full border-2"
        style={{
          width: 160,
          height: 160,
          borderColor: isDark ? 'rgba(220,38,38,0.4)' : 'rgba(220,38,38,0.25)',
          background: isDark
            ? 'rgba(10,10,10,0.8)'
            : 'rgba(255,255,255,0.8)',
        }}
      >
        {/* Tick marks */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: 2,
              height: i % 3 === 0 ? 14 : 8,
              background:
                i >= 9
                  ? '#DC2626'
                  : isDark
                  ? 'rgba(255,255,255,0.3)'
                  : 'rgba(0,0,0,0.2)',
              top: 8,
              left: '50%',
              transformOrigin: '50% 72px',
              transform: `translateX(-50%) rotate(${i * 30 - 90}deg)`,
            }}
          />
        ))}

        {/* Animated needle */}
        <motion.div
          className="absolute"
          style={{
            width: 3,
            height: 55,
            background: 'linear-gradient(to top, #DC2626, #EF4444)',
            bottom: '50%',
            left: '50%',
            transformOrigin: '50% 100%',
            borderRadius: 4,
          }}
          animate={{ rotate: [-120, 120, -90, 100, -120] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: 0.5,
          }}
        />

        {/* Center cap */}
        <div
          className="absolute rounded-full z-10"
          style={{
            width: 14,
            height: 14,
            background: isDark ? '#262626' : '#e5e7eb',
            border: '2px solid #DC2626',
          }}
        />

        {/* 404 text inside gauge */}
        <motion.span
          className="absolute font-heading text-2xl font-black tracking-wider"
          style={{
            color: '#DC2626',
            bottom: 28,
          }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          404
        </motion.span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main 404 page                                                     */
/* ------------------------------------------------------------------ */
export default function NotFound() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkDark = () =>
      document.documentElement.classList.contains('dark');
    setIsDark(checkDark());

    const observer = new MutationObserver(() => setIsDark(checkDark()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 transition-colors duration-500"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.08) 0%, #000 60%)'
          : 'radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.05) 0%, #fff 60%)',
      }}
    >
      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <Particle key={i} delay={i * 0.4} isDark={isDark} />
        ))}
      </div>

      {/* Horizontal racing stripes */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-0 h-[1px] opacity-20"
          style={{
            top: '25%',
            background: `linear-gradient(to right, transparent, #DC2626, transparent)`,
            width: '100%',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute left-0 h-[1px] opacity-10"
          style={{
            top: '75%',
            background: `linear-gradient(to right, transparent, #DC2626, transparent)`,
            width: '100%',
          }}
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {/* Tachometer */}
        <TachNeedle isDark={isDark} />

        {/* Glitch-style heading */}
        <motion.div className="relative mb-3">
          <h1
            className="font-heading text-7xl font-black uppercase tracking-widest sm:text-8xl"
            style={{ color: isDark ? '#fff' : '#111827' }}
          >
            <motion.span
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3 }}
            >
              LOST
            </motion.span>
          </h1>
          {/* Glitch shadow layers */}
          <motion.h1
            className="pointer-events-none absolute inset-0 font-heading text-7xl font-black uppercase tracking-widest sm:text-8xl"
            style={{ color: '#DC2626', clipPath: 'inset(0 0 50% 0)' }}
            animate={{ x: [-2, 2, 0] }}
            transition={{
              duration: 0.1,
              repeat: Infinity,
              repeatDelay: 4,
            }}
            aria-hidden
          >
            LOST
          </motion.h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="mb-2 text-lg font-medium tracking-wide sm:text-xl"
          style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(17,24,39,0.6)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Wrong turn on the touge.
        </motion.p>

        <motion.p
          className="mb-8 max-w-md text-sm"
          style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(17,24,39,0.4)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col gap-3 sm:flex-row sm:gap-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg px-6 py-3 font-heading text-sm font-bold uppercase tracking-wider text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-600/30"
            style={{
              background: 'linear-gradient(135deg, #DC2626, #991B1B)',
            }}
          >
            <Home className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Back to Home
          </Link>

          <Link
            href="/engines"
            className="group inline-flex items-center gap-2 rounded-lg border px-6 py-3 font-heading text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105"
            style={{
              borderColor: isDark ? 'rgba(220,38,38,0.3)' : 'rgba(220,38,38,0.2)',
              color: isDark ? '#fff' : '#111827',
              background: isDark ? 'rgba(220,38,38,0.05)' : 'rgba(220,38,38,0.03)',
            }}
          >
            <Gauge className="size-4 text-[#DC2626] transition-transform duration-300 group-hover:rotate-12" />
            Browse Engines
          </Link>

          <Link
            href="/search"
            className="group inline-flex items-center gap-2 rounded-lg border px-6 py-3 font-heading text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,24,39,0.6)',
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            }}
          >
            <Search className="size-4 transition-transform duration-300 group-hover:scale-110" />
            Search Parts
          </Link>
        </motion.div>

        {/* Go back link */}
        <motion.button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-mono tracking-wide transition-colors duration-300 cursor-pointer"
          style={{
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(17,24,39,0.3)',
          }}
          whileHover={{
            color: '#DC2626',
            x: -3,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <ArrowLeft className="size-3" />
          or go back to previous page
        </motion.button>
      </motion.div>

      {/* Bottom racing stripe accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(to right, transparent, #DC2626, transparent)',
          opacity: isDark ? 0.3 : 0.15,
        }}
      />
    </div>
  );
}
