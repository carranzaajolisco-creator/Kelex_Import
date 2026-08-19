import { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { PRESET_PALETTES, ColorPalette } from '@/types/document';

function shade(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

interface ColorPalettePickerProps {
  value: ColorPalette;
  onChange: (palette: ColorPalette) => void;
}

export function ColorPalettePicker({ value, onChange }: ColorPalettePickerProps) {
  const [customColor, setCustomColor] = useState('#1E3AE8');
  const isCustom = value.name === 'Personalizado';

  function applyCustom(color: string) {
    setCustomColor(color);
    onChange({
      name: 'Personalizado',
      colors: ['#050507', shade(color, -70), color],
    });
  }

  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-sm text-[#B4BCE0]">
        <Palette className="h-3.5 w-3.5" />
        Paleta de colores
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESET_PALETTES.map((palette) => {
          const active = value.name === palette.name;
          return (
            <button
              key={palette.name}
              type="button"
              onClick={() => onChange(palette)}
              className={`group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                active
                  ? 'border-[#2946E0] bg-[#131A45]'
                  : 'border-white/10 bg-black/20 hover:border-white/25'
              }`}
            >
              <span className="flex overflow-hidden rounded-full ring-1 ring-white/10">
                {palette.colors.map((c) => (
                  <span key={c} className="h-4 w-4" style={{ backgroundColor: c }} />
                ))}
              </span>
              <span className="text-[#D6DCFF]">{palette.name}</span>
              {active && <Check className="h-3 w-3 text-[#7C93FF]" />}
            </button>
          );
        })}

        <label
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
            isCustom ? 'border-[#2946E0] bg-[#131A45]' : 'border-white/10 bg-black/20 hover:border-white/25'
          }`}
        >
          <input
            type="color"
            value={customColor}
            onChange={(e) => applyCustom(e.target.value)}
            className="h-4 w-4 cursor-pointer rounded-full border-none bg-transparent p-0"
          />
          <span className="text-[#D6DCFF]">Personalizado</span>
          {isCustom && <Check className="h-3 w-3 text-[#7C93FF]" />}
        </label>
      </div>
    </div>
  );
}
