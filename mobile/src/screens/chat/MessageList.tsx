import { useCallback, useRef } from 'react';
import { FlatList, type ListRenderItem, StyleSheet, View } from 'react-native';

import type { MessageModel } from '../../api/types';
import MessageBubble, { TypingBubble } from './MessageBubble';

interface Props {
  messages: MessageModel[];
  isTyping: boolean;
  onDoubleTapMessage: (index: number) => void;
}

export default function MessageList({ messages, isTyping, onDoubleTapMessage }: Props) {
  const listRef = useRef<FlatList<MessageModel>>(null);

  const renderItem = useCallback<ListRenderItem<MessageModel>>(
    ({ item, index }) => <MessageBubble message={item} index={index} onDoubleTap={onDoubleTapMessage} />,
    [onDoubleTapMessage],
  );

  // Follow new messages / the typing bubble, but not in-place rewrites of old ones.
  const itemCount = messages.length + (isTyping ? 1 : 0);
  const scrolledCount = useRef(-1);
  const scrollToEnd = useCallback(() => listRef.current?.scrollToEnd({ animated: true }), []);
  const onContentSizeChange = useCallback(() => {
    if (scrolledCount.current === itemCount) return;
    scrolledCount.current = itemCount;
    scrollToEnd();
  }, [itemCount, scrollToEnd]);

  return (
    <FlatList
      ref={listRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={(_, index) => String(index)}
      style={styles.list}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={Separator}
      ListFooterComponent={isTyping ? TypingBubble : undefined}
      ListFooterComponentStyle={isTyping ? styles.footer : undefined}
      onContentSizeChange={onContentSizeChange}
      onLayout={scrollToEnd}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 14 },
  separator: { height: 12 },
  footer: { marginTop: 12 },
});
