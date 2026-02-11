"use client";

import type { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
}

export default function PhoneMockup({ children, className = "" }: PhoneMockupProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative w-[280px] h-[560px] bg-earth rounded-[3rem] p-3 shadow-2xl shadow-earth/30"
        style={{
          transform: "rotateY(-8deg) rotateX(4deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-earth rounded-b-2xl z-10" />

        {/* Screen */}
        <div className="relative w-full h-full bg-white rounded-[2.2rem] overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[10px] text-earth-light font-medium">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <span>●●●</span>
            </div>
          </div>

          {/* Content area */}
          <div className="h-[calc(100%-32px)] overflow-hidden">
            {children}
          </div>
        </div>

        {/* Side button */}
        <div className="absolute -right-[3px] top-28 w-[3px] h-12 bg-earth-light rounded-l" />
        <div className="absolute -left-[3px] top-24 w-[3px] h-8 bg-earth-light rounded-r" />
        <div className="absolute -left-[3px] top-36 w-[3px] h-8 bg-earth-light rounded-r" />
      </div>
    </div>
  );
}
