import { supabase } from '@/lib/supabase';
import type { DocumentKind } from '@/types/document';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function generateLatex(params: {
  prompt: string;
  kind: DocumentKind;
  colors: string[];
  title?: string;
}): Promise<{ latex_code: string; title: string }> {
  const response = await fetch(`${FUNCTIONS_URL}/generate-latex`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(params),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body || typeof body.latex_code !== 'string') {
    throw new Error(body?.error || 'No se pudo generar el contenido del documento.');
  }
  return body;
}

export async function compileLatex(
  latexCode: string
): Promise<{ pdf_path: string; signed_url: string }> {
  const response = await fetch(`${FUNCTIONS_URL}/compile-latex`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ latex_code: latexCode }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body || typeof body.signed_url !== 'string') {
    throw new Error(body?.error || 'No se pudo compilar el PDF.');
  }
  return body;
}
