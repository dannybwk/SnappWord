"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { SproutDoodle } from "@/components/ui/DoodleSVG";

export default function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Green background */}
      <div className="absolute inset-0 bg-gradient-to-br from-seed via-seed-dark to-seed" />

      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-sun/10 rounded-full blur-xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        {/* Sprout animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex justify-center mb-8"
        >
          <motion.div
            animate={{
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "easeInOut",
            }}
          >
            <SproutDoodle className="!w-20 !h-24" />
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading font-extrabold text-3xl sm:text-4xl text-white mb-4"
        >
          開始種下你的第一顆種子
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-white/80 text-lg mb-8 max-w-md mx-auto"
        >
          加入 LINE 好友，第一張截圖免費解析
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <Button
            size="lg"
            className="!bg-white !text-seed hover:!bg-cloud !shadow-xl !shadow-black/10"
            icon={<span className="text-xl">💬</span>}
          >
            加入 LINE 好友
          </Button>

          <span className="text-white/60 text-sm flex items-center gap-1">
            🌱 免費開始：加好友->傳截圖->產生單字卡
          </span>
        </motion.div>
      </div>
    </section>
  );
}
