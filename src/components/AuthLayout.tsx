import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050507] px-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 block text-center text-2xl font-bold tracking-tight text-white"
        >
          Kelex
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[#0D1230] p-8 shadow-2xl shadow-black/40">
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-sm text-[#8A94C4]">{subtitle}</p>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-[#8A94C4]">{footer}</p>
      </div>
    </div>
  );
}
