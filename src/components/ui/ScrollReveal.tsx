import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ScrollRevealTag =
  "div" | "section" | "footer" | "header" | "article" | "aside" | "main";

interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string | undefined;
  delayMs?: number | undefined;
  as?: ScrollRevealTag | undefined;
}

/**
 * Performant scroll-based section reveal using IntersectionObserver.
 * Triggers once upon entering viewport, then unobserves for optimal runtime performance.
 * Respects prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  className,
  delayMs = 0,
  as = "div",
  style,
  ...rest
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    // Immediate reveal if user prefers reduced motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIsRevealed(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    // Fallback if IntersectionObserver is unsupported
    if (!("IntersectionObserver" in window)) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(node);
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const combinedStyle: React.CSSProperties = {
    ...(delayMs > 0 && isRevealed ? { transitionDelay: `${delayMs}ms` } : {}),
    ...style,
  };

  return React.createElement(
    as,
    {
      ref,
      className: cn("reveal-item", isRevealed && "is-revealed", className),
      style: combinedStyle,
      ...rest,
    },
    children,
  );
}
