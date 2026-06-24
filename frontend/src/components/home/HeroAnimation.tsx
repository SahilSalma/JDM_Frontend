'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { useTheme, type ResolvedTheme } from '@/components/providers/ThemeProvider';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

const TOTAL_FRAMES = 120;
const FRAME_Y_POSITION = 1.0;

type ConnectionQuality = 'slow-2g' | '2g' | '3g' | '4g';

const FRAME_PATHS: Record<ResolvedTheme, string> = {
  dark: '/images/hero-animation/',
  light: '/images/hero-animation-light/',
};

const FIRST_FRAME_SRCS: Record<ResolvedTheme, string> = {
  dark: '/images/hero-animation/frame-0001.webp',
  light: '/images/hero-animation-light/frame-0001.webp',
};

function getFrameSrc(basePath: string, index: number, quality: ConnectionQuality): string {
  const num = String(Math.min(Math.max(index, 1), TOTAL_FRAMES)).padStart(4, '0');
  const prefix = quality === '2g' ? 'quarter/' : quality === '3g' ? 'half/' : '';
  return `${basePath}${prefix}frame-${num}.webp`;
}

function getFirstFrameSrc(basePath: string, quality: ConnectionQuality): string {
  const prefix = quality === '2g' ? 'quarter/' : quality === '3g' ? 'half/' : '';
  return `${basePath}${prefix}frame-0001.webp`;
}



function useNetworkQuality(): ConnectionQuality {
  const [quality, setQuality] = useState<ConnectionQuality>('4g');

  useEffect(() => {
    const conn = (navigator as any)?.connection;
    if (!conn) return;

    const update = () => {
      const et = conn.effectiveType as ConnectionQuality;
      if (et === 'slow-2g' || et === '2g') setQuality(et);
      else if (et === '3g') setQuality('3g');
      else setQuality('4g');
    };

    update();
    conn.addEventListener('change', update);
    return () => conn.removeEventListener('change', update);
  }, []);

  return quality;
}

function useSaveData(): boolean {
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const conn = (navigator as any)?.connection;
    if (!conn) return;
    setSaveData(!!conn.saveData);
    const update = () => setSaveData(!!conn.saveData);
    conn.addEventListener('change', update);
    return () => conn.removeEventListener('change', update);
  }, []);

  return saveData;
}

function useBatchFramePreloader(
  basePath: string,
  disabled: boolean,
  quality: ConnectionQuality,
) {
  const frames = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const [firstBatchReady, setFirstBatchReady] = useState(false);
  const [allReady, setAllReady] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  const batchSize = quality === '2g' ? 5 : quality === '3g' ? 10 : 20;
  const skipFrames = quality === '2g' ? 3 : 1;

  useEffect(() => {
    if (disabled) return;

    frames.current = new Array(TOTAL_FRAMES).fill(null);
    setFirstBatchReady(false);
    setAllReady(false);
    setLoadedCount(0);

    let cancelled = false;
    let totalLoaded = 0;
    const loadedSet = new Set<number>();

    const loadBatch = (startIdx: number, onBatchComplete?: () => void) => {
      const endIdx = Math.min(startIdx + batchSize * skipFrames, TOTAL_FRAMES);
      let batchLoaded = 0;
      let batchTotal = 0;

      for (let i = startIdx; i < endIdx; i += skipFrames) {
        batchTotal++;
        const img = new Image();
        img.src = getFrameSrc(basePath, i + 1, quality);

        const handleDone = () => {
          if (cancelled) return;
          batchLoaded++;
          totalLoaded++;
          loadedSet.add(i);
          setLoadedCount(loadedSet.size);
          if (loadedSet.size >= Math.ceil(TOTAL_FRAMES / skipFrames)) setAllReady(true);
          if (batchLoaded === batchTotal) onBatchComplete?.();
        };

        img.onload = handleDone;
        img.onerror = handleDone;
        frames.current[i] = img;
      }
    };

    loadBatch(0, () => {
      if (!cancelled) setFirstBatchReady(true);

      let nextStart = batchSize * skipFrames;
      let batchCount = 0;

      const scheduleNext = () => {
        if (cancelled || nextStart >= TOTAL_FRAMES) return;
        const priority = batchCount < 1 ? 'high' : undefined;
        const fn = priority === 'high'
          ? (cb: () => void) => setTimeout(cb, 0)
          : (cb: () => void) => {
              if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(cb, { timeout: 500 });
              } else {
                setTimeout(cb, 30);
              }
            };

        fn(() => {
          const batchStart = nextStart;
          const effectiveBatch = quality === '2g' ? batchSize * 2 : batchSize;
          nextStart += effectiveBatch * skipFrames;
          batchCount++;
          loadBatch(batchStart, scheduleNext);
        });
      };

      scheduleNext();
    });

    return () => { cancelled = true; };
  }, [basePath, disabled, quality, batchSize, skipFrames]);

  return { frames: frames.current, firstBatchReady, allReady, skipFrames, loadedCount };
}

function useCanvasRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  frames: (HTMLImageElement | null)[],
  firstBatchReady: boolean,
  allReady: boolean,
  skipFrames: number,
) {
  const currentFrame = useRef(0);
  const firstDrawn = useRef(false);
  const [canvasVisible, setCanvasVisible] = useState(false);

  const renderFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const nearestIdx = Math.round(index / skipFrames) * skipFrames;
      const clampedIdx = Math.min(nearestIdx, TOTAL_FRAMES - 1);
      let img = frames[clampedIdx];

      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
          for (const dir of [1, -1]) {
            const altIdx = clampedIdx + offset * dir * skipFrames;
            if (altIdx < 0 || altIdx >= TOTAL_FRAMES) continue;
            const alt = frames[altIdx];
            if (alt && alt.complete && alt.naturalWidth > 0) {
              img = alt;
              break;
            }
          }
          if (img && img.complete && img.naturalWidth > 0) break;
        }
        if (!img || !img.complete || img.naturalWidth === 0) return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cW = canvas.width;
      const cH = canvas.height;
      const iW = img.naturalWidth;
      const iH = img.naturalHeight;
      const scale = Math.max(cW / iW, cH / iH) * 1.15;
      const w = iW * scale;
      const h = iH * scale;
      const x = (cW - w) / 2;
      const y = (cH - h) * FRAME_Y_POSITION;

      ctx.clearRect(0, 0, cW, cH);
      ctx.drawImage(img, x, y, w, h);
      currentFrame.current = index;

      if (!firstDrawn.current) {
        firstDrawn.current = true;
        setCanvasVisible(true);
      }
    },
    [canvasRef, frames, skipFrames],
  );

  useEffect(() => {
    firstDrawn.current = false;
    setCanvasVisible(false);
  }, [frames]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      if (firstDrawn.current) renderFrame(currentFrame.current);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [canvasRef, renderFrame]);

  useEffect(() => {
    if (firstBatchReady) renderFrame(0);
  }, [firstBatchReady, renderFrame]);

  useEffect(() => {
    if (allReady) renderFrame(currentFrame.current);
  }, [allReady, renderFrame]);

  return { renderFrame, canvasVisible };
}

