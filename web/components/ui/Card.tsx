"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddingStyles = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className = "",
  hover = true,
  padding = "md",
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`
        bg-white rounded-3xl
        border border-mist/60
        shadow-sm
        ${hover ? "hover:shadow-xl hover:shadow-seed/5 hover:border-sprout/60" : ""}
        transition-shadow duration-300
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
