import clsx from "clsx";
import { motion } from "framer-motion";
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus-visible:ring-2 ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<string, string> = {
  primary:
    "bg-gradient-to-r from-mesh-primary to-mesh-secondary text-white hover:shadow-lg hover:shadow-mesh-primary/25",
  secondary:
    "bg-white/10 text-white border border-white/20 hover:bg-white/20",
  ghost: "bg-transparent text-white hover:bg-white/10",
  danger: "bg-red-500/90 text-white hover:bg-red-500",
};

const sizes: Record<string, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-sm",
  lg: "px-6 py-4 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      <span className="flex items-center gap-2">
        {leftIcon}
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
        {rightIcon}
      </span>
    </motion.button>
  );
}
