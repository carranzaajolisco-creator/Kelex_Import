import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ShaderBackground } from '@/components/ui/ShaderBackground';

export function LandingPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#050507]">
      <div className="absolute inset-0">
        <ShaderBackground />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-[#2946E0]/40 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#7C93FF]" />
          <span className="text-xs font-medium tracking-wide text-[#B9C4FF]">
            Generación de documentos con IA
          </span>
        </div>

        <h1 className="text-6xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl">
          Kelex
        </h1>

        <p className="mt-5 max-w-xl text-lg text-[#9AA5D6] sm:text-xl">
          Overleaf, potenciado por IA. Describe tu documento y obtén un PDF
          profesional en LaTeX, listo en segundos.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/registro"
            className="rounded-lg bg-[#1E3AE8] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1E3AE8]/30 transition-all hover:bg-[#2946E0] hover:shadow-[#1E3AE8]/50 active:scale-95"
          >
            Crear cuenta
          </Link>
          <Link
            to="/iniciar-sesion"
            className="rounded-lg border border-white/15 bg-white/5 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10 active:scale-95"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
