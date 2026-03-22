import { motion } from 'framer-motion';

export default function VerifiedBadge({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.svg
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-block shrink-0 ${className}`}
      aria-label="Verified"
    >
      <path
        d="M9 12l2 2 4-4"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 2l2.09 1.91L17 3.18l.73 2.91L20.64 8l-.73 2.91L21.82 14l-2.91.73L17 17.64l-2.91-.73L12 18.82l-2.09-1.91L7 17.64l-.73-2.91L3.36 14l.73-2.91L2.18 8l2.91-.73L7 4.36l2.91.73L12 2z"
        fill="hsl(var(--handle-color))"
        stroke="hsl(var(--handle-color))"
        strokeWidth="1"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}
