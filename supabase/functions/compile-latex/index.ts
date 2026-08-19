import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_LATEX_LENGTH = 200_000;
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

// Punto de integración con el proveedor de compilación LaTeX -> PDF.
// Para cambiar de proveedor, reemplaza el cuerpo de esta función:
// recibe el código .tex y debe devolver los bytes del PDF compilado.
async function compileToPdf(latexCode: string): Promise<Uint8Array> {
  const endpoint = Deno.env.get("COMPILE_API_URL") ?? "https://latex.ytotech.com/builds/sync";
  const apiKey = Deno.env.get("COMPILE_API_KEY");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      compiler: "pdflatex",
      resources: [{ main: true, content: latexCode }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`El servicio de compilación respondió con un error (${response.status}): ${detail.slice(0, 300)}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/pdf")) {
    const detail = await response.text();
    throw new Error(`El servicio de compilación no devolvió un PDF: ${detail.slice(0, 300)}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "No autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const latexCode = typeof body.latex_code === "string" ? body.latex_code.trim() : "";

    if (!latexCode) {
      return new Response(JSON.stringify({ error: "El código LaTeX no puede estar vacío." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (latexCode.length > MAX_LATEX_LENGTH) {
      return new Response(JSON.stringify({ error: "El código LaTeX es demasiado extenso." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfBytes = await compileToPdf(latexCode);

    const path = `${userData.user.id}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage.from("pdfs").upload(path, pdfBytes, {
      contentType: "application/pdf",
      upsert: false,
    });

    if (uploadError) {
      return new Response(JSON.stringify({ error: `No se pudo guardar el PDF: ${uploadError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("pdfs")
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (signedError || !signedData) {
      return new Response(JSON.stringify({ error: "No se pudo generar el enlace del PDF." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ pdf_path: path, signed_url: signedData.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Error inesperado." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
