"use client";

import type { ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: REVEAL_EASE },
  },
};

export const revealInstantVariants: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

export const revealStaggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const revealStaggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: REVEAL_EASE },
  },
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
};

export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const reducedMotion = usePrefersReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      variants={reducedMotion ? revealInstantVariants : revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={delay > 0 ? { delay } : undefined}
    >
      {children}
    </Component>
  );
}

type RevealStaggerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul";
};

export function RevealStagger({ children, className, as = "div" }: RevealStaggerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      variants={reducedMotion ? revealInstantVariants : revealStaggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </Component>
  );
}

type RevealItemProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
};

export function RevealItem({ children, className, as = "div" }: RevealItemProps) {
  const reducedMotion = usePrefersReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      variants={reducedMotion ? revealInstantVariants : revealStaggerItemVariants}
    >
      {children}
    </Component>
  );
}
