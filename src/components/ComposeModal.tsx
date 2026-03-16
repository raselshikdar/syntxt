import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore } from '@/lib/store';

const MAX_CHARS = 300;

export default function ComposeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [content, setContent] = useState('');
  const addPost = useStore(s => s.addPost);
  const remaining = MAX_CHARS - content.length;

  const publish = () => {
    if (content.trim().length === 0 || content.length > MAX_CHARS) return;
    addPost(content.trim());
    setContent('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-compose border-t border-border rounded-t-xl p-6 max-w-2xl mx-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs uppercase tracking-label text-muted-foreground font-semibold">New Signal</span>
              <motion.button whileTap={{ scale: 0.85 }} onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </motion.button>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Broadcast your signal..."
              className="w-full bg-transparent border border-border rounded-md p-4 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground min-h-[120px]"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) publish(); }}
            />
            <div className="flex justify-between items-center mt-3">
              <span className={`text-xs font-mono ${remaining <= 20 ? (remaining <= 0 ? 'text-counter-danger' : 'text-counter-warning') : 'text-muted-foreground'}`}>
                {content.length}/{MAX_CHARS}
              </span>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={publish}
                disabled={content.trim().length === 0}
                className="bg-fab text-fab-foreground text-xs font-semibold uppercase tracking-label px-5 py-2 rounded-md disabled:opacity-40 transition-opacity"
              >
                Publish
              </motion.button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Markdown supported · Cmd+Enter to publish</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
