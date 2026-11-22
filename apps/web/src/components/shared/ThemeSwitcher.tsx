"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const options = [
  { label: "Day", value: "light" },
  { label: "Night", value: "dark" },
  { label: "Auto", value: "system" },
] as const;

const subscribe = () => () => {};

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  return (
    <div
      className="km-theme-switcher"
      role="group"
      aria-label="Application appearance"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={!mounted}
          aria-pressed={mounted && theme === option.value}
          onClick={() => setTheme(option.value)}
          className={
            mounted && theme === option.value
              ? "km-theme-button active"
              : "km-theme-button"
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
