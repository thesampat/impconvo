// App screens. Watch & Learn replaced the Android app's Simple Chat.
export type ScreenId = 'banter' | 'openers' | 'misinterpret';

export const SCREENS: { id: ScreenId; title: string; icon: string }[] = [
  { id: 'banter', title: 'Watch & Learn', icon: '🎭' },
  { id: 'openers', title: 'Opener Generator', icon: '🎯' },
  { id: 'misinterpret', title: 'Misinterpret Builder', icon: '🤪' },
];
