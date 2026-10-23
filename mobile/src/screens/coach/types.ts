// Shared coaching overlays (SuggestionsDialog.tsx, VibeReviewSheet.tsx, report.ts).
import type { MessageModel, VibeReviewResponse } from '../../api/types';

// Everything the Vibe Review report (PDF / share / copy) needs.
export interface ChatReportData {
  scenario: string;
  context: string;
  // Shown in the report, e.g. "Maya · Dry & Reluctant"
  persona: string;
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
