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
import { colors, radius } from '../theme';
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
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={s.title}>🔑 Opener Generator</Text>
        <Text style={s.subtitle}>
          Describe a profile detail or upload a screenshot to get high-engagement openers. Tap a result to copy it.
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
            <Text style={styles.attachText}>🖼️ {image ? 'Change Screenshot' : 'Upload Screenshot'}</Text>
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
          label="Generate High-Vibe Openers ✨"
          loading={loading}
          disabled={!canGenerate}
          onPress={generate}
        />
        {error ? <Text style={s.error}>{error}</Text> : null}

        {openers.length > 0 ? (
          <>
            <Text style={s.sectionLabel}>Suggested Opening Lines:</Text>
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
  input: { minHeight: 100, maxHeight: 200 },
  attachRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  attachButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(56,189,248,0.15)',
    justifyContent: 'center',
  },
  attachText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  thumb: { width: 34, height: 34, borderRadius: radius.sm, marginLeft: 10, backgroundColor: colors.surfaceVariant },
  remove: { marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2 },
  removeText: { color: colors.error, fontSize: 12 },
});
