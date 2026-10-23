// The four app screens, matching AppScreen in android/app/.../MainActivity.kt
export type ScreenId = 'chat' | 'openers' | 'misinterpret' | 'banter';

export const SCREENS: { id: ScreenId; title: string; icon: string }[] = [
  { id: 'chat', title: 'Simple Chat', icon: '💬' },
  { id: 'openers', title: 'Opener Generator', icon: '🎯' },
  { id: 'misinterpret', title: 'Misinterpret Builder', icon: '🤪' },
  { id: 'banter', title: 'Watch & Learn', icon: '🎭' },
];
