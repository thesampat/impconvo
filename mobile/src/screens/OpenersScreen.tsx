// Ported from android/app/.../ui/screens/OpenersScreen.kt (+ copy/toast from src/static/openers.html)
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '../api/client';
import type { OpenerItem } from '../api/types';
import { colors, radius, spacing } from '../theme';
import CopyToast from './openers/CopyToast';
import ResultCard from './openers/ResultCard';
import { GenerateButton, errorMessage, placeholderTextColor, screenStyles as s } from './openers/shared';
import { useCopyToast } from './openers/useCopyToast';

interface PickedImage {
  uri: string;
  base64: string;
}

export default function OpenersScreen() {
  const insets = useSafeAreaInsets();
  const { toastVisible, copy } = useCopyToast();

  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [openers, setOpeners] = useState<OpenerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = input.trim().length > 0 || image !== null;

  async function pickImage() {
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.6,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.base64) {
        setError('Could not read that image. Try another screenshot.');
        return;
      }
      setImage({ uri: asset.uri, base64: asset.base64 });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function generate() {
    if (!canGenerate || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOpeners({
        scenario_text: input.trim(),
        image_base64: image?.base64 ?? null,
      });
      setOpeners(res.openers);
    } catch (e) {
      setError(`Couldn't generate openers: ${errorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={s.title}>Openers</Text>
        <Text style={s.subtitle}>
          Describe a profile detail or add a screenshot. Tap a result to copy it.
        </Text>

        <TextInput
          value={input}
          onChangeText={setInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="e.g. holding a vintage camera on a park bench or bio says loves horror movies and hiking with rescue dogs"
          placeholderTextColor={placeholderTextColor}
          multiline
          style={[s.input, styles.input, focused && s.inputFocused]}
        />

        <View style={styles.attachRow}>
          <Pressable
            onPress={pickImage}
            accessibilityRole="button"
            style={({ pressed }) => [styles.attachButton, pressed && styles.pressed]}
          >
            <Text style={styles.attachText}>{image ? 'Change screenshot' : 'Add screenshot'}</Text>
          </Pressable>
          {image ? (
            <>
              <Image source={{ uri: image.uri }} style={styles.thumb} accessibilityLabel="Profile screenshot thumbnail" />
              <Pressable onPress={() => setImage(null)} hitSlop={8} accessibilityRole="button" style={styles.remove}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <GenerateButton
          label="Generate openers"
          loading={loading}
          disabled={!canGenerate}
          onPress={generate}
        />
        {error ? <Text style={s.error}>{error}</Text> : null}

        {openers.length > 0 ? (
          <>
            <Text style={s.sectionLabel}>Suggestions</Text>
            <View style={s.list}>
              {openers.map((o, i) => (
                <ResultCard key={`${i}-${o.text}`} badge={o.vibe} text={o.text} explanation={o.explanation} onCopy={copy} />
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

const styles = StyleSheet.create({
  input: { minHeight: 84, maxHeight: 180 },
  attachRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  attachButton: {
    height: 30,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderGlow,
    justifyContent: 'center',
  },
  attachText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  pressed: { opacity: 0.7 },
  thumb: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
  },
  remove: { marginLeft: spacing.sm, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  removeText: { color: colors.textMuted, fontSize: 13 },
});
