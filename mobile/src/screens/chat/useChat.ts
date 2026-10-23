// Chat simulator state + API logic, ported from the chat part of
// android/app/.../ui/viewmodel/AppViewModel.kt.
import { useCallback, useRef, useState } from 'react';

import { api } from '../../api/client';
import type { MessageModel, PartnerPersona } from '../../api/types';
import type { ChatReportData } from './types';

// The backend treats sender "Me" as the user and anything else as the partner.
export const SENDER_ME = 'Me';
export const SENDER_PARTNER = 'Partner';
export const SENDER_ERROR = 'System Error';

export type SuggestionTarget = { kind: 'composer'; text: string } | { kind: 'message'; index: number; text: string };

interface SuggestionsState {
  visible: boolean;
  loading: boolean;
  list: string[];
  error: string | null;
  target: SuggestionTarget | null;
}

interface VibeState {
  visible: boolean;
  loading: boolean;
  error: string | null;
  report: ChatReportData | null;
}

const CLOSED_SUGGESTIONS: SuggestionsState = { visible: false, loading: false, list: [], error: null, target: null };
const CLOSED_VIBE: VibeState = { visible: false, loading: false, error: null, report: null };

function errorMessage(e: unknown): string {
  return e instanceof Error && e.message ? e.message : 'Network error';
}

// Error bubbles are UI-only and must never reach the backend.
function forApi(history: MessageModel[]): MessageModel[] {
  return history.filter((m) => m.sender !== SENDER_ERROR);
}

