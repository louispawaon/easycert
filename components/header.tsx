"use client";

import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="shrink-0 border-b">
      <div className="container mx-auto flex min-h-14 items-center gap-2 px-4 py-2 lg:grid lg:h-16 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-x-3 lg:py-0">
        <div className="flex shrink-0 items-center lg:justify-self-start">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 shrink-0">
              <Image
                src="/ditto_logo.svg"
                alt="Ditto Logo"
                fill
                className="object-contain dark:invert"
              />
            </div>
          </Link>
        </div>
        <div
          id="generate-step-wizard"
          className="flex min-w-0 flex-1 items-center justify-center overflow-hidden lg:flex-none lg:justify-self-center"
        />
        <div
          id="generate-header-actions"
          className="flex shrink-0 flex-nowrap items-center justify-end gap-1 lg:col-start-3 lg:justify-self-end lg:gap-x-2"
        />
      </div>
    </header>
  );
}
