// Ported from AppViewModel.banterPresets
export interface BanterPersonaOption {
  title: string;
  style: string;
}

export const BANTER_PRESETS: readonly BanterPersonaOption[] = [
  { title: 'Sarcastic & Witty', style: 'sarcastic, clever, and dry-humored. Never lets the other get away with anything.' },
  { title: 'Flirty & Teasing', style: 'playfully flirty, charming, teasing, and subtly suggestive.' },
  { title: 'Cocky & Confident', style: 'cocky, witty, overly confident, and loves teasing with high self-assurance.' },
  { title: 'Dry & Reluctant', style: 'unimpressed, deadpan, concise, but secretly invested in the banter.' },
  { title: 'Nerdy & Overthinker', style: 'hyper-intellectual, overthinks everything, references random facts and logic.' },
];

/** Index used for the free-text "Custom" option. */
export const CUSTOM_PRESET_INDEX = BANTER_PRESETS.length;

export function getPersonaStyle(presetIndex: number, customStyle: string): string {
  const preset = BANTER_PRESETS[presetIndex];
  if (preset) return preset.style;
  return customStyle.trim() ? customStyle : BANTER_PRESETS[0].style;
}

/** Append an alpha channel to a #RRGGBB colour. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
