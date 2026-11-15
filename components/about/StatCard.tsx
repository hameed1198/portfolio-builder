"use client";

import { motion } from "framer-motion";

type StatCardProps = {
  label: string;
  value: string;
  command: string;
  index: number;
};

export default function StatCard({ label, value, command, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="terminal-window box-glow"
    >
      <div className="terminal-bar">
        <span className="terminal-dot bg-red-400/80" />
        <span className="terminal-dot bg-yellow-400/80" />
        <span className="terminal-dot bg-primary/80" />
        <span className="ml-3 font-mono text-[10px] text-muted">{command}</span>
      </div>
      <div className="p-5">
        <div className="mb-1 font-mono text-3xl font-bold text-primary text-glow md:text-4xl">
          {value}
        </div>
        <div className="text-sm text-muted">{label}</div>
      </div>
    </motion.div>
  );
}