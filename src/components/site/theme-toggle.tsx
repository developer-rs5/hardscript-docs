"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Dark/light switch.
 *
 * The theme lives on `<html>`, outside React, so it is read with
 * `useSyncExternalStore` rather than mirrored into state with an effect: that
 * is what the hook is for, and it keeps the toggle correct when something else
 * changes the theme (the OS preference, another tab, the pre-paint script).
 * `getServerSnapshot` returns null so the server and the first client render
 * agree, and the icon appears once the real theme is known.
 */
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  return () => observer.disconnect();
};

const getSnapshot = () => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const getServerSnapshot = () => null;

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = getSnapshot() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem("hard-theme", next);
    } catch {
      // Private browsing: the theme still applies for this page view.
    }
  }, []);

  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
    >
      {theme === null ? (
        <span className="size-4" aria-hidden />
      ) : dark ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </button>
  );
}
