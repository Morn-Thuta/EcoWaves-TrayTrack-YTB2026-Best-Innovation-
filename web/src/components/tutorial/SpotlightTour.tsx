"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { TUTORIAL_STEPS, type TutorialStep } from "./tutorialSteps";

interface Props {
  step: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_W = 316;
const ARROW  = 10;   // px — half-width of CSS triangle
const GAP    = 16;   // px between spotlight edge and tooltip card

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function SpotlightTour({ step, onNext, onBack, onSkip }: Props) {
  const current = TUTORIAL_STEPS[step];
  const [rect, setRect]       = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  // Portals only work client-side
  useEffect(() => setMounted(true), []);

  // ── Measure target element ────────────────────────────────────────────────
  const measure = useCallback(() => {
    if (!current.selector) { setRect(null); return; }
    const el = document.querySelector(current.selector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [current.selector]);

  // Poll for element after step change (navigation may still be completing)
  useEffect(() => {
    setRect(null);
    if (!current.selector) return;
    let attempts = 0;
    let tid: ReturnType<typeof setTimeout> | undefined;
    const tryMeasure = () => {
      const el = document.querySelector(current.selector!);
      if (el) {
        // 'auto' behaviour = instant scroll; layout is committed by the time
        // we call getBoundingClientRect() in the same tick.
        el.scrollIntoView({ behavior: "auto", block: "center" });
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else if (++attempts < 25) {
        tid = setTimeout(tryMeasure, 120);
      }
    };
    tryMeasure();
    return () => { if (tid) clearTimeout(tid); };
  }, [step, current.selector]);

  // Re-measure on resize / scroll
  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  // Keyboard navigation
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); onNext(); }
      else if (e.key === "ArrowLeft")                  { e.preventDefault(); if (step > 0) onBack(); }
      else if (e.key === "Escape")                     { e.preventDefault(); onSkip(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onNext, onBack, onSkip, step]);

  // Intercept clicks INSIDE the spotlight rectangle → advance the tour
  // (Clicks elsewhere are absorbed by the 4 click-blockers and call onSkip.)
  useEffect(() => {
    if (!current.selector || !rect) return;
    const pad = current.padding;
    const handler = (e: MouseEvent) => {
      const x = e.clientX, y = e.clientY;
      const inside =
        x >= rect.left - pad && x <= rect.left + rect.width  + pad &&
        y >= rect.top  - pad && y <= rect.top  + rect.height + pad;
      if (inside) {
        e.preventDefault();
        e.stopPropagation();
        onNext();
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [current.selector, current.padding, rect, onNext]);

  if (!mounted) return null;

  const total   = TUTORIAL_STEPS.length;
  const isFirst = step === 0;
  const isLast  = step === total - 1;

  // No selector or element not yet found → centered overlay
  if (!current.selector || !rect) {
    return createPortal(
      <CenteredOverlay
        step={step} total={total} current={current}
        onNext={onNext} onBack={onBack} onSkip={onSkip}
        isFirst={isFirst} isLast={isLast}
      />,
      document.body
    );
  }

  // ── Spotlight geometry ────────────────────────────────────────────────────
  const pad  = current.padding;
  const vw   = window.innerWidth;
  const vh   = window.innerHeight;
  const sTop  = rect.top  - pad;
  const sLeft = rect.left - pad;
  const sW    = rect.width  + pad * 2;
  const sH    = rect.height + pad * 2;
  const sCX   = sLeft + sW / 2;   // spotlight center X
  const sCY   = sTop  + sH / 2;   // spotlight center Y

  // ── Estimated card height (descriptions are now short → ~250 is generous). */
  const EST_CARD_H = 250;
  const M = 8; // viewport margin

  // ── Auto-flip: pick the actual placement based on available space ─────────
  let placement = current.placement;
  const spaceBelow = vh - (sTop + sH) - GAP;
  const spaceAbove = sTop - GAP;
  const spaceRight = vw - (sLeft + sW) - GAP;
  const spaceLeft  = sLeft - GAP;

  if (placement === "bottom" && spaceBelow < EST_CARD_H && spaceAbove > spaceBelow) placement = "top";
  else if (placement === "top" && spaceAbove < EST_CARD_H && spaceBelow > spaceAbove) placement = "bottom";
  else if (placement === "right" && spaceRight < CARD_W && spaceLeft > spaceRight) placement = "left";
  else if (placement === "left"  && spaceLeft  < CARD_W && spaceRight > spaceLeft)  placement = "right";

  // If still no room on either side for horizontal placements, fall to bottom.
  if ((placement === "right" || placement === "left") &&
      Math.max(spaceLeft, spaceRight) < CARD_W) {
    placement = spaceBelow >= spaceAbove ? "bottom" : "top";
  }

  // ── Tooltip + arrow geometry per (effective) placement ────────────────────
  let cardStyle: React.CSSProperties = {};
  let arrowPos:  React.CSSProperties = {};
  let arrowShape: React.CSSProperties = {};

  // Anchor the spotlight reference to the VISIBLE portion of the rect.
  // For tall sections, this keeps the tooltip near the visible edge.
  const visibleTop    = Math.max(sTop, M);
  const visibleBottom = Math.min(sTop + sH, vh - M);

  switch (placement) {
    case "bottom": {
      const cL = clamp(sCX - CARD_W / 2, M, vw - CARD_W - M);
      // Top of card is just below the visible bottom of spotlight, but clamp
      // so the whole card is on screen.
      const cT = clamp(visibleBottom + GAP, M, vh - EST_CARD_H - M);
      cardStyle  = { top: cT, left: cL, width: CARD_W };
      const ax   = clamp(sCX - cL - ARROW, 8, CARD_W - ARROW * 2 - 8);
      arrowPos   = { position: "absolute", top: -ARROW, left: ax };
      arrowShape = { borderLeft: `${ARROW}px solid transparent`, borderRight: `${ARROW}px solid transparent`, borderBottom: `${ARROW}px solid #374151` };
      break;
    }
    case "top": {
      const cL = clamp(sCX - CARD_W / 2, M, vw - CARD_W - M);
      // Bottom of card just above the visible top of spotlight, clamped to
      // keep whole card on screen.
      const bottomCSS = clamp(vh - visibleTop + GAP, M, vh - EST_CARD_H - M);
      cardStyle  = { bottom: bottomCSS, left: cL, width: CARD_W };
      const ax   = clamp(sCX - cL - ARROW, 8, CARD_W - ARROW * 2 - 8);
      arrowPos   = { position: "absolute", bottom: -ARROW, left: ax };
      arrowShape = { borderLeft: `${ARROW}px solid transparent`, borderRight: `${ARROW}px solid transparent`, borderTop: `${ARROW}px solid #374151` };
      break;
    }
    case "right": {
      const cL = sLeft + sW + GAP;
      const cT = clamp(sCY - EST_CARD_H / 2, M, vh - EST_CARD_H - M);
      cardStyle  = { top: cT, left: cL, width: clamp(CARD_W, 200, vw - cL - M) };
      const ay   = clamp(sCY - cT - ARROW, 8, EST_CARD_H - ARROW * 2 - 8);
      arrowPos   = { position: "absolute", left: -ARROW, top: ay };
      arrowShape = { borderTop: `${ARROW}px solid transparent`, borderBottom: `${ARROW}px solid transparent`, borderRight: `${ARROW}px solid #374151` };
      break;
    }
    case "left": {
      const cL = clamp(sLeft - CARD_W - GAP, M, vw - CARD_W - M);
      const cT = clamp(sCY - EST_CARD_H / 2, M, vh - EST_CARD_H - M);
      cardStyle  = { top: cT, left: cL, width: CARD_W };
      const ay   = clamp(sCY - cT - ARROW, 8, EST_CARD_H - ARROW * 2 - 8);
      arrowPos   = { position: "absolute", right: -ARROW, top: ay };
      arrowShape = { borderTop: `${ARROW}px solid transparent`, borderBottom: `${ARROW}px solid transparent`, borderLeft: `${ARROW}px solid #374151` };
      break;
    }
    default:
      break;
  }

  // Geometry for the 4 click-blocker rectangles around the spotlight
  const sR = sLeft + sW; // right edge
  const sB = sTop  + sH; // bottom edge

  return createPortal(
    <>
      {/* ── Spotlight visual — box-shadow creates the dark vignette.        */}
      {/*   pointer-events:none so clicks INSIDE the spotlight pass through  */}
      {/*   straight to the highlighted element underneath.                  */}
      <div
        style={{
          position:     "fixed",
          top:          sTop,
          left:         sLeft,
          width:        sW,
          height:       sH,
          zIndex:       40,
          borderRadius: 8,
          boxShadow:    "0 0 0 9999px rgba(0,0,0,0.72)",
          outline:      "2px solid rgba(34,197,94,0.7)",
          outlineOffset: 2,
          pointerEvents: "none",
          transition:   "top 250ms ease-out, left 250ms ease-out, width 250ms ease-out, height 250ms ease-out",
        }}
      />

      {/* ── 4 click-blockers AROUND the spotlight (top / bottom / left / right). */}
      {/*    They leave the spotlight area uncovered, so clicks inside it reach  */}
      {/*    the highlighted element (or our document-level interceptor above).  */}
      {/*    Clicks on these dark areas = skip the tour.                         */}
      <div onClick={onSkip} style={{ position: "fixed", top: 0,    left: 0,    right: 0,        height: Math.max(0, sTop),               zIndex: 41 }} />
      <div onClick={onSkip} style={{ position: "fixed", top: sB,   left: 0,    right: 0,        bottom: 0,                               zIndex: 41 }} />
      <div onClick={onSkip} style={{ position: "fixed", top: sTop, left: 0,    width: Math.max(0, sLeft), height: sH,                    zIndex: 41 }} />
      <div onClick={onSkip} style={{ position: "fixed", top: sTop, left: sR,   right: 0,        height: sH,                              zIndex: 41 }} />

      {/* ── Tooltip card ── */}
      <div
        style={{ position: "fixed", zIndex: 50, ...cardStyle }}
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-visible"
        onClick={e => e.stopPropagation()}
      >
        {/* Arrow triangle */}
        <div style={arrowPos}>
          <div style={{ width: 0, height: 0, ...arrowShape }} />
        </div>

        <div className="p-5">
          {/* Icon + step label + close */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none">{current.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Step {step + 1} of {total}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-600 hover:text-gray-300 text-sm leading-none transition-colors"
              title="Close tour"
            >
              ✕
            </button>
          </div>

          <h2 className="text-base font-bold text-white mb-1.5">{current.title}</h2>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">{current.description}</p>

          {/* Progress dots */}
          <div className="flex items-center gap-1 mb-4">
            {TUTORIAL_STEPS.map((_, i) => (
              <span
                key={i}
                className={[
                  "inline-block rounded-full",
                  "transition-all duration-300",
                  i === step ? "w-4 h-1.5 bg-green-500"
                  : i < step  ? "w-1.5 h-1.5 bg-green-800"
                  :              "w-1.5 h-1.5 bg-gray-700",
                ].join(" ")}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-end gap-2">
            {!isFirst && (
              <button
                onClick={onBack}
                className="px-3 py-1.5 text-sm font-semibold text-gray-400 border border-gray-700 hover:border-gray-500 rounded-lg transition-all duration-150 active:scale-95"
              >
                ← Back
              </button>
            )}
            <button
              onClick={onNext}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-green-700 hover:bg-green-600 rounded-lg transition-all duration-150 active:scale-95"
            >
              {isLast ? "Done ✓" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Centered modal (no specific target element) ─────────────────────────────
interface CenteredProps {
  step: number; total: number; current: TutorialStep;
  onNext: () => void; onBack: () => void; onSkip: () => void;
  isFirst: boolean; isLast: boolean;
}

function CenteredOverlay({
  step, total, current, onNext, onBack, onSkip, isFirst, isLast,
}: CenteredProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
        onClick={onSkip}
      />
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Icon + counter + close */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-800 rounded-xl p-2.5 text-3xl leading-none flex-shrink-0">
                {current.icon}
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 mt-1">
                Step {step + 1} of {total}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-600 hover:text-gray-300 text-sm transition-colors mt-1 flex-shrink-0"
              title="Close tour"
            >
              ✕
            </button>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">{current.title}</h2>
          <p className="text-sm text-gray-300 leading-relaxed mb-5">{current.description}</p>

          {/* Progress dots */}
          <div className="flex items-center gap-1 mb-5">
            {TUTORIAL_STEPS.map((_, i) => (
              <span
                key={i}
                className={[
                  "inline-block rounded-full transition-all duration-300",
                  i === step ? "w-4 h-1.5 bg-green-500"
                  : i < step  ? "w-1.5 h-1.5 bg-green-800"
                  :              "w-1.5 h-1.5 bg-gray-700",
                ].join(" ")}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {!isFirst && (
                <button
                  onClick={onBack}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-400 border border-gray-700 hover:border-gray-500 rounded-lg transition-all duration-150 active:scale-95"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={onNext}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-green-700 hover:bg-green-600 rounded-lg transition-all duration-150 active:scale-95"
              >
                {isLast ? "Done ✓" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
