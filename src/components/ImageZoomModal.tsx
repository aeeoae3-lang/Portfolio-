import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  Maximize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface GallerySlide {
  id: string;
  imageUrl: string;
  caption?: string;
  notes?: string;
}

interface ImageZoomModalProps {
  isOpen: boolean;
  imageUrl: string;
  title: string;
  subtitle?: string;
  badge?: string;
  photos?: GallerySlide[];
  initialIndex?: number;
  onClose: () => void;
  onOpenDetails?: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
const DOUBLE_TAP_ZOOM = 2.5;
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80';

function clampZoom(val: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(val * 100) / 100));
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  imageUrl,
  title,
  subtitle,
  badge,
  photos,
  initialIndex = 0,
  onClose,
  onOpenDetails
}) => {
  const slides: GallerySlide[] =
    photos && photos.length > 0
      ? photos
      : imageUrl
      ? [{ id: 'single', imageUrl, caption: badge }]
      : [];

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; initialScale: number } | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const touchMovedRef = useRef(false);

  const hasMultiple = slides.length > 1;
  const safeIndex = slides.length > 0 ? Math.min(Math.max(0, currentIndex), slides.length - 1) : 0;
  const activeSlide = slides[safeIndex];
  const activeImageUrl = activeSlide?.imageUrl || imageUrl;

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goToIndex = useCallback(
    (nextIdx: number) => {
      if (slides.length <= 1) return;
      const wrapped = ((nextIdx % slides.length) + slides.length) % slides.length;
      setCurrentIndex(wrapped);
      resetZoom();
    },
    [slides.length, resetZoom]
  );

  const handlePrev = useCallback(() => {
    goToIndex(safeIndex - 1);
  }, [goToIndex, safeIndex]);

  const handleNext = useCallback(() => {
    goToIndex(safeIndex + 1);
  }, [goToIndex, safeIndex]);

  const applyZoom = useCallback((nextScale: number) => {
    const clamped = clampZoom(nextScale);
    setScale(clamped);
    if (clamped <= 1) {
      setOffset({ x: 0, y: 0 });
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale(prev => clampZoom(prev + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const next = clampZoom(prev - ZOOM_STEP);
      if (next <= 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleToggleDoubleZoom = useCallback(() => {
    setScale(prev => {
      if (prev > 1.05) {
        setOffset({ x: 0, y: 0 });
        return 1;
      }
      return DOUBLE_TAP_ZOOM;
    });
  }, []);

  // Initialize slide index and zoom whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const clampedStart =
        slides.length > 0 ? Math.min(Math.max(0, initialIndex), slides.length - 1) : 0;
      setCurrentIndex(clampedStart);
      resetZoom();
    }
  }, [isOpen, initialIndex, slides.length, resetZoom]);

  // Keyboard support: Escape to close, Left/Right arrows to swipe, +/- to zoom, 0 to reset
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' && hasMultiple) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' && hasMultiple) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasMultiple, onClose, handleNext, handlePrev, handleZoomIn, handleZoomOut, resetZoom]);

  if (!isOpen) return null;

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    applyZoom(scale + delta);
  };

  // Mouse pan (when zoomed) OR mouse horizontal swipe (when unzoomed and multiple slides)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        origX: offset.x,
        origY: offset.y
      };
    } else if (hasMultiple) {
      swipeStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: dragStartRef.current.origX + dx,
      y: dragStartRef.current.origY + dy
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (swipeStartRef.current && scale <= 1.05 && hasMultiple) {
      const dx = e.clientX - swipeStartRef.current.x;
      const dy = e.clientY - swipeStartRef.current.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (dx < 0) handleNext();
        else handlePrev();
      }
    }
    swipeStartRef.current = null;
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Mobile pinch-to-zoom, pan, swipe left/right, and double-tap handlers
  const getTouchDistance = (touches: React.TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchMovedRef.current = false;
    if (e.touches.length === 2) {
      pinchStartRef.current = {
        distance: getTouchDistance(e.touches),
        initialScale: scale
      };
      dragStartRef.current = null;
      swipeStartRef.current = null;
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          origX: offset.x,
          origY: offset.y
        };
        swipeStartRef.current = null;
      } else {
        swipeStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchMovedRef.current = true;
    if (e.touches.length === 2 && pinchStartRef.current) {
      const currentDist = getTouchDistance(e.touches);
      if (pinchStartRef.current.distance > 0) {
        const ratio = currentDist / pinchStartRef.current.distance;
        applyZoom(pinchStartRef.current.initialScale * ratio);
      }
    } else if (e.touches.length === 1 && dragStartRef.current && scale > 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setOffset({
        x: dragStartRef.current.origX + dx,
        y: dragStartRef.current.origY + dy
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      pinchStartRef.current = null;
    }
    if (e.touches.length === 0) {
      dragStartRef.current = null;

      // Check horizontal swipe when unzoomed and multiple slides exist
      if (swipeStartRef.current && scale <= 1.05 && hasMultiple && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - swipeStartRef.current.x;
        const dy = touch.clientY - swipeStartRef.current.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          swipeStartRef.current = null;
          if (dx < 0) handleNext();
          else handlePrev();
          return;
        }
      }
      swipeStartRef.current = null;

      // Clean double-tap zoom toggle
      if (!touchMovedRef.current && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const now = Date.now();
        const gap = now - lastTapRef.current.time;
        const dist = Math.hypot(touch.clientX - lastTapRef.current.x, touch.clientY - lastTapRef.current.y);
        if (gap > 0 && gap < 320 && dist < 30) {
          handleToggleDoubleZoom();
          lastTapRef.current = { time: 0, x: 0, y: 0 };
        } else {
          lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
        }
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-stone-950/95 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Fullscreen gallery for ${title}`}
      data-testid="image-zoom-modal"
      data-zoom-scale={scale.toFixed(2)}
      data-slide-index={safeIndex}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Top Toolbar */}
      <div className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="min-w-0 flex items-center gap-2.5 flex-wrap">
          {badge && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shrink-0">
              {badge}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-white truncate">
                {title}
              </h2>
              {hasMultiple && (
                <span
                  data-testid="gallery-counter"
                  className="px-2 py-0.5 rounded-md bg-white/15 text-emerald-200 text-xs font-bold tabular-nums shrink-0"
                >
                  {safeIndex + 1} / {slides.length}
                </span>
              )}
            </div>
            {(activeSlide?.caption || subtitle) && (
              <p className="text-xs sm:text-sm text-emerald-300 truncate flex items-center gap-1.5">
                {activeSlide?.caption && (
                  <span data-testid="gallery-caption" className="font-bold not-italic text-white">
                    {activeSlide.caption}
                  </span>
                )}
                {activeSlide?.caption && subtitle && <span className="text-stone-500">·</span>}
                {subtitle && <span className="italic font-serif">{subtitle}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenDetails && (
            <button
              type="button"
              onClick={onOpenDetails}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Crop Info</span>
              <span className="sm:hidden">Info</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-colors cursor-pointer"
            aria-label="Close zoomed photo"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Main Uncropped Zoomable & Swipeable Image Canvas */}
      <div
        className={`relative flex-1 flex items-center justify-center overflow-hidden p-3 sm:p-8 touch-none ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
        onWheel={handleWheel}
        onDoubleClick={handleToggleDoubleZoom}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (e.target === e.currentTarget && scale <= 1) {
            onClose();
          }
        }}
      >
        {/* Previous Photo Arrow */}
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous photo"
            className="absolute left-2 sm:left-5 z-20 p-2.5 sm:p-3 rounded-full bg-black/55 hover:bg-emerald-600 text-white border border-white/20 backdrop-blur-md shadow-xl transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        <img
          src={activeImageUrl}
          alt={activeSlide?.caption ? `${title} - ${activeSlide.caption}` : title}
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)'
          }}
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl"
        />

        {/* Next Photo Arrow */}
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next photo"
            className="absolute right-2 sm:right-5 z-20 p-2.5 sm:p-3 rounded-full bg-black/55 hover:bg-emerald-600 text-white border border-white/20 backdrop-blur-md shadow-xl transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Bottom Controls, Caption Notes & Thumbnail Strip */}
      <div className="relative z-20 px-4 py-3 sm:py-4 bg-gradient-to-t from-black/90 via-black/75 to-transparent flex flex-col items-center gap-2.5">
        {activeSlide?.notes && (
          <p className="text-xs sm:text-sm text-stone-200 text-center max-w-2xl px-3">
            {activeSlide.notes}
          </p>
        )}

        {hasMultiple && (
          <div
            className="flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1"
            role="tablist"
            aria-label="Gallery thumbnails"
          >
            {slides.map((slide, idx) => {
              const isCurrent = idx === safeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToIndex(idx)}
                  aria-label={`View photo ${idx + 1}: ${slide.caption || title}`}
                  aria-selected={isCurrent}
                  className={`relative w-12 h-10 sm:w-14 sm:h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-emerald-400 ring-2 ring-emerald-400/40 scale-105'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.caption || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <div className="inline-flex items-center gap-1.5 bg-stone-900/90 border border-white/15 rounded-2xl p-1.5 shadow-xl backdrop-blur-md">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= MIN_ZOOM}
              aria-label="Zoom out"
              className="p-2 rounded-xl text-white hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <span
              className="px-3 text-xs sm:text-sm font-bold text-emerald-300 tabular-nums min-w-[60px] text-center"
              data-testid="zoom-percentage"
            >
              {Math.round(scale * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= MAX_ZOOM}
              aria-label="Zoom in"
              className="p-2 rounded-xl text-white hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="w-px h-5 bg-white/15 mx-0.5" />

            <button
              type="button"
              onClick={resetZoom}
              disabled={scale === 1 && offset.x === 0 && offset.y === 0}
              aria-label="Reset zoom"
              className="px-2.5 py-2 rounded-xl text-xs font-bold text-stone-200 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-400">
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {hasMultiple
                ? 'Swipe or use arrows to browse · Pinch, scroll, or double-tap to zoom'
                : 'Pinch, scroll, or double-tap to zoom · Drag to pan'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
