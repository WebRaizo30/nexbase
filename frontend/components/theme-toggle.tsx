"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className="crt-btn-icon h-9 min-w-[5.5rem] animate-pulse opacity-40"
        aria-hidden
      />
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="crt-btn-icon min-w-[5.5rem] gap-2"
      aria-label={isDark ? "Switch to paper terminal (light)" : "Switch to phosphor (dark)"}
    >
      <span className="text-[0.6rem] opacity-70">MODE</span>
      <span className="text-phosphor-bright">{isDark ? "◉ P3" : "◇ P1"}</span>
    </button>
  );
}
