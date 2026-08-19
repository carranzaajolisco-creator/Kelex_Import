import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ColorPalettePicker } from '@/components/ColorPalettePicker';
import { GenerationProgress, GenerationStep } from '@/components/GenerationProgress';
import { supabase } from '@/lib/supabase';
import { generateLatex, compileLatex } from '@/lib/edgeFunctions';
import { useAuth } from '@/contexts/AuthContext';
import {
  ColorPalette,
  DOCUMENT_KINDS,
  DocumentKind,
  KelexDocument,
  PRESET_PALETTES,
} from '@/types/document';

function deriveTitle(prompt: string): string {
  const words = prompt.trim().split(/\s+/).slice(0, 8).join(' ');
  if (!words) return 'Documento generado con Kelex';
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return prompt.trim().split(/\s+/).length > 8 ? `${capitalized}…` : capitalized;
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<KelexDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  const [prompt, setPrompt] = useState('');
  const [kind, setKind] = useState<DocumentKind>('informe');
  const [palette, setPalette] = useState<ColorPalette>(PRESET_PALETTES[0]);

  const [step, setStep] = useState<GenerationStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [user?.id]);

  async function loadDocuments() {
    if (!user) return;
    setLoadingDocuments(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data as KelexDocument[]);
    }
    setLoadingDocuments(false);
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || step !== null || !user) return;

    setError(null);
    const title = deriveTitle(prompt);

    try {
      setStep('content');
      const generated = await generateLatex({ prompt, kind, colors: palette.colors, title });

      setStep('compiling');
      const compiled = await compileLatex(generated.latex_code);

      const { data, error: insertError } = await supabase
        .from('documents')
        .insert({
          title: generated.title,
          prompt,
          color_palette: palette,
          latex_code: generated.latex_code,
          pdf_url: compiled.pdf_path,
        })
        .select('id')
        .single();

      if (insertError || !data) {
        throw new Error('No se pudo guardar el documento.');
      }

      navigate(`/documento/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
      setStep(null);
    }
  }

  const isGenerating = step !== null;

  return (
    <div className="flex h-screen bg-[#050507]">
      <Sidebar documents={documents} loading={loadingDocuments} />

      <main className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-10">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-semibold text-white">¿Qué documento necesitas hoy?</h1>
          <p className="mt-1.5 text-sm text-[#8A94C4]">
            Describe el tema, el contenido a incluir y el tipo de documento. Kelex generará el
            LaTeX y compilará el PDF por ti.
          </p>

          <form onSubmit={handleGenerate} className="mt-6 space-y-5">
            <div className="rounded-xl border border-white/10 bg-[#0D1230] p-4 focus-within:border-[#2946E0]/60">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                rows={5}
                placeholder="Ej: Un informe sobre el impacto de la energía solar en América Latina, con datos de crecimiento 2015-2025 y una conclusión con recomendaciones."
                className="w-full resize-none bg-transparent text-sm text-white placeholder:text-[#5A6291] focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#B4BCE0]">Tipo de documento</label>
              <div className="flex flex-wrap gap-2">
                {DOCUMENT_KINDS.map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setKind(k.value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-60 ${
                      kind === k.value
                        ? 'border-[#2946E0] bg-[#131A45] text-white'
                        : 'border-white/10 bg-black/20 text-[#B4BCE0] hover:border-white/25'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            <ColorPalettePicker value={palette} onChange={setPalette} />

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
            )}

            {step && <GenerationProgress step={step} />}

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3AE8] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2946E0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Generar documento
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
