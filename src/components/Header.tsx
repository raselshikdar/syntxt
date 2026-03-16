import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
        <h1 className="text-base font-bold tracking-tight cursor-pointer" onClick={() => navigate('/')}>syntxt_</h1>
        <span
          onClick={() => profile?.handle && navigate(`/u/${profile.handle}`)}
          className="text-xs text-handle font-semibold cursor-pointer hover:underline"
        >
          @{profile?.handle ?? '...'}
        </span>
      </div>
    </header>
  );
}
