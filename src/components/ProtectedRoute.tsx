import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050507]">
        <Loader2 className="h-6 w-6 animate-spin text-[#7C93FF]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return <>{children}</>;
}
