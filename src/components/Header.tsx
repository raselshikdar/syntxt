import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
        <h1 className="text-base font-bold tracking-tight">nullset_</h1>
        <span className="text-xs text-handle font-semibold">@{profile?.handle ?? '...'}</span>
      </div>
    </header>
  );
}
