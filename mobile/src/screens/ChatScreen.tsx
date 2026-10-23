// Ported from android/app/.../ui/screens/ChatScreen.kt
import { useCallback, useEffect, useRef, useState } from 'react';
import { type HostInstance, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';
import Composer from './chat/Composer';
import MessageList from './chat/MessageList';
import ResetDialog from './chat/ResetDialog';
import ScenarioBanner from './chat/ScenarioBanner';
import SetupView from './chat/SetupView';
import SuggestionsDialog from './chat/SuggestionsDialog';
import { useChat } from './chat/useChat';
import VibeReviewSheet from './chat/VibeReviewSheet';

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () =>
      setVisible(true),
    );
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

export default function ChatScreen() {
  const chat = useChat();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const [showResetDialog, setShowResetDialog] = useState(false);

  // KeyboardAvoidingView needs to know how far down the window this screen starts
  // (headers rendered by the app shell), so measure it instead of hard-coding.
  const rootRef = useRef<HostInstance>(null);
  const [topOffset, setTopOffset] = useState(0);
  const measureTop = useCallback(() => {
    rootRef.current?.measureInWindow((_x, y) => setTopOffset(y));
  }, []);

  const confirmReset = useCallback(() => {
    setShowResetDialog(false);
    chat.resetChat();
  }, [chat]);

  const inChat = chat.history.length > 0;

  return (
    <View ref={rootRef} style={styles.root} onLayout={measureTop}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={topOffset}
      >
        {inChat ? (
          <>
            <ScenarioBanner
              scenario={chat.scenario}
              persona={chat.persona}
              onSelectPersona={chat.setPersona}
              onCyclePersona={chat.cyclePersona}
              onReport={chat.requestVibeReview}
              onReset={() => setShowResetDialog(true)}
            />
            <MessageList
              messages={chat.history}
              isTyping={chat.isChatLoading}
              onDoubleTapMessage={chat.suggestForMessage}
            />
            <Composer
              value={chat.composerText}
              onChangeText={chat.setComposerText}
              onSend={chat.sendMessage}
              onSuggest={chat.suggestForComposer}
              isLoading={chat.isChatLoading}
              bottomInset={keyboardVisible ? 0 : insets.bottom}
            />
          </>
        ) : (
          <SetupView
            scenarioInput={chat.scenarioInput}
            onChangeScenario={chat.setScenarioInput}
            persona={chat.persona}
            onSelectPersona={chat.setPersona}
            isGenerating={chat.isGeneratingScenario}
            isLoading={chat.isChatLoading}
            error={chat.setupError}
            onGenerate={chat.generateScenario}
            onInitiate={chat.initiateChat}
          />
        )}
      </KeyboardAvoidingView>

      <ResetDialog visible={showResetDialog} onConfirm={confirmReset} onCancel={() => setShowResetDialog(false)} />

      <SuggestionsDialog
        visible={chat.suggestions.visible}
        loading={chat.suggestions.loading}
        suggestions={chat.suggestions.list}
        error={chat.suggestions.error}
        onSelect={chat.selectSuggestion}
        onRegenerate={chat.regenerateSuggestions}
        onClose={chat.closeSuggestions}
      />

      <VibeReviewSheet
        visible={chat.vibe.visible}
        loading={chat.vibe.loading}
        error={chat.vibe.error}
        report={chat.vibe.report}
        onClose={chat.closeVibe}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
});
