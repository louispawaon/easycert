"use client";

import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex min-h-16 items-center justify-between gap-3 px-4 py-2 sm:h-16 sm:py-0">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 relative shrink-0">
              <Image
                src="/easycert_logo.svg"
                alt="EasyCert Logo"
                fill
                className="object-contain dark:invert"
              />
            </div>
          </Link>
        </div>
        <div
          id="generate-header-actions"
          className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-x-2 gap-y-1.5"
        />
      </div>
    </header>
  );
} 