"use client";

import Link from "next/link";
import BackendStatus from "@/components/system/BackendStatus";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  Home,
  Compass,
  Route,
  TriangleAlert,
  UserRound,
  Mic,
} from "lucide-react";

import ThemeSwitcher from "@/components/shared/ThemeSwitcher";

const navigation = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Journeys", href: "/journeys", icon: Route },
  { label: "Reports", href: "/reports", icon: TriangleAlert },
  { label: "Profile", href: "/profile", icon: UserRound },
];

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname === href ||
        pathname.startsWith(`${href}/`);
  }

  return (
    <div className="km-background min-h-screen">
      <header className="km-surface fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b px-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#16c47f] text-[#101b30]">
            K
          </span>
          KILOMETER
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <BackendStatus />
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      <aside className="km-surface fixed bottom-0 left-0 top-14 z-30 hidden w-[90px] flex-col items-center border-r py-4 md:flex">
        <Link
          href="/"
          className="mb-5 flex size-11 items-center justify-center rounded-xl bg-[#16c47f] text-xl font-bold text-[#101b30]"
        >
          K
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex w-full flex-col gap-3"
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${
                  active ? "km-nav-active" : "km-muted"
                }`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full ${
                    active ? "bg-emerald-500/15" : ""
                  }`}
                >
                  <Icon size={21} strokeWidth={1.8} />
                </span>

                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/assistant"
          aria-label="Open KILOMETER AI Assistant"
          className="mt-auto flex size-14 items-center justify-center rounded-full bg-[#16c47f] text-[#101b30] shadow-lg"
        >
          <Mic size={24} />
        </Link>
      </aside>

      <div className="min-h-screen pt-14 pb-20 md:ml-[90px] md:pb-0">
        {children}
      </div>

      {pathname !== "/assistant" && (
        <Link
          href="/assistant"
          aria-label="Open AI Assistant"
          className="fixed bottom-24 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-[#16c47f] text-[#101b30] shadow-xl md:bottom-6"
        >
          <Mic size={24} />
        </Link>
      )}

      <nav
        aria-label="Mobile navigation"
        className="km-surface fixed inset-x-0 bottom-0 z-40 flex justify-around border-t p-2 md:hidden"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 p-2 text-[10px] ${
                active ? "km-nav-active" : "km-muted"
              }`}
            >
              <Icon size={21} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