function AnimatedText({
  text,
  className,
  delayBase = 0,
  wordDelay = 0.08,
}: {
  text: string;
  className?: string;
  delayBase?: number;
  wordDelay?: number;
}) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: delayBase + i * wordDelay,
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="inline-block mr-[0.25em] last:mr-0"
          aria-hidden="true"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export default function HeroAnimation() {
  const t = useTranslations('home');
  const { resolvedTheme } = useTheme();
  const { get: getSetting } = useSiteSettings();

  const heroTitle = getSetting('hero_title') || t('heroTitle');
  const heroSubtitle = getSetting('hero_subtitle') || t('heroSubtitle');
  const primaryBtnText = getSetting('hero_primary_btn_text') || t('shopEngines');
  const primaryBtnLink = getSetting('hero_primary_btn_link') || '/engines';
  const secondaryBtnText = getSetting('hero_secondary_btn_text') || t('shopTransmissions');
  const secondaryBtnLink = getSetting('hero_secondary_btn_link') || '/transmissions';

  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const staticImgRef = useRef<HTMLImageElement>(null);

  const connectionQuality = useNetworkQuality();
  const saveData = useSaveData();
  const isDark = resolvedTheme === 'dark';
  const framePath = FRAME_PATHS[resolvedTheme];
  const firstFrameSrc = getFirstFrameSrc(framePath, connectionQuality);

  const [prefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const shouldAnimate = !prefersReducedMotion && !saveData && connectionQuality !== 'slow-2g';

  const [staticLoaded, setStaticLoaded] = useState(false);
  const prevThemeRef = useRef(resolvedTheme);
  const animationReadyDispatched = useRef(false);

  useEffect(() => {
    if (prevThemeRef.current !== resolvedTheme) {
      prevThemeRef.current = resolvedTheme;
    }
  }, [resolvedTheme]);

  const readyThreshold = connectionQuality === '4g' ? 20 : 15;

  const { frames, firstBatchReady, allReady, skipFrames, loadedCount } = useBatchFramePreloader(
    framePath,
    !shouldAnimate,
    connectionQuality,
  );

  const maxWaitMs = connectionQuality === '4g' ? 3000 : 5000;

  useEffect(() => {
    if (animationReadyDispatched.current) return;
    if (!staticLoaded) return;
    if (shouldAnimate && loadedCount < readyThreshold) return;
    animationReadyDispatched.current = true;
    window.dispatchEvent(new CustomEvent('hero-animation-ready'));
  }, [staticLoaded, loadedCount, shouldAnimate, readyThreshold]);

  useEffect(() => {
    if (animationReadyDispatched.current || !shouldAnimate) return;
    const timer = setTimeout(() => {
      if (!animationReadyDispatched.current) {
        animationReadyDispatched.current = true;
        window.dispatchEvent(new CustomEvent('hero-animation-ready'));
      }
    }, maxWaitMs);
    return () => clearTimeout(timer);
  }, [shouldAnimate, maxWaitMs]);

  const { renderFrame, canvasVisible } = useCanvasRenderer(
    canvasRef,
    frames,
    firstBatchReady,
    allReady,
    skipFrames,
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const adjustedFrames = Math.ceil(TOTAL_FRAMES / skipFrames);
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, adjustedFrames - 1]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.15, 0.3], [1, 0.6, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  useMotionValueEvent(frameIndex, 'change', (latest) => {
    renderFrame(Math.round(latest) * skipFrames);
  });

  const staticScale = connectionQuality === '2g' ? 'scale(1.05)' : 'scale(1.15)';

  return (
    <section
      ref={sectionRef}
      className="relative bg-neutral-900"
      style={{ height: '300vh' }}
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ willChange: 'transform' }}
      >
        <img
          ref={staticImgRef}
          src={firstFrameSrc}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          onLoad={() => setStaticLoaded(true)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: 'center 100%',
            transform: staticScale,
            transformOrigin: 'center bottom',
            opacity: 1,
          }}
        />

        {shouldAnimate && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
            style={{
              opacity: canvasVisible ? 1 : 0,
              transition: 'opacity 0.1s ease',
              filter: isDark
                ? 'contrast(1.05) brightness(0.92) saturate(0.9)'
                : 'contrast(0.97) brightness(1.01)',
            }}
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          aria-hidden="true"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 75%, black 100%)'
              : 'radial-gradient(ellipse at center, transparent 50%, rgba(255,255,255,0.85) 80%, white 100%)',
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          aria-hidden="true"
          style={{
            background: isDark
              ? 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 70%), linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)'
              : 'linear-gradient(to right, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.5) 35%, transparent 65%), linear-gradient(to top, rgba(255,255,255,0.7) 0%, transparent 40%)',
          }}
        />

        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] h-px bg-gradient-to-r from-transparent via-[#DC2626]/60 to-transparent"
          aria-hidden="true"
        />

        <motion.div
          className="relative z-10 flex h-full items-center"
          style={{ opacity: textOpacity, y: textY }}
        >
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
            <div
              className={
                isDark
                  ? 'max-w-3xl rounded-2xl bg-black/40 p-6 backdrop-blur-sm sm:p-8'
                  : 'max-w-3xl rounded-2xl border border-white/40 bg-white/50 p-6 backdrop-blur-sm sm:p-8'
              }
            >
              <motion.div
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                className="mb-6 h-0.5 w-16 bg-[#DC2626]"
                aria-hidden="true"
              />

              <h1
                className={
                  isDark
                    ? 'font-heading text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl'
                    : 'font-heading text-4xl font-black uppercase leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl'
                }
              >
                <AnimatedText text={heroTitle} delayBase={0.2} wordDelay={0.07} />
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                className={
                  isDark
                    ? 'mt-4 text-base font-medium tracking-wider text-white/80 sm:text-lg md:text-xl'
                    : 'mt-4 text-base font-medium tracking-wider text-gray-700 sm:text-lg md:text-xl'
                }
              >
                {heroSubtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link
                  href={primaryBtnLink}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#DC2626] px-6 font-heading text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-red-900/30 transition-colors hover:bg-[#ef4444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/50"
                >
                  {primaryBtnText}
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href={secondaryBtnLink}
                  className={
                    isDark
                      ? 'inline-flex h-11 items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-6 font-heading text-sm font-bold uppercase tracking-widest text-white transition-colors hover:border-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                      : 'inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-gray-900/5 px-6 font-heading text-sm font-bold uppercase tracking-widest text-gray-900 transition-colors hover:border-gray-900 hover:bg-gray-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/30'
                  }
                >
                  {secondaryBtnText}
                  <ArrowRight className="size-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
          style={{ opacity: textOpacity }}
          aria-hidden="true"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className={
              isDark
                ? 'flex h-8 w-5 items-start justify-center rounded-full border border-white/30 pt-1.5'
                : 'flex h-8 w-5 items-start justify-center rounded-full border border-gray-400/50 pt-1.5'
            }
          >
            <div
              className={
                isDark
                  ? 'h-2 w-0.5 rounded-full bg-white/50'
                  : 'h-2 w-0.5 rounded-full bg-gray-500/50'
              }
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
