import { motion } from 'framer-motion';

type FeedMode = 'explore' | 'following';

export default function FeedSwitcher({ mode, onChange }: { mode: FeedMode; onChange: (m: FeedMode) => void }) {
  return (
    <div className="flex gap-1 bg-muted rounded-full p-1 max-w-xs mx-auto">
      {(['explore', 'following'] as const).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className="relative flex-1 text-xs font-semibold uppercase tracking-label py-1.5 rounded-full transition-colors z-10"
          style={{ color: mode === m ? undefined : undefined }}
        >
          {mode === m && (
            <motion.div
              layoutId="pill"
              className="absolute inset-0 bg-pill-active rounded-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className={`relative z-10 ${mode === m ? 'text-pill-active-fg' : 'text-pill-inactive-fg'}`}>
            {m}
          </span>
        </button>
      ))}
    </div>
  );
}
