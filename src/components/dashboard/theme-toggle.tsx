"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return <button className="theme-toggle icon-button" aria-label="Toggle dark mode" title="Toggle light or dark mode" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
    <Moon className="theme-moon" size={19} aria-hidden="true" />
    <Sun className="theme-sun" size={19} aria-hidden="true" />
  </button>;
}
