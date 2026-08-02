import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type ThemeChoice = "light" | "dark" | "system";

const LOCAL_KEY = "lb-theme";

function getLocalTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem(LOCAL_KEY) as ThemeChoice | null;
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

function applyTheme(choice: ThemeChoice) {
  const resolved = resolveTheme(choice);
  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

/** Persist theme to Supabase for signed-in users */
async function saveThemeToDb(choice: ThemeChoice) {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) return;
  await supabase
    .from("user_profiles")
    .update({ topics: undefined, theme_preference: choice } as never)
    .eq("id", userId);
}

/** Load theme from DB for current session user; returns null if not signed in or column missing */
async function loadThemeFromDb(): Promise<ThemeChoice | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("theme_preference")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  const val = (data as Record<string, unknown>).theme_preference as string | null;
  if (val === "light" || val === "dark" || val === "system") return val;
  return null;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>(getLocalTheme);
  const hydratedRef = useRef(false);

  // On mount: apply stored theme immediately, then try to hydrate from DB
  useEffect(() => {
    applyTheme(theme);

    loadThemeFromDb().then((dbTheme) => {
      if (dbTheme && !hydratedRef.current) {
        hydratedRef.current = true;
        setThemeState(dbTheme);
        try { localStorage.setItem(LOCAL_KEY, dbTheme); } catch {}
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply + persist whenever theme changes
  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(LOCAL_KEY, theme); } catch {}
  }, [theme]);

  // Re-apply when system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (theme === "system") applyTheme("system"); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (choice: ThemeChoice) => {
    hydratedRef.current = true;
    setThemeState(choice);
    saveThemeToDb(choice);
  };

  const toggleTheme = () => {
    const next: ThemeChoice = resolveTheme(theme) === "light" ? "dark" : "light";
    setTheme(next);
  };

  const resolvedTheme = resolveTheme(theme);

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
