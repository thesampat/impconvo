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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ConversationSetting, ConversationStarter } from '../api/types';
import { colors, radius, spacing, type } from '../theme';
import { BanterChatBubble, BanterTypingBubble, SystemErrorBubble } from './banter/BanterBubble';
import PersonaConfigCard from './banter/PersonaConfigCard';
import PlaybackControls from './banter/PlaybackControls';
import { BANTER_PRESETS } from './banter/presets';
import { useCoachTools } from './banter/useCoachTools';
import { type FeedItem, type MeMode, SYSTEM_ERROR_SPEAKER, useBanter } from './banter/useBanter';
import Composer from './coach/Composer';
import ResetDialog from './coach/ResetDialog';
import SuggestionsDialog from './coach/SuggestionsDialog';
import VibeReviewSheet from './coach/VibeReviewSheet';

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
  { id: 'online', label: 'Online (texting)' },
  { id: 'in_person', label: 'In person' },
];

const ME_MODE_OPTIONS: { id: MeMode; label: string }[] = [
  { id: 'ai', label: 'AI (watch)' },
  { id: 'typing', label: 'I type' },
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
          <Text style={styles.titleTag}>{banter.setupStep === 'scenario' ? 'Step 1 of 2' : 'Step 2 of 2'}</Text>
          <Text style={styles.title}>{banter.setupStep === 'scenario' ? 'Set the scene' : "Who's talking"}</Text>
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
              <ActivityIndicator size="small" color={colors.textSecondary} style={styles.ideaSpinner} />
              <Text style={styles.ideaText}>Generating…</Text>
            </>
          ) : (
            <Text style={styles.ideaText}>{hasTopic ? 'New idea' : 'Generate idea'}</Text>
          )}
        </Pressable>
      </View>

      <TextInput
        value={topicInput}
        onChangeText={banter.setTopicInput}
        placeholder="e.g. I approach a girl at a cafe, or a girl asks me for directions on the street"
        placeholderTextColor={colors.textMuted}
        multiline
        textAlignVertical="top"
        selectionColor={colors.accent}
        style={styles.topicInput}
      />
      <Text style={styles.hint}>
        Next, the AI suggests names, personalities, who starts and where they are talking. You can change all of it.
      </Text>

      <PrimaryButton
        label="Next"
        loadingLabel="Reading scenario…"
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
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryLabel}>Scenario</Text>
          <Text style={styles.summaryEdit}>Edit</Text>
        </View>
        <Text style={styles.summaryText} numberOfLines={3}>
          {banter.topicInput.trim()}
        </Text>
      </Pressable>
      {banter.analyzeError ? <Text style={styles.analyzeError}>{banter.analyzeError}</Text> : null}

      <Text style={[styles.sectionLabel, styles.settingLabel]}>Where are they talking?</Text>
      <Segmented options={SETTING_OPTIONS} value={banter.setting} onChange={banter.setSetting} />

      <Text style={[styles.sectionLabel, styles.settingLabel]}>Who speaks first?</Text>
      <Segmented options={starterOptions} value={banter.starter} onChange={banter.setStarter} />

      <Text style={[styles.sectionLabel, styles.settingLabel]}>Who plays you?</Text>
      <Segmented options={ME_MODE_OPTIONS} value={banter.meMode} onChange={banter.setMeMode} />

      <View style={styles.personSection}>
        <PersonaConfigCard label="Person A · you" accentColor={colors.accent} config={botA} onChange={banter.setBotA} />
      </View>
      <View style={styles.personSection}>
        <PersonaConfigCard
          label="Person B · the other person"
          accentColor={colors.textMuted}
          config={botB}
          onChange={banter.setBotB}
        />
      </View>

      <PrimaryButton
        label={banter.meMode === 'typing' ? 'Start chatting' : 'Start conversation'}
        loading={isLoading}
        onPress={banter.start}
      />
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

function PrimaryButton({
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
      style={({ pressed }) => [styles.startButton, inactive && styles.startButtonInactive, pressed && styles.pressed]}
    >
      {loading ? (
        <View style={styles.buttonLoadingRow}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
          {loadingLabel ? <Text style={[styles.startText, styles.buttonLoadingText]}>{loadingLabel}</Text> : null}
        </View>
      ) : (
        <Text style={[styles.startText, disabled && styles.startTextDisabled]}>{label}</Text>
      )}
    </Pressable>
  );
}

