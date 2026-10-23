import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { PartnerPersona } from '../../api/types';
import { colors, gradients, radius } from '../../theme';
import { PARTNER_PERSONAS } from './types';

interface Props {
  scenarioInput: string;
  onChangeScenario: (text: string) => void;
  persona: PartnerPersona;
  onSelectPersona: (persona: PartnerPersona) => void;
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
  onInitiate: () => void;
}

const PLACEHOLDER =
  'Type context + opening line, e.g.:\n"Grabbed the wrong iced latte at coffee shop and laughed about it. \'Survived the accidental coffee swap or did I ruin your morning?\'"';

export default function SetupView({
  scenarioInput,
  onChangeScenario,
  persona,
  onSelectPersona,
  isGenerating,
  isLoading,
  error,
  onGenerate,
  onInitiate,
}: Props) {
  const hasInput = scenarioInput.trim().length > 0;
  const canInitiate = hasInput && !isLoading && !isGenerating;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>💬 AI Text Coach</Text>
      <Text style={styles.subtitle}>
        Practice texting scenarios with AI, get smart rewrites, and instant vibe coaching.
      </Text>

      <View style={styles.sectionRow}>
        <Text style={styles.label}>Scenario Setup</Text>
        <Pressable
          onPress={onGenerate}
          disabled={isGenerating || isLoading}
          style={({ pressed }) => [styles.ideaButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color={colors.primary} style={styles.ideaSpinner} />
              <Text style={styles.ideaText}>Generating...</Text>
            </>
          ) : (
            <Text style={styles.ideaText}>{hasInput ? '↻ New Idea' : '✨ Generate Idea'}</Text>
          )}
        </Pressable>
      </View>

      <TextInput
        value={scenarioInput}
        onChangeText={onChangeScenario}
        placeholder={PLACEHOLDER}
        placeholderTextColor="rgba(148,163,184,0.6)"
        multiline
        textAlignVertical="top"
        style={styles.scenarioInput}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={[styles.label, styles.personaLabel]}>Partner Persona</Text>
      <View style={styles.personaRow}>
        {PARTNER_PERSONAS.map((p) => {
          const selected = p.id === persona;
          return (
            <Pressable
              key={p.id}
              onPress={() => onSelectPersona(p.id)}
              style={[styles.personaOption, selected && styles.personaSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.personaText, selected && styles.personaTextSelected]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onInitiate}
        disabled={!canInitiate}
        style={({ pressed }) => [styles.initiateButton, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={hasInput ? gradients.primary : [colors.surfaceVariant, colors.surfaceVariant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.initiateFill}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.initiateText, !hasInput && styles.initiateTextDisabled]}>Initiate Scenario  →</Text>
          )}
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingVertical: 14 },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  label: { color: colors.text, fontSize: 13, fontWeight: '600' },
  ideaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(56,189,248,0.15)',
  },
  ideaSpinner: { transform: [{ scale: 0.6 }], marginRight: 2 },
  ideaText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  scenarioInput: {
    minHeight: 130,
    maxHeight: 240,
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(32,32,48,0.35)',
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  error: { color: colors.error, fontSize: 12, marginTop: 8 },
  personaLabel: { marginTop: 14, marginBottom: 6 },
  personaRow: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
    borderRadius: radius.md,
    backgroundColor: 'rgba(32,32,48,0.35)',
  },
  personaOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  personaSelected: { backgroundColor: 'rgba(56,189,248,0.22)', borderColor: colors.primary },
  personaText: { color: colors.textMuted, fontSize: 11 },
  personaTextSelected: { color: colors.primary, fontWeight: '700' },
  initiateButton: { marginTop: 18, height: 46, borderRadius: 14, overflow: 'hidden' },
  initiateFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  initiateText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  initiateTextDisabled: { color: colors.textMuted },
  pressed: { opacity: 0.8 },
});
