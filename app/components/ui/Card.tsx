import clsx from "clsx";
import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  inset?: boolean;
};

export function Card({ className, hover = true, inset = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm",
        hover && "transition-all duration-300 hover:border-mesh-primary/30",
        inset && "p-0",
        !inset && "p-6",
        className
      )}
      {...props}
    />
  );
}
