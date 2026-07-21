"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "학습하기" },
  { href: "/progress", label: "진도 체크" },
  { href: "/worksheets", label: "학습지" },
  { href: "/statistics", label: "통계" },
] as const;

function isCurrentPath(pathname: string, href: (typeof NAV_ITEMS)[number]["href"]) {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="shrink-0 bg-[var(--background)] px-4 pt-4 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1720px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 border-b border-[var(--border)] pb-4 sm:flex">
        <Link
          href="/"
          aria-label="수학 공간 홈"
          className="flex min-w-0 items-center gap-3 rounded-xl"
        >
          <span
            aria-hidden="true"
            className="app-logo-mark relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black"
          >
            ∑
            <span className="app-logo-accent absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-bold tracking-[-0.03em]">수학 공간</span>
            <span className="block truncate text-[10px] font-semibold tracking-[0.16em] text-[var(--muted)]">
              움직이는 수학 연구소
            </span>
          </span>
        </Link>

        <nav
          aria-label="주요 메뉴"
          className="col-span-2 row-start-2 grid grid-cols-4 gap-2 sm:ml-auto sm:flex"
        >
          {NAV_ITEMS.map(({ href, label }) => {
            const isCurrent = isCurrentPath(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3.5 text-sm font-bold shadow-[0_4px_12px_rgba(111,92,130,0.1)] transition hover:-translate-y-0.5 active:translate-y-0 ${
                  isCurrent
                    ? "border-[var(--control-border-active)] bg-[var(--control-background-active)] text-[var(--control-foreground)]"
                    : "border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)] hover:border-[var(--control-border-active)] hover:bg-[var(--control-background-active)]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="col-start-2 row-start-1 sm:ml-1">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
