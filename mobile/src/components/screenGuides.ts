// Per-screen guide content, ported from ScreenInfoSheet.kt (getGuideForScreen).
import type { ScreenId } from '../screens/types';

export interface ScreenGuide {
  title: string;
  icon: string;
  subtitle: string;
  purpose: string;
  whatToInput: string;
  inputExample: string;
  whatYouGet: string;
  steps: string[];
  proTip: string;
}

export const SCREEN_GUIDES: Record<ScreenId, ScreenGuide> = {
  chat: {
    title: 'Simple Chat Coach',
    icon: '💬',
    subtitle: 'Real-time Texting Roleplay & Analysis',
    purpose:
      'Practice realistic texting conversations with an AI partner. Build your confidence, try humor and banter risk-free, and receive live suggestions and an engagement score.',
    whatToInput:
      "Describe who you're talking to and where you met, followed by your opening message.",
    inputExample:
      "\"Met Maya on Hinge, her prompt says 'Looking for someone to critique my Spotify Wrapped'. Hey Maya, promise not to judge my guilty pleasures if you share yours first?\" (Or simply tap 'Generate Idea' to auto-fill one!)",
    whatYouGet:
      '• Realistic, casual partner replies (under 10 words).\n• 3 alternative rewrites anytime you tap the ✨ button (Humor, Banter, Smooth).\n• Complete Vibe Review Report with overall score (1-100) and line-by-line coaching feedback.',
    steps: [
      "Tap 'Generate Idea' (or 'New Idea') to get a ready-to-use scenario, or type your own.",
      "Tap 'Initiate Scenario' to start the roleplay chat.",
      'Text back and forth naturally with your AI partner.',
      'Tap the ✨ sparkle icon next to the text bar for witty coaching suggestions, or double-tap one of your sent messages to rewrite it.',
      "Tap 'Report' to view your Vibe Review with engagement score and coaching tips.",
    ],
    proTip:
      'Tap the ✨ sparkle button next to the text box before sending a message to see 3 different ways a texting coach would write it!',
  },
  openers: {
    title: 'Opener Line Generator',
    icon: '🎯',
    subtitle: 'High-Engagement Conversation Starters',
    purpose:
      "Never send a boring 'Hey' or 'What's up' again. Generates charming, curiosity-sparking opening lines tailored to a person's profile, photos, or situation.",
    whatToInput:
      'Type a quick note about their bio, prompts, or photos (e.g. their hobbies, travel pics), or upload a screenshot of their profile.',
    inputExample:
      '"Holding a vintage film camera in a park" or "Bio says: \'Ask me about my obscure music taste\'"',
    whatYouGet:
      '• 4 curated opener lines across different vibes (Humorous, Teasing, Observational, Smooth).\n• Strategy explanation for why each line creates curiosity and gets high reply rates.',
    steps: [
      'Type a description of their profile, or attach a screenshot of it with the image picker.',
      "Tap 'Generate High-Vibe Openers ✨'.",
      'Review the suggestions and pick the vibe that fits you best.',
      'Tap the copy button on any opener card to copy it to your clipboard!',
    ],
    proTip:
      'Observational openers that playfully tease a specific detail from photo #3 get 3x more responses than generic compliments!',
  },
  misinterpret: {
    title: 'Deliberate Misinterpretation Builder',
    icon: '🤪',
    subtitle: 'Master the #1 Banter & Flirting Technique',
    purpose:
      "Learn the art of 'playful misinterpretation' — deliberately twisting what someone said into a humorous, flirty, or teasing meaning instead of answering literally.",
    whatToInput: 'Paste an ordinary text or question that your partner just sent you.',
    inputExample: '"I had salad for dinner today" or "I\'m going to sleep early tonight"',
    whatYouGet:
      '• Multiple witty ways to playfully misinterpret their text (Feigned Arrogance, Mock Drama, Playful Accusation, Flirty Twist).\n• Coaching explanations explaining the psychology behind each flip.',
    steps: [
      'Paste the message your partner sent into the text box.',
      "Tap 'Generate Playful Twists ✨'.",
      'Read through the angles and tap the copy button on any card.',
      'Send it back to turn a boring exchange into fun, flirtatious banter!',
    ],
    proTip:
      "When someone makes a mundane statement, assume they're secretly bragging or testing you. It immediately changes the conversational dynamic!",
  },
  banter: {
    title: 'Watch & Learn',
    icon: '🎭',
    subtitle: 'Watch a Simulated Conversation Unfold',
    purpose:
      'Describe a situation and watch the two people in it talk to each other turn by turn: Person A is you (the "I" in the scenario), Person B is the other person. Whoever starts in the scenario speaks first. Study comedic timing, callbacks, and conversational rhythm.',
    whatToInput:
      'Choose online (texting) or in person, describe the scenario, and pick names and personality styles for Person A (you) and Person B (the other person).',
    inputExample:
      '"I approach a girl at a cafe" or "A girl asks me for directions on the street"',
    whatYouGet:
      "• A simulated conversation that plays out like a real chat or in-person talk.\n• 10-second realistic typing delays with pulsing indicators.\n• Full playback controls: Pause, Resume, Next turn, and '+6 Turns' to continue.",
    steps: [
      "Describe the scenario (or tap 'Generate Idea') and tap 'Next'.",
      'The AI suggests names, who speaks first and whether it is online or in person.',
      'Change any suggestion you like and pick a personality style for each person.',
      "Tap 'Start Conversation' and watch them talk turn-by-turn with 10s delays.",
      "Tap Pause/Resume or Next to skip ahead, and tap '+6 Turns' to keep it going!",
    ],
    proTip:
      "Try pairing contrasting personalities (like 'Cocky & Confident' vs 'Dry & Reluctant') to see how banter plays off each other!",
  },
};
