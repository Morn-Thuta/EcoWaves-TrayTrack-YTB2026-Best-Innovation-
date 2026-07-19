"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SpotlightTour } from "@/components/tutorial/SpotlightTour";
import { TUTORIAL_STEPS, TUTORIAL_STORAGE_KEY } from "@/components/tutorial/tutorialSteps";

export function TutorialButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const router   = useRouter();
  const pathname = usePathname();

  // Auto-trigger on first visit (no localStorage key present)
  useEffect(() => {
    if (!localStorage.getItem(TUTORIAL_STORAGE_KEY)) {
      setStep(0);
      setOpen(true);
    }
  }, []);

  // Navigate to the target route when the step changes
  useEffect(() => {
    if (!open) return;
    const target = TUTORIAL_STEPS[step]?.route;
    if (target && target !== pathname) {
      router.push(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, open]);

  function handleNext() {
    if (step === TUTORIAL_STEPS.length - 1) {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
      setOpen(false);
    } else {
      setStep(s => s + 1);
    }
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1);
  }

  function handleSkip() {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
    setOpen(false);
  }

  return (
    <>
      {/* ? button — always visible in management header */}
      <button
        onClick={() => { setStep(0); setOpen(true); }}
        title="Open guided tour"
        className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white text-xs font-bold flex items-center justify-center transition-all duration-150 active:scale-95 flex-shrink-0"
      >
        ?
      </button>

      {open && (
        <SpotlightTour
          step={step}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      )}
    </>
  );
}
