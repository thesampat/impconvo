import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../../theme';

/** The partner line the twists are based on, shown above the results (as the web version does). */
export default function PartnerQuote({ text }: { text: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>
        <Text style={styles.label}>Partner: </Text>“{text}”
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentPink,
    backgroundColor: 'rgba(244,114,182,0.08)',
  },
  label: { color: colors.accentPink, fontWeight: '700' },
  text: { color: colors.text, fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
});
