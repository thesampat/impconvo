// Ported from android/app/.../ui/screens/MisinterpretScreen.kt (+ copy/toast and partner quote from src/static/misinterpret.html)
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '../api/client';
import type { MisinterpretResponse } from '../api/types';
import { spacing } from '../theme';
import PartnerQuote from './misinterpret/PartnerQuote';
import CopyToast from './openers/CopyToast';
import ResultCard from './openers/ResultCard';
import { GenerateButton, errorMessage, usePlaceholderTextColor, useScreenStyles } from './openers/shared';
import { useCopyToast } from './openers/useCopyToast';

export default function MisinterpretScreen() {
  const s = useScreenStyles();
  const placeholderTextColor = usePlaceholderTextColor();
  const insets = useSafeAreaInsets();
  const { toastVisible, copy } = useCopyToast();

  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [result, setResult] = useState<MisinterpretResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = input.trim().length > 0;

  async function generate() {
    if (!canGenerate || loading) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await api.getMisinterpret({ partner_text: input.trim() }));
    } catch (e) {
      setError(`Couldn't generate twists: ${errorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  const items = result?.misinterpretations ?? [];

  return (
    <KeyboardAvoidingView style={s.flex} behavior="padding">
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={s.title}>Misinterpret</Text>
        <Text style={s.subtitle}>
          Turn an ordinary text into a playful, teasing reply. Tap a result to copy it.
        </Text>

        <TextInput
          value={input}
          onChangeText={setInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="e.g. I had salad for dinner today or I'm going to the gym now"
          placeholderTextColor={placeholderTextColor}
          multiline
          style={[s.input, { minHeight: 76, maxHeight: 160 }, focused && s.inputFocused]}
        />

        <GenerateButton
          label="Generate replies"
          loading={loading}
          disabled={!canGenerate}
          onPress={generate}
        />
        {error ? <Text style={s.error}>{error}</Text> : null}

        {items.length > 0 ? (
          <>
            <Text style={s.sectionLabel}>Suggestions</Text>
            {result?.partner_text ? <PartnerQuote text={result.partner_text} /> : null}
            <View style={s.list}>
              {items.map((m, i) => (
                <ResultCard key={`${i}-${m.text}`} badge={m.style} text={m.text} explanation={m.explanation} onCopy={copy} />
              ))}
            </View>
          </>
        ) : (
          <View style={s.placeholderBox}>
            <Text style={s.placeholderText}>Results will appear here.</Text>
          </View>
        )}
      </ScrollView>
      <CopyToast visible={toastVisible} />
    </KeyboardAvoidingView>
  );
}
