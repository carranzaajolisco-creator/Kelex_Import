interface GoogleButtonProps {
  onClick: () => void;
}

export function GoogleButton({ onClick }: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.5-1.13 2.77-2.41 3.62v3.01h3.86c2.26-2.08 3.6-5.15 3.6-8.87z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3.01c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.24 21.3 7.28 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.27a7.5 7.5 0 010-4.54V6.62H1.27a12 12 0 000 10.76z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.27 6.62l4 3.11C6.22 6.86 8.87 4.75 12 4.75z"
        />
      </svg>
      Continuar con Google
    </button>
  );
}
