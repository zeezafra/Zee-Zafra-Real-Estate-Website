"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react";
import { useFocusTrap } from "@/lib/useFocusTrap";

type Props = {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

// Minimum horizontal drag (px) before a touch gesture counts as a swipe
// rather than a tap/scroll — mirrors common lightbox thresholds without
// needing a gesture library.
const SWIPE_THRESHOLD = 50;
// Scale applied by a click/double-tap toggle (desktop click, mobile
// double-tap). Pinch can go further, up to MAX_SCALE.
const CLICK_ZOOM_SCALE = 2.5;
const MAX_SCALE = 3;
const DOUBLE_TAP_WINDOW_MS = 300;
// A mouse click that moves less than this many px counts as a tap
// (toggles zoom) rather than a drag (pans).
const CLICK_MOVE_TOLERANCE = 6;

function distance(a: React.Touch, b: React.Touch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type Point = { x: number; y: number };
type GestureMode = "idle" | "swipe" | "pan" | "pinch";

// Fullscreen viewer for PropertyGallery's main image / thumbnails. Follows
// the same dialog conventions as InquiryModal/ViewingModal (role="dialog",
// useFocusTrap, restore focus to the trigger on close) rather than
// introducing a new modal pattern.
export default function ImageLightbox({ images, initialIndex, isOpen, onClose, title }: Props) {
  const [index, setIndex] = useState(initialIndex);
  // -1/1 drives the enter-slide direction (see globals.css); 0 for a
  // direct jump (thumbnail click, initial open) where a slide direction
  // doesn't make sense.
  const [direction, setDirection] = useState(0);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Mutable gesture bookkeeping that shouldn't trigger re-renders on every
  // pointermove — only the derived scale/translate state above does.
  const gesture = useRef<{
    mode: GestureMode;
    startX: number;
    startY: number;
    startTranslate: Point;
    startDistance: number;
    startScale: number;
    moved: boolean;
    lastTapAt: number;
  }>({
    mode: "idle",
    startX: 0,
    startY: 0,
    startTranslate: { x: 0, y: 0 },
    startDistance: 0,
    startScale: 1,
    moved: false,
    lastTapAt: 0,
  });

  useFocusTrap(panelRef, isOpen);

  const hasMultiple = images.length > 1;
  const zoomed = scale > 1;

  function resetZoom() {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  function showPrev() {
    setDirection(-1);
    setIndex((i) => (i - 1 + images.length) % images.length);
  }

  function showNext() {
    setDirection(1);
    setIndex((i) => (i + 1) % images.length);
  }

  function goTo(i: number) {
    if (i === index) return;
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  }

  // Clamp panning so the zoomed image can't be dragged further than its
  // own overhang — approximated from the display box's own size, since
  // object-contain means the true rendered image size isn't known without
  // decoding it. Good enough for a lightbox; not pixel-perfect.
  function clampTranslate(point: Point, atScale: number): Point {
    const rect = imageWrapperRef.current?.getBoundingClientRect();
    if (!rect || atScale <= 1) return { x: 0, y: 0 };
    const maxX = (rect.width * (atScale - 1)) / 2;
    const maxY = (rect.height * (atScale - 1)) / 2;
    return { x: clamp(point.x, -maxX, maxX), y: clamp(point.y, -maxY, maxY) };
  }

  function toggleZoomAt(clientX: number, clientY: number) {
    if (zoomed) {
      resetZoom();
      return;
    }
    const rect = imageWrapperRef.current?.getBoundingClientRect();
    if (!rect) {
      setScale(CLICK_ZOOM_SCALE);
      return;
    }
    const offsetX = clientX - (rect.left + rect.width / 2);
    const offsetY = clientY - (rect.top + rect.height / 2);
    setScale(CLICK_ZOOM_SCALE);
    setTranslate(
      clampTranslate(
        {
          x: (-offsetX * (CLICK_ZOOM_SCALE - 1)) / CLICK_ZOOM_SCALE,
          y: (-offsetY * (CLICK_ZOOM_SCALE - 1)) / CLICK_ZOOM_SCALE,
        },
        CLICK_ZOOM_SCALE
      )
    );
  }

  // Reset to whichever image was clicked, remember the trigger for focus
  // return, and lock page scroll while open — same lifecycle InquiryModal
  // uses.
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement;
    setIndex(initialIndex);
    setDirection(0);
    document.body.classList.add("overflow-hidden");
    const focusTimer = setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      clearTimeout(focusTimer);
      document.body.classList.remove("overflow-hidden");
      triggerRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Every time the active photo changes, drop any zoom/pan left over from
  // the previous one and show a spinner until the new one has actually
  // painted.
  useEffect(() => {
    resetZoom();
    setLoaded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (hasMultiple && e.key === "ArrowLeft") showPrev();
      if (hasMultiple && e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose, hasMultiple]);

  if (!isOpen) return null;

  const nextIndex = (index + 1) % images.length;
  const prevIndex = (index - 1 + images.length) % images.length;

  function handleTouchStart(e: React.TouchEvent) {
    const g = gesture.current;
    if (e.touches.length === 2) {
      g.mode = "pinch";
      g.startDistance = distance(e.touches[0], e.touches[1]);
      g.startScale = scale;
      return;
    }
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      g.startX = touch.clientX;
      g.startY = touch.clientY;
      g.moved = false;

      if (zoomed) {
        g.mode = "pan";
        g.startTranslate = translate;
      } else {
        g.mode = "swipe";
      }

      const now = Date.now();
      if (now - g.lastTapAt < DOUBLE_TAP_WINDOW_MS) {
        g.lastTapAt = 0;
        toggleZoomAt(touch.clientX, touch.clientY);
      } else {
        g.lastTapAt = now;
      }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    const g = gesture.current;
    if (g.mode === "pinch" && e.touches.length === 2) {
      const dist = distance(e.touches[0], e.touches[1]);
      const next = clamp((dist / g.startDistance) * g.startScale, 1, MAX_SCALE);
      setScale(next);
      setTranslate((t) => clampTranslate(t, next));
    } else if (g.mode === "pan" && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - g.startX;
      const dy = touch.clientY - g.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) g.moved = true;
      setTranslate(
        clampTranslate({ x: g.startTranslate.x + dx, y: g.startTranslate.y + dy }, scale)
      );
    } else if (g.mode === "swipe" && e.touches.length === 1) {
      const touch = e.touches[0];
      if (Math.abs(touch.clientX - g.startX) > 3) g.moved = true;
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const g = gesture.current;
    if (g.mode === "swipe") {
      const touch = e.changedTouches[0];
      const delta = touch.clientX - g.startX;
      if (hasMultiple && Math.abs(delta) > SWIPE_THRESHOLD) {
        if (delta > 0) showPrev();
        else showNext();
      }
    } else if (g.mode === "pinch" && scale <= 1.05) {
      resetZoom();
    }
    g.mode = "idle";
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    const g = gesture.current;
    g.startX = e.clientX;
    g.startY = e.clientY;
    g.startTranslate = translate;
    g.moved = false;
    g.mode = zoomed ? "pan" : "swipe";
  }

  function handleMouseMove(e: React.MouseEvent) {
    const g = gesture.current;
    if (g.mode !== "pan") return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (Math.abs(dx) > CLICK_MOVE_TOLERANCE || Math.abs(dy) > CLICK_MOVE_TOLERANCE) g.moved = true;
    if (g.moved) {
      setTranslate(
        clampTranslate({ x: g.startTranslate.x + dx, y: g.startTranslate.y + dy }, scale)
      );
    }
  }

  function handleMouseUp(e: React.MouseEvent) {
    const g = gesture.current;
    if (g.mode !== "idle" && !g.moved) {
      toggleZoomAt(e.clientX, e.clientY);
    }
    g.mode = "idle";
  }

  async function handleDownload() {
    const src = images[index];
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const name = src.split("/").pop()?.split("?")[0] || `${title || "photo"}-${index + 1}`;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Cross-origin fetch can fail (CORS); falling back to opening the
      // image directly still gets the visitor the photo, just via a new
      // tab's own save/share affordance instead of a forced download.
      window.open(src, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} \u2014 photo ${index + 1} of ${images.length}`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-navy/90 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex h-full w-full flex-col items-center justify-center px-2 outline-none sm:px-16"
      >
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download this photo"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/60 text-offwhite backdrop-blur transition hover:bg-navy/80"
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/60 text-offwhite backdrop-blur transition hover:bg-navy/80"
          >
            <X size={20} />
          </button>
        </div>

        {hasMultiple && (
          <button
            type="button"
            onClick={showPrev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-navy/60 text-offwhite backdrop-blur transition hover:bg-navy/80 sm:left-6"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div
          ref={imageWrapperRef}
          className="relative h-full max-h-[75vh] w-full max-w-4xl select-none overflow-hidden"
          style={{ touchAction: "none", cursor: zoomed ? "grab" : "zoom-in" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-offwhite/70" />
            </div>
          )}

          <div
            key={index}
            className="lightbox-image-enter h-full w-full"
            style={
              {
                "--lightbox-slide-from":
                  direction === 1 ? "24px" : direction === -1 ? "-24px" : "0px",
              } as React.CSSProperties
            }
          >
            <div
              className="relative h-full w-full"
              style={{
                transform: `scale(${scale}) translate(${translate.x / scale}px, ${
                  translate.y / scale
                }px)`,
                transition: gesture.current.mode === "idle" ? "transform 150ms ease-out" : "none",
              }}
            >
              <Image
                src={images[index]}
                alt={`${title} \u2014 photo ${index + 1} of ${images.length}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
                onLoad={() => setLoaded(true)}
              />
            </div>
          </div>

          {/* Off-screen, forced-eager images so the neighbors an arrow
              click would land on are already in the browser cache. Not
              display:none — browsers still fetch a hidden <img>'s src, but
              keeping it off-canvas rather than display:none is the more
              reliable version of that across browsers. */}
          {hasMultiple && (
            <div
              aria-hidden
              className="pointer-events-none absolute -left-[9999px] -top-[9999px] h-px w-px overflow-hidden"
            >
              <Image src={images[nextIndex]} alt="" fill sizes="1px" priority />
              <Image src={images[prevIndex]} alt="" fill sizes="1px" priority />
            </div>
          )}
        </div>

        {hasMultiple && (
          <button
            type="button"
            onClick={showNext}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-navy/60 text-offwhite backdrop-blur transition hover:bg-navy/80 sm:right-6"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {hasMultiple && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-xs font-medium text-offwhite/80">
              {index + 1} / {images.length}
            </p>
            <div className="flex max-w-[90vw] gap-2 overflow-x-auto px-2 pb-1">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === index}
                  className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
                    i === index ? "border-gold" : "border-offwhite/20 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
