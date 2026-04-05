import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-xs text-yellow-600 dark:text-yellow-400">
          <WifiOff className="w-3.5 h-3.5" />
          You're offline — you can still write ideas, but AI features require internet.
        </div>
      )}
      <main className={`flex-1 ${isAuthPage ? '' : 'pb-20'}`}>
        {children}
      </main>
      {!isAuthPage && <BottomNav />}
    </div>
  );
}
