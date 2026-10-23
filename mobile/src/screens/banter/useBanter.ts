// Banter simulator state + paced playback, ported from AppViewModel (banter section).
import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '../../api/client';
import type { BanterExchange, BanterRequest } from '../../api/types';
import { getPersonaStyle } from './presets';

const FIRST_TURN_DELAY_MS = 1500;
const TURN_DELAY_MS = 10_000;
const INITIAL_TURNS = 8;
const CONTINUE_TURNS = 6;
const TOPIC_CATEGORY = 'playful argument debate banter topic between two friends or dating matches';

export const SYSTEM_ERROR_SPEAKER = 'System Error';

export interface FeedItem extends BanterExchange {
  id: number;
}

export interface BotConfig {
  name: string;
  presetIndex: number;
  customStyle: string;
}

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

export function useBanter() {
  // Setup
  const [topicInput, setTopicInput] = useState('');
  const [botA, setBotA] = useState<BotConfig>({ name: 'Alex', presetIndex: 2, customStyle: '' });
  const [botB, setBotB] = useState<BotConfig>({ name: 'Jordan', presetIndex: 0, customStyle: '' });
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);

  // Session
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingSpeaker, setTypingSpeaker] = useState('');
  const [topic, setTopic] = useState('');
  const [personaA, setPersonaA] = useState('Alex');
  const [personaB, setPersonaB] = useState('Jordan');
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
      setTopicInput(res.scenario.trim() ? res.scenario : 'Error: AI generated an empty topic');
    } catch (e) {
      setTopicInput(`Error: Failed to generate idea via AI (${errorMessage(e, 'Check connection')})`);
    } finally {
      setIsGeneratingTopic(false);
    }
  }, [topicInput]);

  const start = useCallback(async () => {
    const trimmedTopic = topicInput.trim();
    const nameA = botA.name.trim() || 'Alex';
    const nameB = botB.name.trim() || 'Jordan';
    const request: BanterRequest = {
      topic: trimmedTopic || null,
      num_turns: INITIAL_TURNS,
      persona_a_name: nameA,
      persona_a_style: getPersonaStyle(botA.presetIndex, botA.customStyle),
      persona_b_name: nameB,
      persona_b_style: getPersonaStyle(botB.presetIndex, botB.customStyle),
    };

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
      setTopic(trimmedTopic || 'AI Debate');
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
  }, [botA, botB, clearTimer, scheduleNext, setFeed, setLoading, setPlaying, setQueue, topicInput]);

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
  }, [appendToFeed, botA, botB, personaA, personaB, scheduleNext, setLoading, setPlaying, setQueue, topic]);

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
  }, [clearTimer, setFeed, setLoading, setPlaying, setQueue]);

  return {
    // setup
    topicInput,
    setTopicInput,
    botA,
    setBotA,
    botB,
    setBotB,
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
    reset,
  };
}
