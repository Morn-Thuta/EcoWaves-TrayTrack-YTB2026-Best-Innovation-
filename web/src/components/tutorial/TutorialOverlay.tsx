"use client";

import { useEffect, useCallback } from "react";
import { TUTORIAL_STEPS } from "./tutorialSteps";

interface TutorialOverlayProps {
  step: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({
  step,
  onNext,
  onBack,
  onSkip,
}: TutorialOverlayProps) {
  const current = TUTORIAL_STEPS[step];
  const total = TUTORIAL_STEPS.length;
  const isFirst = step === 0;
  const isLast = step === total - 1;

  // Keyboard navigation
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (!isFirst) onBack();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    },
    [onNext, onBack, onSkip, isFirst]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        // close if clicking backdrop directly (not the card)
        if (e.target === e.currentTarget) onSkip();
      }}
    >
      {/* Step card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Top row: icon + step counter */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="bg-gray-800 rounded-xl p-3 text-3xl leading-none flex-shrink-0">
            {current.icon}
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 pt-1">
            Step {step + 1} of {total}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-2">{current.title}</h2>

        {/* Description */}
        <p className="text-sm text-gray-300 leading-relaxed mb-6">
          {current.description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-6">
          {TUTORIAL_STEPS.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i === step ? "bg-green-500" : i < step ? "bg-green-800" : "bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3">
          {/* Skip */}
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-150 flex-shrink-0"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {/* Back */}
            {!isFirst && (
              <button
                onClick={onBack}
                className="px-4 py-2 text-sm font-semibold text-gray-300 border border-gray-700 hover:border-gray-500 hover:text-white rounded-lg transition-all duration-150 active:scale-95"
              >
                ← Back
              </button>
            )}

            {/* Next / Done */}
            <button
              onClick={onNext}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-600 rounded-lg transition-all duration-150 active:scale-95"
            >
              {isLast ? "Open Chef Screen →" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
