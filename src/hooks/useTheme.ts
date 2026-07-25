import { useState, useEffect } from "react";

type ThemeChoice = "light" | "dark" | "system";

function getStoredTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem("lb-theme") as ThemeChoice | null;
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {}
  return "light";
}

function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return choice;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>(getStoredTheme);

  const applyTheme = (choice: ThemeChoice) => {
    const resolved = resolveTheme(choice);
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem("lb-theme", theme);
    } catch {}
  }, [theme]);

  // Re-apply when system preference changes (only relevant if theme === "system")
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (choice: ThemeChoice) => setThemeState(choice);
  const toggleTheme = () =>
    setThemeState((t) => {
      const resolved = resolveTheme(t);
      return resolved === "light" ? "dark" : "light";
    });

  // Expose the visually resolved value for UI that still needs light/dark
  const resolvedTheme = resolveTheme(theme);

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
