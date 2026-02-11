"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { testimonials } from "@/lib/constants";

function ChatBubble({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20, y: 10 }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, x: -20, y: 10 }
      }
      transition={{ delay: index * 0.15, type: "spring", stiffness: 200, damping: 20 }}
      className="flex items-start gap-3"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-sprout-light flex items-center justify-center text-lg shrink-0 mt-0.5">
        {testimonial.avatar}
      </div>

      {/* Message */}
      <div>
        <span className="text-xs font-bold text-earth">{testimonial.name}</span>
        <div className="mt-1 bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-mist/40 max-w-sm">
          <p className="text-sm text-earth leading-relaxed">{testimonial.message}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });

  return (
    <section className="py-24 relative" ref={sectionRef}>
      <div className="absolute inset-0 bg-gradient-to-b from-cloud via-bloom-light/20 to-cloud pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-bloom font-heading font-bold text-sm uppercase tracking-widest">
            Testimonials
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-earth mt-3">
            學習者怎麼說
          </h2>
        </motion.div>

        {/* LINE group chat simulation */}
        <div className="bg-[#E8ECF0]/40 rounded-3xl p-6 max-w-xl mx-auto border border-mist/40">
          {/* Group header */}
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-mist/50">
            <div className="flex -space-x-2">
              {testimonials.slice(0, 3).map((t) => (
                <div
                  key={t.name}
                  className="w-7 h-7 rounded-full bg-sprout-light border-2 border-white flex items-center justify-center text-xs"
                >
                  {t.avatar}
                </div>
              ))}
            </div>
            <span className="text-xs text-earth-light font-medium">
              SnappWord 學習群 ({testimonials.length})
            </span>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {testimonials.map((t, i) => (
              <ChatBubble key={t.name} testimonial={t} index={i} />
            ))}
          </div>

          {/* Read receipt */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: testimonials.length * 0.15 + 0.3 }}
            className="mt-4 text-right"
          >
            <span className="text-[10px] text-earth-light">
              已讀 42
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
