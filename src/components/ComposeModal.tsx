import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImagePlus } from 'lucide-react';
import { usePostActions } from '@/hooks/usePostActions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_CHARS = 300;
const MAX_IMAGE_KB = 50;

async function compressImage(file: File): Promise<{ blob: Blob; ext: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      // Scale down if needed
      let w = img.width;
      let h = img.height;
      const maxDim = 1200;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      // Try AVIF first, then WebP
      const tryFormat = (format: string, ext: string, quality: number) => {
        return new Promise<{ blob: Blob; ext: string } | null>((res) => {
          canvas.toBlob((blob) => {
            if (blob && blob.size <= MAX_IMAGE_KB * 1024) {
              res({ blob, ext });
            } else if (blob && quality > 0.1) {
              // Try lower quality
              canvas.toBlob((b2) => {
                if (b2 && b2.size <= MAX_IMAGE_KB * 1024) res({ blob: b2, ext });
                else res(null);
              }, format, quality - 0.15);
            } else {
              res(null);
            }
          }, format, quality);
        });
      };

      const compress = async () => {
        // Try WebP with progressive quality reduction (AVIF support is limited)
        for (let q = 0.8; q >= 0.1; q -= 0.1) {
          const result = await tryFormat('image/webp', 'webp', q);
          if (result) return resolve(result);
        }
        // Last resort: reduce dimensions further
        const smallCanvas = document.createElement('canvas');
        const ratio = 0.5;
        smallCanvas.width = Math.round(w * ratio);
        smallCanvas.height = Math.round(h * ratio);
        const sCtx = smallCanvas.getContext('2d')!;
        sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
        for (let q = 0.6; q >= 0.1; q -= 0.1) {
          const blob = await new Promise<Blob | null>((r) => smallCanvas.toBlob(r, 'image/webp', q));
          if (blob && blob.size <= MAX_IMAGE_KB * 1024) return resolve({ blob, ext: 'webp' });
        }
        reject(new Error('Could not compress image to 50KB'));
      };
      compress();
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

export default function ComposeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addPost } = usePostActions();
  const { user } = useAuth();
  const remaining = MAX_CHARS - content.length;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const publish = async () => {
    if (content.trim().length === 0 || content.length > MAX_CHARS || !user) return;
    setPublishing(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const { blob, ext } = await compressImage(imageFile);
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(path, blob, { contentType: `image/${ext}`, upsert: false });
        if (uploadError) throw uploadError;
        imageUrl = path;
      }
      await addPost(content.trim(), imageUrl);
      setContent('');
      removeImage();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
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

            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-32 rounded-md border border-border" />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X size={12} />
                </motion.button>
              </div>
            )}

            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono ${remaining <= 20 ? (remaining <= 0 ? 'text-counter-danger' : 'text-counter-warning') : 'text-muted-foreground'}`}>
                  {content.length}/{MAX_CHARS}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground hover:text-foreground"
                  title="Add image"
                >
                  <ImagePlus size={16} />
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={publish}
                disabled={content.trim().length === 0 || publishing}
                className="bg-fab text-fab-foreground text-xs font-semibold uppercase tracking-label px-5 py-2 rounded-md disabled:opacity-40 transition-opacity"
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </motion.button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Markdown supported · Cmd+Enter to publish</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
