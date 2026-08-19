import { Check, FileText, Loader2, Sparkles } from 'lucide-react';

export type GenerationStep = 'content' | 'compiling' | 'done';

const STEPS: { key: GenerationStep; label: string; icon: typeof Sparkles }[] = [
  { key: 'content', label: 'Generando contenido...', icon: Sparkles },
  { key: 'compiling', label: 'Compilando PDF...', icon: FileText },
];

export function GenerationProgress({ step }: { step: GenerationStep }) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#2946E0]/30 bg-[#0D1230] p-5">
      {STEPS.map((s, i) => {
        const isDone = activeIndex > i || step === 'done';
        const isActive = activeIndex === i && step !== 'done';
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isDone
                  ? 'border-[#1E3AE8] bg-[#1E3AE8]'
                  : isActive
                    ? 'border-[#2946E0] bg-[#131A45]'
                    : 'border-white/10 bg-black/20'
              }`}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5 text-white" />
              ) : isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7C93FF]" />
              ) : (
                <Icon className="h-3.5 w-3.5 text-[#5A6291]" />
              )}
            </div>
            <span className={`text-sm ${isDone || isActive ? 'text-white' : 'text-[#5A6291]'}`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
