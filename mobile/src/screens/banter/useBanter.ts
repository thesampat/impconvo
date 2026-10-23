// Banter simulator state + paced playback, ported from AppViewModel (banter section).
import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '../../api/client';
import type { BanterExchange, BanterRequest, ConversationSetting, ConversationStarter } from '../../api/types';
import { getPersonaStyle, presetIndexForKey } from './presets';

const FIRST_TURN_DELAY_MS = 1500;
const TURN_DELAY_MS = 10_000;
const INITIAL_TURNS = 8;
const CONTINUE_TURNS = 6;
const TOPIC_CATEGORY = 'short realistic social scenario where one person starts a conversation with another, e.g. approaching someone at a cafe or messaging a dating match';

export const SYSTEM_ERROR_SPEAKER = 'System Error';

export interface FeedItem extends BanterExchange {
  id: number;
}

export type SetupStep = 'scenario' | 'details';
// 'ai': watch both sides; 'typing': the user types Person A's lines live
export type MeMode = 'ai' | 'typing';

export interface BotConfig {
  name: string;
  presetIndex: number;
  customStyle: string;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

export function useBanter() {
  // Setup
  const [topicInput, setTopicInput] = useState('');
  const [botA, setBotA] = useState<BotConfig>({ name: 'Rohan', presetIndex: 2, customStyle: '' });
  const [botB, setBotB] = useState<BotConfig>({ name: 'Kiran', presetIndex: 0, customStyle: '' });
  const [setting, setSetting] = useState<ConversationSetting>('online');
  const [starter, setStarter] = useState<ConversationStarter>('me');
  const [setupStep, setSetupStep] = useState<SetupStep>('scenario');
  const [meMode, setMeMode] = useState<MeMode>('ai');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);

