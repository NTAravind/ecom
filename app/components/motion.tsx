"use client";

import { motion, Variants } from 'framer-motion';

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

interface MotionWrapProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}

export function MotionWrap({ children, className, variants = defaultVariants }: MotionWrapProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}