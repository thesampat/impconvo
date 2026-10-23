// Ported from android/app/.../ui/screens/BanterScreen.kt
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  type ListRenderItem,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { ConversationSetting, ConversationStarter } from '../api/types';
import { colors, gradients, radius } from '../theme';
import { BanterChatBubble, BanterTypingBubble, SystemErrorBubble } from './banter/BanterBubble';
import PersonaConfigCard from './banter/PersonaConfigCard';
import PlaybackControls from './banter/PlaybackControls';
import ResetDialog from './chat/ResetDialog';
import { withAlpha } from './banter/presets';
import { type FeedItem, SYSTEM_ERROR_SPEAKER, useBanter } from './banter/useBanter';

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export default function BanterScreen() {
  const banter = useBanter();

  return (
    <View style={styles.root}>
      {banter.isSessionActive ? <ActiveSession banter={banter} /> : <SetupView banter={banter} />}
    </View>
  );
}

type Banter = ReturnType<typeof useBanter>;

const SETTING_OPTIONS: { id: ConversationSetting; label: string }[] = [
  { id: 'online', label: '💬 Online (texting)' },
  { id: 'in_person', label: '🗣️ In person' },
];

function SetupView({ banter }: { banter: Banter }) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.setupContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>🎭 Watch & Learn</Text>
          <Text style={styles.titleTag}>• {banter.setupStep === 'scenario' ? 'Step 1 of 2' : 'Step 2 of 2'}</Text>
        </View>
        {banter.setupStep === 'scenario' ? <ScenarioStep banter={banter} /> : <DetailsStep banter={banter} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ScenarioStep({ banter }: { banter: Banter }) {
  const { topicInput, isGeneratingTopic, isAnalyzing } = banter;
  const hasTopic = topicInput.trim().length > 0;

  return (
    <>
      <View style={styles.topicHeader}>
        <Text style={styles.sectionLabel}>Scenario</Text>
        <Pressable
          onPress={banter.generateTopic}
          disabled={isGeneratingTopic || isAnalyzing}
          accessibilityRole="button"
          accessibilityLabel="Generate scenario"
          style={({ pressed }) => [styles.ideaButton, pressed && styles.pressed]}
        >
          {isGeneratingTopic ? (
            <>
              <ActivityIndicator size="small" color={colors.primary} style={styles.ideaSpinner} />
              <Text style={[styles.ideaText, styles.ideaTextSmall]}>Generating...</Text>
            </>
          ) : (
            <Text style={styles.ideaText}>{hasTopic ? '↻ New Idea' : '✨ Generate Idea'}</Text>
          )}
        </Pressable>
      </View>

      <TextInput
        value={topicInput}
        onChangeText={banter.setTopicInput}
        placeholder="e.g. I approach a girl at a cafe, or a girl asks me for directions on the street"
        placeholderTextColor={withAlpha(colors.textMuted, 0.6)}
        multiline
        textAlignVertical="top"
        selectionColor={colors.primary}
        style={styles.topicInput}
      />
      <Text style={styles.hint}>
        Next, the AI suggests names, who starts and where they are talking. You can change all of it.
      </Text>

      <GradientButton
        label="Next →"
        loadingLabel="Reading scenario..."
        loading={isAnalyzing}
        disabled={!hasTopic}
        onPress={banter.analyzeScenario}
      />
    </>
  );
}

function DetailsStep({ banter }: { banter: Banter }) {
  const { isLoading, botA, botB } = banter;
  const meName = botA.name.trim() || 'Me';
  const otherName = botB.name.trim() || 'Them';
  const starterOptions: { id: ConversationStarter; label: string }[] = [
    { id: 'me', label: `${meName} (me) → ${otherName}` },
    { id: 'other', label: `${otherName} → ${meName} (me)` },
  ];

  return (
    <>
      <Pressable onPress={banter.backToScenario} accessibilityRole="button" style={styles.scenarioSummary}>
        <Text style={styles.summaryLabel}>Scenario · tap to edit</Text>
        <Text style={styles.summaryText} numberOfLines={3}>
          {banter.topicInput.trim()}
        </Text>
      </Pressable>
      {banter.analyzeError ? <Text style={styles.analyzeError}>{banter.analyzeError}</Text> : null}

      <Text style={[styles.sectionLabel, styles.settingLabel]}>Where are they talking?</Text>
      <Segmented options={SETTING_OPTIONS} value={banter.setting} onChange={banter.setSetting} />

      <Text style={[styles.sectionLabel, styles.settingLabel]}>Who speaks first?</Text>
      <Segmented options={starterOptions} value={banter.starter} onChange={banter.setStarter} />

      <View style={styles.cardGapSmall}>
        <PersonaConfigCard label="Person A · you" accentColor={colors.accentPurple} config={botA} onChange={banter.setBotA} />
      </View>
      <View style={styles.cardGapSmall}>
        <PersonaConfigCard
          label="Person B · the other person"
          accentColor={colors.primary}
          config={botB}
          onChange={banter.setBotB}
        />
      </View>

      <GradientButton label="Start Conversation ▶" loading={isLoading} onPress={banter.start} />
    </>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <View style={styles.settingRow}>
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.settingChip, selected && styles.settingChipSelected]}
          >
            <Text style={[styles.settingText, selected && styles.settingTextSelected]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function GradientButton({
  label,
  loadingLabel,
  loading,
  disabled = false,
  onPress,
}: {
  label: string;
  loadingLabel?: string;
  loading: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const inactive = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={inactive ? [colors.surfaceVariant, colors.surfaceVariant] : gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.startGradient}
      >
        {loading ? (
          <View style={styles.buttonLoadingRow}>
            <ActivityIndicator color={colors.onPrimary} />
            {loadingLabel ? <Text style={[styles.startText, styles.buttonLoadingText]}>{loadingLabel}</Text> : null}
          </View>
        ) : (
          <Text style={[styles.startText, disabled && styles.startTextDisabled]}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function ActiveSession({ banter }: { banter: Banter }) {
  const { isLoading, isPlaying, isTyping, typingSpeaker, messages, personaA, personaB } = banter;
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<FlatList<FeedItem>>(null);

  const status = isLoading
    ? { text: 'Writing...', color: colors.accentAmber }
    : isPlaying
      ? { text: '● LIVE', color: colors.success }
      : { text: 'PAUSED', color: colors.textMuted };

  // A custom dialog rather than Alert.alert, which does nothing on web
  const [showReset, setShowReset] = useState(false);
  const confirmReset = () => setShowReset(true);

  const renderItem: ListRenderItem<FeedItem> = useCallback(
    ({ item }) =>
      item.speaker === SYSTEM_ERROR_SPEAKER ? (
        <SystemErrorBubble text={item.text} />
      ) : (
        <BanterChatBubble speaker={item.speaker} text={item.text} isMine={!sameName(item.speaker, personaB)} />
      ),
    [personaB],
  );

  const footer = (
    <>
      {isTyping && <BanterTypingBubble speaker={typingSpeaker} isMine={!sameName(typingSpeaker, personaB)} />}
      {isLoading && messages.length > 0 && (
        <View style={styles.loadingRow}>
          <View style={styles.loadingPill}>
            <ActivityIndicator size="small" color={colors.accentPurple} style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>Generating next banter turns...</Text>
          </View>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Toggle header"
          style={styles.headerRow}
        >
          <View style={styles.chevron}>
            <Text style={styles.chevronText}>{expanded ? '▴' : '▾'}</Text>
          </View>
          <Text style={styles.topicLine} numberOfLines={expanded ? 3 : 1}>
            <Text style={styles.topicPrefix}>Scenario: </Text>
            {banter.topic.trim() || 'Playful Banter'}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: withAlpha(status.color, 0.15) }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
          <Pressable
            onPress={confirmReset}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Reset simulation"
            style={styles.resetButton}
          >
            <Text style={styles.resetText}>↻</Text>
          </Pressable>
        </Pressable>

        {expanded && (
          <View style={styles.versus}>
            <View style={styles.versusSide}>
              <View style={[styles.dot, { backgroundColor: colors.accentPurple }]} />
              <Text style={[styles.versusName, { color: colors.primary }]}>{personaA}</Text>
            </View>
            <Text style={styles.vs}>vs</Text>
            <View style={styles.versusSide}>
              <Text style={[styles.versusName, { color: colors.accentPurple }]}>{personaB}</Text>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            </View>
          </View>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListFooterComponent={footer}
        ListFooterComponentStyle={styles.footer}
        contentContainerStyle={styles.feed}
        style={styles.flex}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <PlaybackControls
        isPlaying={isPlaying}
        isLoading={isLoading}
        queueSize={banter.queueSize}
        onTogglePlay={banter.togglePlayPause}
        onNext={banter.skipNext}
        onContinue={banter.continueBanter}
      />

      <ResetDialog
        visible={showReset}
        title="Reset Conversation?"
        message="Are you sure you want to exit and set up new people or a new scenario?"
        onCancel={() => setShowReset(false)}
        onConfirm={() => {
          setShowReset(false);
          banter.reset();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.75 },

  // Setup
  setupContent: { paddingHorizontal: 16, paddingVertical: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  titleTag: { color: colors.primary, fontSize: 11, fontWeight: '600', marginLeft: 8 },
  settingLabel: { marginBottom: 6 },
  settingRow: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  settingChip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.sm },
  settingChipSelected: {
    backgroundColor: withAlpha(colors.primary, 0.15),
    borderWidth: 1,
    borderColor: colors.primary,
  },
  settingText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  settingTextSelected: { color: colors.primary, fontWeight: '700' },
  topicHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sectionLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },
  ideaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
    backgroundColor: withAlpha(colors.primary, 0.15),
  },
  ideaSpinner: { transform: [{ scale: 0.6 }], marginRight: 2 },
  ideaText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  ideaTextSmall: { fontSize: 10 },
  topicInput: {
    minHeight: 90,
    maxHeight: 160,
    borderRadius: radius.md,
    backgroundColor: withAlpha(colors.surfaceVariant, 0.35),
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  cardGap: { marginTop: 14 },
  cardGapSmall: { marginTop: 10 },
  startButton: { marginTop: 18, height: 46, borderRadius: 14, overflow: 'hidden' },
  startGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  startText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  startTextDisabled: { color: colors.textMuted },
  buttonLoadingRow: { flexDirection: 'row', alignItems: 'center' },
  buttonLoadingText: { marginLeft: 8 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 8, lineHeight: 17 },
  scenarioSummary: {
    padding: 12,
    marginBottom: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  summaryLabel: { color: colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  summaryText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  analyzeError: { color: colors.error, fontSize: 12, marginBottom: 10 },

  // Active session header
  header: {
    backgroundColor: withAlpha(colors.surface, 0.92),
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: withAlpha(colors.primary, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chevronText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  topicLine: { flex: 1, color: colors.text, fontSize: 12 },
  topicPrefix: { color: colors.primary, fontWeight: '700' },
  statusPill: { marginLeft: 6, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  resetButton: { marginLeft: 6, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  resetText: { color: colors.textMuted, fontSize: 18 },
  versus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  versusSide: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  versusName: { fontSize: 11, fontWeight: '700' },
  vs: { color: colors.textMuted, fontSize: 11 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  // Feed
  feed: { paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  footer: { gap: 12 },
  loadingRow: { flexDirection: 'row', justifyContent: 'center' },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  loadingSpinner: { transform: [{ scale: 0.6 }], marginRight: 4 },
  loadingText: { color: colors.textMuted, fontSize: 11 },
});
