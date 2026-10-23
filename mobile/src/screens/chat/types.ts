// Contract between the chat screen (ChatScreen.tsx) and its overlays
// (SuggestionsDialog.tsx, VibeReviewSheet.tsx, report.ts).
import type { MessageModel, PartnerPersona, VibeReviewResponse } from '../../api/types';

export const PARTNER_PERSONAS: { id: PartnerPersona; label: string; short: string }[] = [
  { id: 'normal', label: 'Normal (Dry)', short: 'Normal' },
  { id: 'intermediate', label: 'Playful', short: 'Intermediate' },
  { id: 'extraordinary', label: 'High Banter', short: 'Extraordinary' },
];

// Everything the Vibe Review report (PDF / share / copy) needs.
export interface ChatReportData {
  scenario: string;
  context: string;
  persona: PartnerPersona;
  history: MessageModel[];
  review: VibeReviewResponse;
}

export interface SuggestionsDialogProps {
  visible: boolean;
  loading: boolean;
  suggestions: string[];
  error?: string | null;
  onSelect: (text: string) => void;
  onRegenerate: () => void;
  onClose: () => void;
}

export interface VibeReviewSheetProps {
  visible: boolean;
  loading: boolean;
  error?: string | null;
  // Non-null once the review has loaded; used for the report actions.
  report: ChatReportData | null;
  onClose: () => void;
}
