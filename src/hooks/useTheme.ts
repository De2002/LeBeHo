import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type ThemeChoice = "light" | "dark" | "system";

function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return choice;
}

export function useTheme() {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeChoice>("light");
  const [loading, setLoading] = useState(true);

  // Load theme from database on mount
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const loadTheme = async () => {
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("theme")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("[useTheme] Error loading theme:", error);
        }

        const storedTheme = data?.theme as ThemeChoice | undefined;
        if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
          setThemeState(storedTheme);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [user?.id]);

  const applyTheme = (choice: ThemeChoice) => {
    const resolved = resolveTheme(choice);
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  // Apply theme to DOM
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Re-apply when system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = async (choice: ThemeChoice) => {
    setThemeState(choice);

    if (user?.id) {
      try {
        const { error } = await supabase
          .from("user_settings")
          .upsert({ user_id: user.id, theme: choice })
          .eq("user_id", user.id);

        if (error) {
          console.error("[useTheme] Error saving theme:", error);
        }
      } catch (err) {
        console.error("[useTheme] Unexpected error:", err);
      }
    }
  };

  const toggleTheme = () => {
    const resolved = resolveTheme(theme);
    setTheme(resolved === "light" ? "dark" : "light");
  };

  const resolvedTheme = resolveTheme(theme);

  return { theme, resolvedTheme, setTheme, toggleTheme, loading };
}
