'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImage {
  image_path: string;
  alt_text: string;
}

interface ProductGalleryProps {
  images: ProductImage[];
  primaryImage: string;
}

// ---------------------------------------------------------------------------
// Lightbox overlay
// ---------------------------------------------------------------------------

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: ProductImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        <X className="size-6" />
      </button>

      {/* Prev / Next arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            aria-label="Next image"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      {/* Image */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={index}
          src={images[index].image_path}
          alt={images[index].alt_text}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        />
      </AnimatePresence>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/80">
          {index + 1} / {images.length}
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Gallery
// ---------------------------------------------------------------------------

export default function ProductGallery({ images, primaryImage }: ProductGalleryProps) {
  const allImages: ProductImage[] = images.length > 0
    ? images
    : primaryImage
      ? [{ image_path: primaryImage, alt_text: 'Product image' }]
      : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleThumbnailClick = useCallback((idx: number) => {
    setActiveIndex(idx);
  }, []);

  const handleMainImageClick = useCallback(() => {
    setLightboxOpen(true);
  }, []);

  if (allImages.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-border bg-card">
        <div className="flex flex-col items-center gap-3 text-muted-foreground/30">
          <Camera className="size-16" />
          <span className="text-sm font-medium">No image available</span>
        </div>
      </div>
    );
  }

  const active = allImages[activeIndex];

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Main image */}
        <div
          className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-card cursor-pointer group"
          onClick={handleMainImageClick}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={activeIndex}
              src={active.image_path}
              alt={active.alt_text}
              itemProp="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full w-full object-cover transition-all duration-300 group-hover:brightness-105"
            />
          </AnimatePresence>

          {/* Click to expand hint */}
          <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white/80">
            Click to expand
          </div>
        </div>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => handleThumbnailClick(idx)}
                className={cn(
                  'relative h-24 w-24 shrink-0 overflow-hidden rounded border-2 bg-card transition-all',
                  idx === activeIndex
                    ? 'border-[#DC2626]'
                    : 'border-border opacity-60 hover:opacity-100'
                )}
                aria-label={img.alt_text}
              >
                <img
                  src={img.image_path}
                  alt={img.alt_text}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={allImages}
            initialIndex={activeIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
