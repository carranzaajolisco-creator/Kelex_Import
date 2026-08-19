import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { ArrowLeft, Download, FileWarning, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compileLatex } from '@/lib/edgeFunctions';
import type { KelexDocument } from '@/types/document';

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const latexLanguage = StreamLanguage.define(stex);

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<KelexDocument | null>(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadedRef = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    loadedRef.current = false;
    loadDocument();
    return () => clearTimeout(saveTimeout.current);
  }, [id]);

  async function loadDocument() {
    if (!id) return;
    setLoading(true);
    setNotFound(false);

    const { data, error } = await supabase.from('documents').select('*').eq('id', id).maybeSingle();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const document = data as KelexDocument;
    setDoc(document);
    setTitle(document.title);
    setCode(document.latex_code ?? '');

    if (document.pdf_url) {
      await refreshSignedUrl(document.pdf_url);
    }

    loadedRef.current = true;
    setLoading(false);
  }

  async function refreshSignedUrl(path: string) {
    const { data } = await supabase.storage.from('pdfs').createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    setSignedUrl(data?.signedUrl ?? null);
  }

  const persistCode = useCallback(
    async (nextCode: string) => {
      if (!id) return;
      setSaveState('saving');
      const { error } = await supabase.from('documents').update({ latex_code: nextCode }).eq('id', id);
      setSaveState(error ? 'idle' : 'saved');
    },
    [id]
  );

  function handleCodeChange(value: string) {
    setCode(value);
    if (!loadedRef.current) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => persistCode(value), 1200);
  }

  async function handleTitleBlur() {
    if (!id || !doc || title.trim() === doc.title || !title.trim()) {
      setTitle(doc?.title ?? title);
      return;
    }
    const { error } = await supabase.from('documents').update({ title: title.trim() }).eq('id', id);
    if (!error) setDoc({ ...doc, title: title.trim() });
  }

  async function handleRecompile() {
    if (!id || compiling) return;
    setError(null);
    setCompiling(true);
    try {
      const result = await compileLatex(code);
      const { error: updateError } = await supabase
        .from('documents')
        .update({ pdf_url: result.pdf_path })
        .eq('id', id);
      if (updateError) throw new Error('No se pudo actualizar el documento.');
      setSignedUrl(result.signed_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo compilar el PDF.');
    } finally {
      setCompiling(false);
    }
  }

  function handleDownload() {
    if (!signedUrl) return;
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = `${title || 'documento'}.pdf`;
    link.click();
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050507]">
        <Loader2 className="h-6 w-6 animate-spin text-[#7C93FF]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#050507] text-center">
        <FileWarning className="h-8 w-8 text-[#5A6291]" />
        <p className="text-white">No encontramos este documento.</p>
        <button
          onClick={() => navigate('/panel')}
          className="text-sm text-[#7C93FF] hover:text-[#9DB0FF]"
        >
          Volver al panel
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#050507]">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#0A0A0F] px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate('/panel')}
            className="rounded-lg p-1.5 text-[#8A94C4] transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="min-w-0 flex-1 truncate bg-transparent text-sm font-medium text-white focus:outline-none"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {saveState === 'saving' && <span className="text-xs text-[#5A6291]">Guardando...</span>}
          {saveState === 'saved' && <span className="text-xs text-[#5A6291]">Guardado</span>}

          <button
            onClick={handleRecompile}
            disabled={compiling}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-60"
          >
            {compiling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Recompilar
          </button>

          <button
            onClick={handleDownload}
            disabled={!signedUrl}
            className="flex items-center gap-1.5 rounded-lg bg-[#1E3AE8] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2946E0] disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar PDF
          </button>
        </div>
      </header>

      {error && (
        <p className="border-b border-red-500/20 bg-red-500/10 px-5 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 overflow-y-auto border-r border-white/10">
          <CodeMirror
            value={code}
            onChange={handleCodeChange}
            theme="dark"
            extensions={[latexLanguage]}
            height="100%"
            style={{ height: '100%', fontSize: 13 }}
          />
        </div>

        <div className="flex w-1/2 items-center justify-center bg-[#0A0A0F]">
          {signedUrl ? (
            <iframe title="Vista previa del PDF" src={signedUrl} className="h-full w-full" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center text-[#5A6291]">
              <FileWarning className="h-8 w-8" />
              <p className="text-sm">Aún no hay un PDF compilado.</p>
              <button
                onClick={handleRecompile}
                className="text-sm text-[#7C93FF] hover:text-[#9DB0FF]"
              >
                Compilar ahora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
