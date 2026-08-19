export interface ColorPalette {
  name: string;
  colors: string[];
}

export interface KelexDocument {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  color_palette: ColorPalette | null;
  latex_code: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export type DocumentKind = 'informe' | 'articulo' | 'presentacion' | 'carta' | 'cv';

export const DOCUMENT_KINDS: { value: DocumentKind; label: string }[] = [
  { value: 'informe', label: 'Informe' },
  { value: 'articulo', label: 'Artículo académico' },
  { value: 'presentacion', label: 'Presentación (Beamer)' },
  { value: 'carta', label: 'Carta formal' },
  { value: 'cv', label: 'Currículum' },
];

export const PRESET_PALETTES: ColorPalette[] = [
  { name: 'Azul rey', colors: ['#050507', '#131A45', '#1E3AE8'] },
  { name: 'Esmeralda', colors: ['#06110B', '#0F3D2E', '#12A16B'] },
  { name: 'Carbón', colors: ['#0A0A0A', '#2B2B2B', '#8A8A8A'] },
  { name: 'Vino', colors: ['#0A0507', '#3D0F1F', '#C21E56'] },
  { name: 'Ámbar', colors: ['#0A0704', '#3D2A0F', '#E0952E'] },
];
