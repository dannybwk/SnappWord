"use client";

import { motion } from "framer-motion";

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 1.5, ease: "easeInOut" as const }, opacity: { duration: 0.3 } },
  },
};

export function UnderlineDoodle({ className = "" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 200 12"
      fill="none"
      className={`absolute -bottom-2 left-0 w-full ${className}`}
      initial="hidden"
      animate="visible"
    >
      <motion.path
        d="M2 8 C40 2, 80 12, 120 6 C140 3, 170 10, 198 4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        variants={draw}
      />
    </motion.svg>
  );
}

export function LeafDoodle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={`w-10 h-10 ${className}`}>
      <path
        d="M20 4 C8 14, 8 28, 20 36 C32 28, 32 14, 20 4Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M20 4 C8 14, 8 28, 20 36 C32 28, 32 14, 20 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M20 10 L20 30" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d="M20 16 L14 12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <path d="M20 20 L26 16" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <path d="M20 24 L15 21" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

export function SproutDoodle({ className = "" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 48 60"
      fill="none"
      className={`w-12 h-14 ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
    >
      {/* stem */}
      <motion.path
        d="M24 58 C24 40, 24 30, 24 20"
        stroke="#06C755"
        strokeWidth="2.5"
        strokeLinecap="round"
        variants={draw}
        initial="hidden"
        animate="visible"
      />
      {/* left leaf */}
      <motion.path
        d="M24 30 C16 26, 10 18, 14 10 C18 16, 22 24, 24 30Z"
        fill="#A8E6CF"
        stroke="#06C755"
        strokeWidth="1.5"
        initial={{ scale: 0, originX: "24px", originY: "30px" }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
      />
      {/* right leaf */}
      <motion.path
        d="M24 26 C32 22, 38 14, 34 6 C30 12, 26 20, 24 26Z"
        fill="#A8E6CF"
        stroke="#06C755"
        strokeWidth="1.5"
        initial={{ scale: 0, originX: "24px", originY: "26px" }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
      />
    </motion.svg>
  );
}

export function SparklesDoodle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`w-5 h-5 ${className}`}>
      <path
        d="M12 2 L13.5 8.5 L20 7 L14.5 11 L18 17 L12 13.5 L6 17 L9.5 11 L4 7 L10.5 8.5 Z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}

export function WaveDoodle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className={`w-full ${className}`}>
      <path
        d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PlantRow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 40" fill="none" className={`w-full h-10 ${className}`}>
      {/* Small plants in a row */}
      {[60, 160, 280, 380, 500, 620, 720].map((x, i) => (
        <g key={i} transform={`translate(${x}, 0)`}>
          <line x1="0" y1="38" x2="0" y2={22 - (i % 3) * 4} stroke="#A8E6CF" strokeWidth="1.5" />
          <circle cx={-3 + (i % 2) * 6} cy={18 - (i % 3) * 4} r={3 + (i % 2)} fill="#A8E6CF" opacity="0.6" />
          <circle cx={3 - (i % 2) * 6} cy={14 - (i % 3) * 4} r={2.5 + (i % 3)} fill="#06C755" opacity="0.4" />
        </g>
      ))}
    </svg>
  );
}