function ActiveSession({ banter }: { banter: Banter }) {
  const { isLoading, isPlaying, isTyping, typingSpeaker, messages, personaA, personaB } = banter;
  const isTypingMode = banter.meMode === 'typing';
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<FeedItem>>(null);
  const insets = useSafeAreaInsets();
  const coach = useCoachTools({
    scenario: banter.topic,
    setting: banter.setting,
    personaA,
    personaB,
    otherPersonality: BANTER_PRESETS[banter.botB.presetIndex]?.title ?? 'Custom',
    messages,
  });

  const send = () => {
    banter.sendMyMessage(draft);
    setDraft('');
  };

  const status = isLoading
    ? { text: 'Writing', color: colors.accent }
    : isPlaying
      ? { text: 'Live', color: colors.success }
      : { text: 'Paused', color: colors.textMuted };

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
      {!isTypingMode && isLoading && messages.length > 0 && (
        <View style={styles.loadingRow}>
          <View style={styles.loadingPill}>
            <ActivityIndicator size="small" color={colors.textMuted} style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>Writing the next few turns…</Text>
          </View>
        </View>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          {isTypingMode ? (
            <Pressable
              onPress={coach.openReview}
              accessibilityRole="button"
              accessibilityLabel="Vibe Review report"
              style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}
            >
              <Text style={styles.reportText}>Report</Text>
            </Pressable>
          ) : (
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={styles.statusText}>{status.text}</Text>
            </View>
          )}
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
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <Text style={styles.versusName}>{personaA}</Text>
            </View>
            <Text style={styles.vs}>vs</Text>
            <View style={styles.versusSide}>
              <Text style={styles.versusName}>{personaB}</Text>
              <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
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

      {isTypingMode ? (
        <Composer
          value={draft}
          onChangeText={setDraft}
          onSend={send}
          onSuggest={() => coach.openSuggestions(draft)}
          isLoading={isLoading}
          bottomInset={insets.bottom}
        />
      ) : (
        <PlaybackControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          queueSize={banter.queueSize}
          onTogglePlay={banter.togglePlayPause}
          onNext={banter.skipNext}
          onContinue={banter.continueBanter}
        />
      )}

      <SuggestionsDialog
        visible={coach.suggestionsVisible}
        loading={coach.suggestionsLoading}
        suggestions={coach.suggestions}
        error={coach.suggestionsError}
        onSelect={(text) => {
          setDraft(text);
          coach.closeSuggestions();
        }}
        onRegenerate={coach.regenerateSuggestions}
        onClose={coach.closeSuggestions}
      />
      <VibeReviewSheet
        visible={coach.reviewVisible}
        loading={coach.reviewLoading}
        error={coach.reviewError}
        report={coach.report}
        onClose={coach.closeReview}
      />

      <ResetDialog
        visible={showReset}
        title="Reset conversation?"
        message="Are you sure you want to exit and set up new people or a new scenario?"
        onCancel={() => setShowReset(false)}
        onConfirm={() => {
          setShowReset(false);
          banter.reset();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const hairline = StyleSheet.hairlineWidth;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },

  // Setup
  setupContent: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  titleRow: { marginBottom: spacing.md },
  title: { ...type.title },
  titleTag: { ...type.label, color: colors.accent, marginBottom: 2 },
  settingLabel: { marginTop: spacing.xs, marginBottom: spacing.xs },
  settingRow: {
    flexDirection: 'row',
    padding: 2,
    marginBottom: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceVariant,
  },
  settingChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: hairline,
    borderColor: 'transparent',
  },
  settingChipSelected: { backgroundColor: colors.surface, borderColor: colors.borderGlow },
  settingText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  settingTextSelected: { color: colors.text },
  topicHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  sectionLabel: { ...type.label },
  ideaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: hairline,
    borderColor: colors.borderGlow,
  },
  ideaSpinner: { transform: [{ scale: 0.6 }], marginRight: 2 },
  ideaText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  topicInput: {
    minHeight: 96,
    maxHeight: 180,
    borderRadius: radius.sm,
    borderWidth: hairline,
    borderColor: colors.borderGlow,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  personSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderTopWidth: hairline,
    borderColor: colors.divider,
  },
  startButton: {
    marginTop: spacing.lg,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  startButtonInactive: { backgroundColor: colors.surfaceVariant },
  startText: { color: colors.onPrimary, fontSize: 15, fontWeight: '500' },
  startTextDisabled: { color: colors.textMuted },
  buttonLoadingRow: { flexDirection: 'row', alignItems: 'center' },
  buttonLoadingText: { marginLeft: spacing.sm, color: colors.textSecondary },
  hint: { ...type.caption, color: colors.textMuted, marginTop: spacing.xs },
  scenarioSummary: {
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: hairline,
    borderColor: colors.divider,
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  summaryLabel: { ...type.label },
  summaryEdit: { color: colors.accent, fontSize: 13, fontWeight: '500' },
  summaryText: { ...type.body },
  analyzeError: { color: colors.error, fontSize: 13, marginBottom: spacing.sm },

  // Active session header
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: hairline,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  chevron: { width: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xs },
  chevronText: { color: colors.textMuted, fontSize: 12 },
  topicLine: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  topicPrefix: { color: colors.textMuted, fontWeight: '500' },
  statusPill: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.sm, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  reportButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 26,
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: hairline,
    borderColor: colors.borderGlow,
  },
  reportText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  resetButton: { marginLeft: spacing.xs, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  resetText: { color: colors.textMuted, fontSize: 16 },
  versus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: hairline,
    borderColor: colors.divider,
  },
  versusSide: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  versusName: { color: colors.text, fontSize: 13, fontWeight: '500' },
  vs: { color: colors.textMuted, fontSize: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },

  // Feed
  feed: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm },
  footer: { gap: spacing.sm },
  loadingRow: { flexDirection: 'row', justifyContent: 'center' },
  loadingPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  loadingSpinner: { transform: [{ scale: 0.6 }], marginRight: spacing.xs },
  loadingText: { color: colors.textMuted, fontSize: 12 },
});