  // Session
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingSpeaker, setTypingSpeaker] = useState('');
  const [topic, setTopic] = useState('');
  const [personaA, setPersonaA] = useState('Rohan');
  const [personaB, setPersonaB] = useState('Kiran');
  const [messages, setMessages] = useState<FeedItem[]>([]);
  const [queueSize, setQueueSize] = useState(0);

  // Refs are the source of truth for the timer loop to avoid stale closures.
  const queueRef = useRef<BanterExchange[]>([]);
  const messagesRef = useRef<FeedItem[]>([]);
  const playingRef = useRef(false);
  const loadingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0); // bumped on start/reset/unmount to drop stale API results
  const nextIdRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setPlaying = useCallback((value: boolean) => {
    playingRef.current = value;
    setIsPlaying(value);
  }, []);

  const setLoading = useCallback((value: boolean) => {
    loadingRef.current = value;
    setIsLoading(value);
  }, []);

  const setQueue = useCallback((queue: BanterExchange[]) => {
    queueRef.current = queue;
    setQueueSize(queue.length);
  }, []);

  const setFeed = useCallback((feed: FeedItem[]) => {
    messagesRef.current = feed;
    setMessages(feed);
  }, []);

  const appendToFeed = useCallback(
    (exchange: BanterExchange) => {
      setFeed([...messagesRef.current, { ...exchange, id: nextIdRef.current++ }]);
    },
    [setFeed],
  );

  const scheduleNext = useCallback(
    (first: boolean) => {
      clearTimer();
      const next = queueRef.current[0];
      if (!playingRef.current || !next) {
        setIsTyping(false);
        if (!next) setPlaying(false);
        return;
      }
      setTypingSpeaker(next.speaker);
      setIsTyping(true);
      timerRef.current = setTimeout(
        () => {
          timerRef.current = null;
          if (!playingRef.current) return;
          const [turn, ...rest] = queueRef.current;
          if (!turn) return;
          setQueue(rest);
          setIsTyping(false);
          appendToFeed(turn);
          scheduleNext(false);
        },
        first ? FIRST_TURN_DELAY_MS : TURN_DELAY_MS,
      );
    },
    [appendToFeed, clearTimer, setPlaying, setQueue],
  );

  useEffect(
    () => () => {
      sessionRef.current++;
      clearTimer();
    },
    [clearTimer],
  );

  const generateTopic = useCallback(async () => {
    setIsGeneratingTopic(true);
    try {
      const res = await api.generateScenario({
        category: TOPIC_CATEGORY,
        previous_scenario: topicInput.trim() ? topicInput : null,
      });
      setTopicInput(res.scenario.trim() ? res.scenario : 'Error: got an empty topic, try again');
    } catch (e) {
      setTopicInput(`Error: Failed to generate an idea (${errorMessage(e, 'Check connection')})`);
    } finally {
      setIsGeneratingTopic(false);
    }
  }, [topicInput]);

  // Step 1 -> 2: let the AI guess names, personalities, who starts and where; every guess stays editable.
  const analyzeScenario = useCallback(async () => {
    const scenario = topicInput.trim();
    if (!scenario) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await api.analyzeScenario({ scenario });
      setBotA((prev) => ({
        ...prev,
        name: res.me_name,
        presetIndex: presetIndexForKey(res.me_personality, prev.presetIndex),
      }));
      setBotB((prev) => ({
        ...prev,
        name: res.other_name,
        presetIndex: presetIndexForKey(res.other_personality, prev.presetIndex),
      }));
      setStarter(res.starter);
      setSetting(res.setting);
    } catch (e) {
      setAnalyzeError(`Couldn't read the scenario (${errorMessage(e, 'check connection')}). Set the details yourself.`);
    } finally {
      setIsAnalyzing(false);
      setSetupStep('details');
    }
  }, [topicInput]);

  const backToScenario = useCallback(() => {
    setAnalyzeError(null);
    setSetupStep('scenario');
  }, []);

  // Typing mode: ask for just the other person's next line.
  const fetchReply = useCallback(
    async (session: number, nameA: string, nameB: string) => {
      const history = messagesRef.current.filter((m) => m.speaker !== SYSTEM_ERROR_SPEAKER);
      setLoading(true);
      setTypingSpeaker(nameB);
      setIsTyping(true);
      try {
        const res = await api.getBanter({
          topic: topicInput.trim() || null,
          num_turns: 1,
          persona_a_name: nameA,
          persona_a_style: getPersonaStyle(botA.presetIndex, botA.customStyle),
          persona_b_name: nameB,
          persona_b_style: getPersonaStyle(botB.presetIndex, botB.customStyle),
          setting,
          starter: history.length ? undefined : 'other',
          chat_history: history.length ? history.map((m) => ({ sender: m.speaker, body: m.text })) : null,
        });
        if (session !== sessionRef.current) return;
        const line = res.exchanges.find((e) => sameName(e.speaker, nameB)) ?? res.exchanges[0];
        if (line) appendToFeed({ speaker: nameB, text: line.text });
      } catch (e) {
        if (session !== sessionRef.current) return;
        appendToFeed({ speaker: SYSTEM_ERROR_SPEAKER, text: `Couldn't get ${nameB}'s reply: ${errorMessage(e, 'Unknown error')}` });
      } finally {
        if (session === sessionRef.current) {
          setLoading(false);
          setIsTyping(false);
        }
      }
    },
    [appendToFeed, botA, botB, setLoading, setting, topicInput],
  );

  const sendMyMessage = useCallback(
    (text: string) => {
      const body = text.trim();
      if (!body || loadingRef.current) return;
      appendToFeed({ speaker: personaA, text: body });
      fetchReply(sessionRef.current, personaA, personaB);
    },
    [appendToFeed, fetchReply, personaA, personaB],
  );

  const start = useCallback(async () => {
    const trimmedTopic = topicInput.trim();
    const nameA = botA.name.trim() || 'Rohan';
    const nameB = botB.name.trim() || 'Kiran';
    const request: BanterRequest = {
      topic: trimmedTopic || null,
      num_turns: INITIAL_TURNS,
      persona_a_name: nameA,
      persona_a_style: getPersonaStyle(botA.presetIndex, botA.customStyle),
      persona_b_name: nameB,
      persona_b_style: getPersonaStyle(botB.presetIndex, botB.customStyle),
      setting,
      starter,
    };

    if (meMode === 'typing') {
      clearTimer();
      const session = ++sessionRef.current;
      setIsSessionActive(true);
      setPlaying(false);
      setIsTyping(false);
      setFeed([]);
      setQueue([]);
      setTopic(trimmedTopic);
      setPersonaA(nameA);
      setPersonaB(nameB);
      if (starter === 'other') await fetchReply(session, nameA, nameB);
      return;
    }

    clearTimer();
    const session = ++sessionRef.current;
    setIsSessionActive(true);
    setLoading(true);
    setPlaying(false);
    setIsTyping(false);
    setFeed([]);
    setQueue([]);

    try {
      const res = await api.getBanter(request);
      if (session !== sessionRef.current) return;
      setTopic(res.topic);
      if (!trimmedTopic && res.topic.trim()) setTopicInput(res.topic);
      setPersonaA(res.persona_a);
      setPersonaB(res.persona_b);
      setQueue([...res.exchanges]);
      setLoading(false);
      setPlaying(true);
      scheduleNext(true);
    } catch (e) {
      if (session !== sessionRef.current) return;
      setLoading(false);
      setTopic(trimmedTopic || 'Random Topic');
      setPersonaA(nameA);
      setPersonaB(nameB);
      setFeed([
        {
          id: nextIdRef.current++,
          speaker: SYSTEM_ERROR_SPEAKER,
          text: `Failed to start banter simulation: ${errorMessage(e, 'Unknown error')}`,
        },
      ]);
    }
  }, [botA, botB, clearTimer, fetchReply, meMode, scheduleNext, setFeed, setLoading, setPlaying, setQueue, setting, starter, topicInput]);

  const togglePlayPause = useCallback(() => {
    if (playingRef.current) {
      setPlaying(false);
      setIsTyping(false);
      clearTimer();
    } else if (queueRef.current.length > 0) {
      setPlaying(true);
      scheduleNext(false);
    }
  }, [clearTimer, scheduleNext, setPlaying]);

  const skipNext = useCallback(() => {
    const [turn, ...rest] = queueRef.current;
    if (!turn) return;
    clearTimer();
    setQueue(rest);
    setIsTyping(false);
    appendToFeed(turn);
    if (rest.length === 0) setPlaying(false);
    else if (playingRef.current) scheduleNext(false);
  }, [appendToFeed, clearTimer, scheduleNext, setPlaying, setQueue]);

  const continueBanter = useCallback(async () => {
    if (loadingRef.current) return;
    const session = sessionRef.current;
    setLoading(true);
    const request: BanterRequest = {
      topic,
      num_turns: CONTINUE_TURNS,
      persona_a_name: personaA,
      persona_a_style: getPersonaStyle(botA.presetIndex, botA.customStyle),
      persona_b_name: personaB,
      persona_b_style: getPersonaStyle(botB.presetIndex, botB.customStyle),
      setting,
      chat_history: messagesRef.current
        .filter((m) => m.speaker !== SYSTEM_ERROR_SPEAKER)
        .map((m) => ({ sender: m.speaker, body: m.text })),
    };
    try {
      const res = await api.getBanter(request);
      if (session !== sessionRef.current) return;
      setQueue([...queueRef.current, ...res.exchanges]);
      setLoading(false);
      setPlaying(true);
      scheduleNext(false);
    } catch (e) {
      if (session !== sessionRef.current) return;
      setLoading(false);
      appendToFeed({
        speaker: SYSTEM_ERROR_SPEAKER,
        text: `Failed to continue banter: ${errorMessage(e, 'Unknown error')}`,
      });
    }
  }, [appendToFeed, botA, botB, personaA, personaB, scheduleNext, setLoading, setPlaying, setQueue, setting, topic]);

  const reset = useCallback(() => {
    sessionRef.current++;
    clearTimer();
    setPlaying(false);
    setLoading(false);
    setIsTyping(false);
    setFeed([]);
    setQueue([]);
    setTopic('');
    setIsSessionActive(false);
    setSetupStep('scenario');
  }, [clearTimer, setFeed, setLoading, setPlaying, setQueue]);

  return {
    // setup
    topicInput,
    setTopicInput,
    botA,
    setBotA,
    botB,
    setBotB,
    setting,
    setSetting,
    starter,
    setStarter,
    setupStep,
    meMode,
    setMeMode,
    isAnalyzing,
    analyzeError,
    analyzeScenario,
    backToScenario,
    isGeneratingTopic,
    generateTopic,
    start,
    // session
    isSessionActive,
    isLoading,
    isPlaying,
    isTyping,
    typingSpeaker,
    topic,
    personaA,
    personaB,
    messages,
    queueSize,
    togglePlayPause,
    skipNext,
    continueBanter,
    sendMyMessage,
    reset,
  };
}
