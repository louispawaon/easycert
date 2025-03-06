"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 relative">
            <Image
              src="/easycert_logo.svg"
              alt="EasyCert Logo"
              fill
              className="object-contain dark:invert"
            />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <h1 className="text-2xl font-bold">EasyCert</h1>
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </div>
          <div className="md:hidden">
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </div>
        </div>
        <ModeToggle />
      </div>
    </header>
  );
} 