"use client";

import type { ReactNode } from "react";
import Magnetic from "./Magnetic";

type Props = {
  href?: string;
  onClick?: () => void;
  children: string;
  variant?: "solid" | "ghost" | "light";
  icon?: ReactNode;
  type?: "button" | "submit";
  className?: string;
};

const styles = {
  solid: { base: "bg-brass text-carbon", fill: "bg-paper", text: "text-carbon" },
  ghost: { base: "text-paper ring-1 ring-inset ring-white/25", fill: "bg-paper", text: "group-hover:text-carbon" },
  light: { base: "bg-paper text-carbon", fill: "bg-brass", text: "text-carbon" },
};

// Pill with a rolling label and a fill that rises from below on hover.
export default function RollButton({ href, onClick, children, variant = "solid", icon = "→", type = "button", className = "" }: Props) {
  const s = styles[variant];
  const inner = (
    <>
      <span className={`absolute inset-x-[-10%] bottom-0 h-[220%] translate-y-full rounded-[50%] ${s.fill} transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-[18%]`} />
      <span className={`relative z-10 block overflow-hidden transition-colors duration-500 ${s.text}`}>
        <span className="block transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-full">{children}</span>
        <span aria-hidden className="absolute inset-0 block translate-y-full transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0">
          {children}
        </span>
      </span>
      {icon && <span className={`relative z-10 transition-[transform,color] duration-500 group-hover:translate-x-1 ${s.text}`}>{icon}</span>}
    </>
  );
  const cls = `group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-6 py-3.5 text-[13px] font-medium uppercase tracking-[0.08em] ${s.base} ${className}`;
  return (
    <Magnetic strength={0.25}>
      {href ? (
        <a href={href} className={cls} data-cursor-hover>
          {inner}
        </a>
      ) : (
        <button type={type} onClick={onClick} className={cls} data-cursor-hover>
          {inner}
        </button>
      )}
    </Magnetic>
  );
}
