import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { usePostActions } from '@/hooks/usePostActions';

const MAX_CHARS = 300;

export default function ComposeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [content, setContent] = useState('');
  const { addPost } = usePostActions();
  const remaining = MAX_CHARS - content.length;

  const publish = async () => {
    if (content.trim().length === 0 || content.length > MAX_CHARS) return;
    await addPost(content.trim());
    setContent('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        // items-start এবং pt-16 ব্যবহার করা হয়েছে যাতে এটি কীবোর্ডের উপরে থাকে
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          {/* ব্যাকড্রপ - আপনার অরিজিনাল কোড */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* কম্পোজার - পজিশন কিছুটা উপরে (mt-12) সরানো হয়েছে যাতে কীবোর্ড এটাকে না ঢাকে */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-50 bg-compose border border-border rounded-xl p-6 w-full max-w-2xl mx-auto shadow-brutalist mt-12 mb-auto"
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
        </div>
      )}
    </AnimatePresence>
  );
}
