// ✨ Suggestions and 📊 Vibe Review for Watch & Learn's typing mode.
import { useCallback, useMemo, useRef, useState } from 'react';

import { api } from '../../api/client';
import type { ConversationSetting, MessageModel } from '../../api/types';
import type { ChatReportData } from '../coach/types';
import { SYSTEM_ERROR_SPEAKER, type FeedItem } from './useBanter';

interface Options {
  scenario: string;
  setting: ConversationSetting;
  personaA: string;
  personaB: string;
  otherPersonality: string;
  messages: FeedItem[];
}

// The coaching endpoints expect the user's lines as "Me".
function toHistory(messages: FeedItem[], personaA: string): MessageModel[] {
  return messages
    .filter((m) => m.speaker !== SYSTEM_ERROR_SPEAKER)
    .map((m) => ({ sender: m.speaker === personaA ? 'Me' : 'Partner', body: m.text }));
}

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

export function useCoachTools({ scenario, setting, personaA, personaB, otherPersonality, messages }: Options) {
  const context = useMemo(
    () =>
      `${setting === 'in_person' ? 'Talking in person' : 'Texting'}. The user is ${personaA}; ` +
      `the other person is ${personaB} (${otherPersonality}).`,
    [otherPersonality, personaA, personaB, setting],
  );

  const history = useMemo<MessageModel[]>(() => toHistory(messages, personaA), [messages, personaA]);

  // Suggestions
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const draftRef = useRef('');
  // Set when improving an already-sent line: only the chat before it is context
  const historyOverrideRef = useRef<MessageModel[] | null>(null);
  const suggestionsRequestRef = useRef(0);

  const fetchSuggestions = useCallback(async () => {
    const request = ++suggestionsRequestRef.current;
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    setSuggestions([]);
    try {
      const res = await api.improveMessage({
        context,
        scenario,
        chat_history: historyOverrideRef.current ?? history,
        message_to_improve: draftRef.current || 'generate a response',
      });
      if (request !== suggestionsRequestRef.current) return;
      if (res.alternatives.length) setSuggestions(res.alternatives.slice(0, 3));
      else setSuggestionsError('No suggestions came back. Try again.');
    } catch (e) {
      if (request !== suggestionsRequestRef.current) return;
      setSuggestionsError(`Couldn't get suggestions: ${errorMessage(e, 'Unknown error')}`);
    } finally {
      if (request === suggestionsRequestRef.current) setSuggestionsLoading(false);
    }
  }, [context, history, scenario]);

  const openSuggestions = useCallback(
    (draft: string, beforeId?: number) => {
      draftRef.current = draft.trim();
      if (beforeId === undefined) {
        historyOverrideRef.current = null;
      } else {
        const cut = messages.findIndex((m) => m.id === beforeId);
        historyOverrideRef.current = cut >= 0 ? toHistory(messages.slice(0, cut), personaA) : null;
      }
      setSuggestionsVisible(true);
      fetchSuggestions();
    },
    [fetchSuggestions, messages, personaA],
  );

  const closeSuggestions = useCallback(() => {
    suggestionsRequestRef.current++;
    setSuggestionsVisible(false);
    setSuggestionsLoading(false);
  }, []);

  // Vibe Review
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [report, setReport] = useState<ChatReportData | null>(null);
  const reviewRequestRef = useRef(0);

  const openReview = useCallback(async () => {
    const request = ++reviewRequestRef.current;
    setReviewVisible(true);
    setReviewLoading(true);
    setReviewError(null);
    setReport(null);
    if (!history.some((m) => m.sender === 'Me')) {
      setReviewLoading(false);
      setReviewError('Send at least one message before asking for a review.');
      return;
    }
    try {
      const review = await api.getVibeReview({ context, scenario, chat_history: history });
      if (request !== reviewRequestRef.current) return;
      setReport({ scenario, context, persona: `${personaB} · ${otherPersonality}`, history, review });
    } catch (e) {
      if (request !== reviewRequestRef.current) return;
      setReviewError(`Couldn't get the review: ${errorMessage(e, 'Unknown error')}`);
    } finally {
      if (request === reviewRequestRef.current) setReviewLoading(false);
    }
  }, [context, history, otherPersonality, personaB, scenario]);

  const closeReview = useCallback(() => {
    reviewRequestRef.current++;
    setReviewVisible(false);
    setReviewLoading(false);
  }, []);

  return {
    suggestionsVisible,
    suggestionsLoading,
    suggestions,
    suggestionsError,
    openSuggestions,
    regenerateSuggestions: fetchSuggestions,
    closeSuggestions,
    reviewVisible,
    reviewLoading,
    reviewError,
    report,
    openReview,
    closeReview,
  };
}
