import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, type } from '../../theme';

/** The partner line the twists are based on, shown above the results (as the web version does). */
export default function PartnerQuote({ text }: { text: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>Partner</Text>
      <Text style={styles.text}>“{text}”</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
    paddingVertical: 2,
    borderLeftWidth: 2,
    borderLeftColor: colors.borderGlow,
  },
  label: { ...type.label, fontSize: 12, marginBottom: 2 },
  text: { ...type.body, color: colors.textSecondary },
});
