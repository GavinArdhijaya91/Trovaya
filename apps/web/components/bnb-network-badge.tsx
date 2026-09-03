import type { HTMLAttributes } from "react";

interface BnbNetworkBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
  variant?: "filled" | "outline" | "ghost";
  showPulse?: boolean;
}

export function BnbNetworkBadge({
  size = "md",
  variant = "filled",
  showPulse = true,
  className = "",
  ...props
}: BnbNetworkBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-2 text-sm gap-2",
  };

  const variantClasses = {
    filled: "bg-white border border-nusa-200 text-nusa-700 font-semibold",
    outline: "bg-white border border-nusa-200 text-nusa-700 font-medium",
    ghost:   "bg-nusa-50 border border-nusa-100 text-nusa-600 font-medium",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {/* Subtle BNB dot — flat, no gradient/glow */}
      <span className="h-2 w-2 rounded-full bg-[#F0B90B] shrink-0" aria-hidden="true" />

      <span>BNB Smart Chain</span>

      {showPulse && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
      )}
    </span>
  );
}

/** Simpler badge for use in nav/headers */
export function BnbTestnetBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white border border-nusa-200 px-2.5 py-1 text-[11px] font-medium text-nusa-600 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      BSC Testnet
    </span>
  );
}