export function useChat() {
  const [history, setHistory] = useState<MessageModel[]>([]);
  const [context, setContext] = useState('');
  const [scenario, setScenario] = useState('');
  const [scenarioInput, setScenarioInput] = useState('');
  const [persona, setPersona] = useState<PartnerPersona>('normal');
  const [composerText, setComposerText] = useState('');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionsState>(CLOSED_SUGGESTIONS);
  const [vibe, setVibe] = useState<VibeState>(CLOSED_VIBE);

  // Bumped on reset so responses from a previous session are dropped.
  const sessionRef = useRef(0);
  const suggestionReqRef = useRef(0);
  const vibeReqRef = useRef(0);

  const generateScenario = useCallback(async () => {
    const session = sessionRef.current;
    setIsGeneratingScenario(true);
    setSetupError(null);
    try {
      const prev = scenarioInput.trim();
      const res = await api.generateScenario({ previous_scenario: prev || null });
      if (session !== sessionRef.current) return;
      if (res.scenario.trim()) setScenarioInput(res.scenario);
    } catch (e) {
      if (session === sessionRef.current) setSetupError(`Could not generate a scenario: ${errorMessage(e)}`);
    } finally {
      if (session === sessionRef.current) setIsGeneratingScenario(false);
    }
  }, [scenarioInput]);

  const initiateChat = useCallback(async () => {
    const input = scenarioInput.trim();
    if (!input || isChatLoading) return;
    const session = sessionRef.current;
    setIsChatLoading(true);
    setSetupError(null);
    try {
      const res = await api.initiateChat({ user_first_input: input, partner_persona: persona });
      if (session !== sessionRef.current) return;
      setContext(res.context);
      setScenario(res.scenario);
      setHistory([
        { sender: SENDER_ME, body: res.cleaned_user_message },
        { sender: SENDER_PARTNER, body: res.partner_reply },
      ]);
    } catch (e) {
      if (session === sessionRef.current) {
        setSetupError(`Could not start the chat. Please verify your server settings. ${errorMessage(e)}`);
      }
    } finally {
      if (session === sessionRef.current) setIsChatLoading(false);
    }
  }, [scenarioInput, isChatLoading, persona]);

  const sendMessage = useCallback(async () => {
    const text = composerText.trim();
    if (!text || isChatLoading) return;
    const session = sessionRef.current;
    const previous = forApi(history);
    setComposerText('');
    setHistory((h) => [...h, { sender: SENDER_ME, body: text }]);
    setIsChatLoading(true);
    try {
      const res = await api.sendMessage({
        context,
        scenario,
        chat_history: previous,
        message: text,
        partner_persona: persona,
      });
      if (session !== sessionRef.current) return;
      setHistory((h) => [...h, { sender: SENDER_PARTNER, body: res.reply }]);
    } catch (e) {
      if (session !== sessionRef.current) return;
      setHistory((h) => [
        ...h,
        {
          sender: SENDER_ERROR,
          body: `Could not send message. Please verify your server settings. ${errorMessage(e)}`,
        },
      ]);
    } finally {
      if (session === sessionRef.current) setIsChatLoading(false);
    }
  }, [composerText, isChatLoading, history, context, scenario, persona]);

  const fetchSuggestions = useCallback(
    async (target: SuggestionTarget) => {
      const req = ++suggestionReqRef.current;
      setSuggestions({ visible: true, loading: true, list: [], error: null, target });
      const before = target.kind === 'message' ? history.slice(0, target.index) : history;
      try {
        const res = await api.improveMessage({
          context: context || 'Casual conversation',
          scenario: scenario || 'Witty texting exchange',
          chat_history: forApi(before),
          message_to_improve: target.text.trim() || 'generate a response',
        });
        if (req !== suggestionReqRef.current) return;
        setSuggestions((s) => ({
          ...s,
          loading: false,
          list: res.alternatives,
          error: res.alternatives.length ? null : 'No suggestions came back. Try regenerating.',
        }));
      } catch (e) {
        if (req !== suggestionReqRef.current) return;
        setSuggestions((s) => ({ ...s, loading: false, error: `Could not get suggestions: ${errorMessage(e)}` }));
      }
    },
    [history, context, scenario],
  );

  const suggestForComposer = useCallback(() => {
    fetchSuggestions({ kind: 'composer', text: composerText });
  }, [fetchSuggestions, composerText]);

  const suggestForMessage = useCallback(
    (index: number) => {
      const msg = history[index];
      if (msg?.sender !== SENDER_ME) return;
      fetchSuggestions({ kind: 'message', index, text: msg.body });
    },
    [fetchSuggestions, history],
  );

  const regenerateSuggestions = useCallback(() => {
    if (suggestions.target && !suggestions.loading) fetchSuggestions(suggestions.target);
  }, [fetchSuggestions, suggestions.target, suggestions.loading]);

  const closeSuggestions = useCallback(() => {
    suggestionReqRef.current++;
    setSuggestions(CLOSED_SUGGESTIONS);
  }, []);

  const selectSuggestion = useCallback(
    (text: string) => {
      const target = suggestions.target;
      if (target?.kind === 'message') {
        setHistory((h) =>
          h.map((m, i) => (i === target.index && m.sender === SENDER_ME ? { ...m, body: text } : m)),
        );
      } else {
        setComposerText(text);
      }
      closeSuggestions();
    },
    [suggestions.target, closeSuggestions],
  );

  const requestVibeReview = useCallback(async () => {
    const chatHistory = forApi(history);
    if (!chatHistory.length) return;
    const req = ++vibeReqRef.current;
    setVibe({ visible: true, loading: true, error: null, report: null });
    try {
      const review = await api.getVibeReview({ context, scenario, chat_history: chatHistory });
      if (req !== vibeReqRef.current) return;
      setVibe({
        visible: true,
        loading: false,
        error: null,
        report: { scenario, context, persona, history: chatHistory, review },
      });
    } catch (e) {
      if (req !== vibeReqRef.current) return;
      setVibe({ visible: true, loading: false, error: `Failed to run review: ${errorMessage(e)}`, report: null });
    }
  }, [history, context, scenario, persona]);

  const closeVibe = useCallback(() => {
    vibeReqRef.current++;
    setVibe(CLOSED_VIBE);
  }, []);

  const cyclePersona = useCallback(() => {
    setPersona((p) => {
      const order: PartnerPersona[] = ['normal', 'intermediate', 'extraordinary'];
      return order[(order.indexOf(p) + 1) % order.length];
    });
  }, []);

  const resetChat = useCallback(() => {
    sessionRef.current++;
    suggestionReqRef.current++;
    vibeReqRef.current++;
    setHistory([]);
    setContext('');
    setScenario('');
    setScenarioInput('');
    setComposerText('');
    setSetupError(null);
    setIsChatLoading(false);
    setIsGeneratingScenario(false);
    setSuggestions(CLOSED_SUGGESTIONS);
    setVibe(CLOSED_VIBE);
  }, []);

  return {
    history,
    scenario,
    scenarioInput,
    setScenarioInput,
    persona,
    setPersona,
    cyclePersona,
    composerText,
    setComposerText,
    isGeneratingScenario,
    isChatLoading,
    setupError,
    generateScenario,
    initiateChat,
    sendMessage,
    suggestions,
    suggestForComposer,
    suggestForMessage,
    regenerateSuggestions,
    selectSuggestion,
    closeSuggestions,
    vibe,
    requestVibeReview,
    closeVibe,
    resetChat,
  };
}
