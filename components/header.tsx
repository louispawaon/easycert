"use client";

import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 relative shrink-0">
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
          </Link>
          <div className="md:hidden">
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </div>
        </div>
        <Link
          href="/generate"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          Generator
        </Link>
      </div>
    </header>
  );
} 