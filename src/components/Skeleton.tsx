/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export default function Skeleton({ className = '', width, height, circle }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: 0.6 }}
      transition={{
        repeat: Infinity,
        repeatType: 'reverse',
        duration: 0.8,
        ease: 'easeInOut'
      }}
      className={`bg-white/10 ${circle ? 'rounded-full' : 'rounded-md'} ${className}`}
      style={{
        width: width ?? '100%',
        height: height ?? '1rem',
      }}
    />
  );
}
