import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DOCUMENT_KINDS = ["informe", "articulo", "presentacion", "carta", "cv"] as const;
type DocumentKind = (typeof DOCUMENT_KINDS)[number];

interface GenerateRequest {
  prompt: string;
  kind: DocumentKind;
  title?: string;
  colors: string[];
}

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#%&_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function hex(color: string): string {
  return color.replace("#", "").toUpperCase();
}

function buildPreamble(kind: DocumentKind, colors: string[], title: string) {
  const [bg, secondary, primary] = [
    colors[0] ?? "#050507",
    colors[1] ?? "#131A45",
    colors[2] ?? colors[colors.length - 1] ?? "#1E3AE8",
  ];
  const safeTitle = escapeLatex(title);

  if (kind === "presentacion") {
    return {
      preamble: `\\documentclass{beamer}
\\usetheme{Madrid}
\\definecolor{primary}{HTML}{${hex(primary)}}
\\definecolor{secondary}{HTML}{${hex(secondary)}}
\\definecolor{background}{HTML}{${hex(bg)}}
\\setbeamercolor{palette primary}{bg=primary,fg=white}
\\setbeamercolor{palette secondary}{bg=secondary,fg=white}
\\setbeamercolor{title}{fg=primary}
\\setbeamercolor{frametitle}{bg=secondary,fg=white}
\\setbeamercolor{structure}{fg=primary}
\\title{${safeTitle}}
\\author{Generado con Kelex}
\\date{\\today}
\\begin{document}
\\frame{\\titlepage}
`,
      closing: "\n\\end{document}\n",
      instructions:
        "Genera el contenido en diapositivas usando \\begin{frame}...\\end{frame}, cada una con \\frametitle{...}. No incluyas \\documentclass, \\begin{document}, \\titlepage ni \\end{document}: ya están definidos. Usa listas e ideas concisas, una idea por diapositiva.",
    };
  }

  return {
    preamble: `\\documentclass[11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{xcolor}
\\usepackage{fancyhdr}
\\usepackage{titlesec}
\\usepackage{graphicx}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\definecolor{primary}{HTML}{${hex(primary)}}
\\definecolor{secondary}{HTML}{${hex(secondary)}}
\\definecolor{background}{HTML}{${hex(bg)}}

\\titleformat{\\section}{\\color{primary}\\Large\\bfseries}{\\thesection}{1em}{}
\\titleformat{\\subsection}{\\color{secondary}\\large\\bfseries}{\\thesubsection}{1em}{}

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0.4pt}
\\renewcommand{\\footrulewidth}{0.4pt}
\\fancyhead[L]{\\textcolor{primary}{${safeTitle}}}
\\fancyhead[R]{\\thepage}
\\fancyfoot[C]{\\textit{Generado con Kelex}}

\\hypersetup{colorlinks=true, linkcolor=primary, urlcolor=primary}

\\title{\\textcolor{primary}{\\Huge ${safeTitle}}}
\\author{}
\\date{\\today}

\\begin{document}
\\maketitle
`,
    closing: "\n\\end{document}\n",
    instructions: kindInstructions(kind),
  };
}

function kindInstructions(kind: DocumentKind): string {
  switch (kind) {
    case "articulo":
      return "Genera el cuerpo de un artículo académico en LaTeX: introducción, secciones con \\section y \\subsection, y conclusión. No incluyas \\documentclass, \\begin{document}, \\maketitle ni \\end{document}: ya están definidos.";
    case "carta":
      return "Genera el cuerpo de una carta formal en LaTeX (sin \\section): fecha, destinatario, saludo, cuerpo del mensaje y despedida con firma. No incluyas \\documentclass, \\begin{document}, \\maketitle ni \\end{document}: ya están definidos.";
    case "cv":
      return "Genera el cuerpo de un currículum en LaTeX usando \\section para bloques como Experiencia, Educación y Habilidades, con listas (itemize) para el detalle. No incluyas \\documentclass, \\begin{document}, \\maketitle ni \\end{document}: ya están definidos.";
    default:
      return "Genera el cuerpo de un informe en LaTeX con introducción, secciones con \\section y \\subsection, tablas o listas si corresponde, y conclusión. No incluyas \\documentclass, \\begin{document}, \\maketitle ni \\end{document}: ya están definidos.";
  }
}

function stripCodeFence(text: string): string {
  const match = text.match(/```(?:latex|tex)?\n([\s\S]*?)```/i);
  return (match ? match[1] : text).trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Falta configurar la clave de Groq (GROQ_API_KEY) como secreto del proyecto.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: GenerateRequest = await req.json();
    const prompt = (body.prompt ?? "").trim();
    const kind = DOCUMENT_KINDS.includes(body.kind) ? body.kind : "informe";
    const colors = Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : ["#050507", "#131A45", "#1E3AE8"];
    const title = (body.title ?? "").trim() || "Documento generado con Kelex";

    if (!prompt) {
      return new Response(JSON.stringify({ error: "El prompt no puede estar vacío." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { preamble, closing, instructions } = buildPreamble(kind, colors, title);

    const systemPrompt = `Eres un experto en LaTeX que redacta contenido para la app Kelex. ${instructions} Escribe en español, con contenido completo y coherente basado en las indicaciones del usuario. Responde ÚNICAMENTE con código LaTeX válido, sin explicaciones ni comentarios fuera del código.`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const detail = await groqResponse.text();
      return new Response(
        JSON.stringify({ error: `Groq respondió con un error (${groqResponse.status}): ${detail.slice(0, 300)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string" || !rawContent.trim()) {
      return new Response(JSON.stringify({ error: "Groq no devolvió contenido." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = stripCodeFence(rawContent);
    const latexCode = `${preamble}\n${content}${closing}`;

    return new Response(JSON.stringify({ latex_code: latexCode, title }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Error inesperado." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
