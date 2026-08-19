import { FileText, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { KelexDocument } from '@/types/document';

interface SidebarProps {
  documents: KelexDocument[];
  loading: boolean;
  activeId?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Sidebar({ documents, loading, activeId }: SidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-[#0A0A0F]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <button
          onClick={() => navigate('/panel')}
          className="text-lg font-bold tracking-tight text-white"
        >
          Kelex
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-[#5A6291]">
          Historial
        </p>

        {loading && (
          <div className="mt-1 space-y-2 px-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        )}

        {!loading && documents.length === 0 && (
          <p className="px-2 py-4 text-sm text-[#5A6291]">
            Aún no has generado ningún documento.
          </p>
        )}

        <div className="mt-1 space-y-1">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => navigate(`/documento/${doc.id}`)}
              className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
                activeId === doc.id ? 'bg-[#131A45]' : 'hover:bg-white/5'
              }`}
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#7C93FF]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-white">{doc.title}</span>
                <span className="block text-xs text-[#5A6291]">{formatDate(doc.created_at)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#8A94C4] transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
