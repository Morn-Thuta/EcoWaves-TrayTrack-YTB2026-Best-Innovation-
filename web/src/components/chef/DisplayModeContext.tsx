"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Chef-screen display preference: show tray level as a percentage or as
 * absolute weight (kg). Persisted to localStorage so a wall-mounted TV keeps
 * the chosen mode across reloads ("set once and stays"). Applies to all cards.
 */
export type DisplayMode = "percent" | "weight";

const STORAGE_KEY = "chef_display_mode";

interface DisplayModeCtx {
  mode: DisplayMode;
  setMode: (m: DisplayMode) => void;
}

const DisplayModeContext = createContext<DisplayModeCtx>({
  mode: "percent",
  setMode: () => {},
});

export function DisplayModeProvider({ children }: { children: ReactNode }) {
  // Always start "percent" so server and first client render match (no
  // hydration mismatch); the saved preference is applied right after mount.
  const [mode, setModeState] = useState<DisplayMode>("percent");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "weight" || saved === "percent") setModeState(saved);
  }, []);

  const setMode = (m: DisplayMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  };

  return (
    <DisplayModeContext.Provider value={{ mode, setMode }}>
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  return useContext(DisplayModeContext);
}

/** Segmented `[ % | kg ]` control — mirrors the ViewToggle visual language. */
export function DisplayModeToggle({ className = "" }: { className?: string }) {
  const { mode, setMode } = useDisplayMode();

  return (
    <div
      role="group"
      aria-label="Display units"
      className={[
        "inline-flex items-center rounded-md p-0.5 border border-ink-3 bg-ink-2",
        className,
      ].join(" ")}
    >
      <Seg active={mode === "percent"} onClick={() => setMode("percent")} label="%" />
      <Seg active={mode === "weight"} onClick={() => setMode("weight")} label="kg" />
    </div>
  );
}

function Seg({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center justify-center h-7 min-w-[2rem] px-3 rounded",
        "text-[12px] font-semibold transition-colors duration-150 active:scale-95",
        active
          ? "bg-ink-4 text-ink-8 shadow-sm"
          : "text-ink-6 hover:text-ink-8 hover:bg-ink-3",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
