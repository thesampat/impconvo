import { Text, View } from 'react-native';

import { makeStyles, spacing } from '../../theme';

/** The partner line the twists are based on, shown above the results (as the web version does). */
export default function PartnerQuote({ text }: { text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.box}>
      <Text style={styles.label}>Partner</Text>
      <Text style={styles.text}>“{text}”</Text>
    </View>
  );
}

const useStyles = makeStyles((c, t) => ({
  box: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
    paddingVertical: 2,
    borderLeftWidth: 2,
    borderLeftColor: c.borderGlow,
  },
  label: { ...t.label, fontSize: 12, marginBottom: 2 },
  text: { ...t.body, color: c.textSecondary },
}));
