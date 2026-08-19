import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleButton } from '@/components/GoogleButton';

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate('/panel');
  }

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Continúa creando tus documentos con IA."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-[#7C93FF] hover:text-[#9DB0FF]">
            Crea una
          </Link>
        </>
      }
    >
      <GoogleButton onClick={() => signInWithGoogle()} />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-[#6B74A0]">o con tu correo</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-[#B4BCE0]">Correo electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-[#5A6291] focus:border-[#2946E0] focus:outline-none focus:ring-1 focus:ring-[#2946E0]"
            placeholder="tu@correo.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-[#B4BCE0]">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-[#5A6291] focus:border-[#2946E0] focus:outline-none focus:ring-1 focus:ring-[#2946E0]"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3AE8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2946E0] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Iniciar sesión
        </button>
      </form>
    </AuthLayout>
  );
}
