"use client";

import { ModeToggle } from "@/components/mode-toggle";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">EasyCert</h1>
        </div>
        <ModeToggle />
      </div>
    </header>
  );
} 