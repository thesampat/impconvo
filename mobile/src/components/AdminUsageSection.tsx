import { Platform, StyleSheet, Text, View } from 'react-native';

import type { AdminUsage } from '../state/SettingsContext';
import { colors, radius, spacing } from '../theme';

const MAX_ROWS = 5;

/** 1234567 -> "1,234,567" (manual so it doesn't depend on Intl support in the JS engine) */
export function formatCount(n: number): string {
  const sign = n < 0 ? '-' : '';
  const digits = String(Math.round(Math.abs(n)));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

type Entry = AdminUsage['devices'][number];

function TopList({ title, entries, shorten }: { title: string; entries: Entry[]; shorten?: boolean }) {
  const top = [...entries].sort((a, b) => b.tokens - a.tokens).slice(0, MAX_ROWS);
  if (top.length === 0) return null;
  return (
    <View style={styles.list}>
      <Text style={styles.listTitle}>{title}</Text>
      {top.map((e, i) => (
        <View key={e.id} style={[styles.row, i > 0 && styles.rowDivider]}>
          <Text style={styles.rowId} numberOfLines={1}>
            {shorten ? e.id.slice(0, 8) : e.id}
          </Text>
          <Text style={styles.rowMeta}>
            {formatCount(e.requests)} {e.requests === 1 ? 'request' : 'requests'}
          </Text>
          <Text style={styles.rowTokens}>{formatCount(e.tokens)}</Text>
        </View>
      ))}
    </View>
  );
}

function Meter({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  );
}

function formatPercent(value: number, max: number): string {
  if (max <= 0) return '0%';
  const pct = (value / max) * 100;
  if (pct > 0 && pct < 0.1) return `${pct.toFixed(2)}%`;
  return pct > 0 && pct < 1 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`;
}

/** Chunky usage bar; anything above zero always shows at least a sliver */
function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const shown = value > 0 ? Math.max(pct, 1.5) : 0;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${shown}%` }]} />
    </View>
  );
}

/** Grey placeholder rows while usage loads */
function UsageSkeleton() {
  return (
    <View>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.stat}>
          <View style={styles.statRow}>
            <View style={[styles.skeleton, { width: 72 }]} />
            <View style={[styles.skeleton, { width: 120 }]} />
          </View>
          <View style={[styles.barTrack, styles.skeletonBar]} />
        </View>
      ))}
    </View>
  );
}

/** Admin home: Google's daily limit, how much of it everyone used today, and how much the owner used */
export default function AdminUsageSection({ usage }: { usage: AdminUsage | null }) {
  if (!usage) {
    return <UsageSkeleton />;
  }
  const cap = usage.provider_daily_requests;
  // Rough tokens-per-request from everything recorded so far, to turn Google's request cap into tokens
  const avgTokens = usage.all_time_requests > 0 ? usage.all_time_tokens / usage.all_time_requests : 0;
  return (
    <View>
      <Text style={styles.period}>Today · {usage.usage_date} UTC</Text>

      <View style={styles.stat}>
        <View style={styles.statRow}>
          <View style={styles.statLabelCol}>
            <Text style={styles.statLabel}>Google daily limit</Text>
            <Text style={styles.statMeta}>{usage.model}</Text>
          </View>
          <View style={styles.statValues}>
            {cap ? (
              <>
                <Text style={styles.statValue}>
                  {formatCount(cap)}
                  <Text style={styles.statOf}> requests</Text>
                </Text>
                {avgTokens > 0 ? (
                  <Text style={styles.statMeta}>~{formatCount((cap * avgTokens) / 1_000_000)}M tokens</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.statMeta}>Not known for this model</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.stat}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Used today</Text>
          <View style={styles.statValues}>
            <Text style={styles.statValue}>
              {formatCount(usage.global_requests)}
              <Text style={styles.statOf}>{cap ? ` / ${formatCount(cap)}` : ''} requests</Text>
            </Text>
            <Text style={styles.statMeta}>
              {formatCount(usage.global_tokens)} tokens{cap ? ` · ${formatPercent(usage.global_requests, cap)} of limit` : ''}
            </Text>
          </View>
        </View>
        {cap ? <Bar value={usage.global_requests} max={cap} /> : null}
      </View>

      <View style={styles.stat}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>You today</Text>
          <View style={styles.statValues}>
            <Text style={styles.statValue}>
              {formatCount(usage.admin_requests)}
              <Text style={styles.statOf}>{cap ? ` / ${formatCount(cap)}` : ''} requests</Text>
            </Text>
            <Text style={styles.statMeta}>
              {formatCount(usage.admin_tokens)} tokens{cap ? ` · ${formatPercent(usage.admin_requests, cap)} of limit` : ''}
            </Text>
          </View>
        </View>
        {cap ? <Bar value={usage.admin_requests} max={cap} /> : null}
      </View>

      <Text style={styles.footnote}>
        Counts this app only. Google also counts other use of the same API key and resets at midnight Pacific time.
      </Text>
    </View>
  );
}

/** Limits view: Google's daily cap for the current model and who used the most today */
export function AdminTrafficSection({ usage }: { usage: AdminUsage | null }) {
  if (!usage) {
    return <Text style={styles.empty}>Loading usage...</Text>;
  }
  const cap = usage.provider_daily_requests;
  // Rough tokens-per-request from everything recorded so far, to turn Google's request cap into tokens
  const avgTokens = usage.all_time_requests > 0 ? usage.all_time_tokens / usage.all_time_requests : 0;
  return (
    <View>
      <View style={styles.stat}>
        <Text style={styles.blockTitle}>Google limit for {usage.model}</Text>
        {cap ? (
          <>
            <Text style={styles.blockValue}>
              {formatCount(usage.global_requests)} of {formatCount(cap)} requests today
            </Text>
            <Meter value={usage.global_requests} max={cap} />
            <Text style={styles.meta}>
              {avgTokens > 0 ? `About ${formatCount((cap * avgTokens) / 1_000_000)}M tokens/day at your average of ${formatCount(avgTokens)} per request. ` : ''}
              Google resets at midnight Pacific time and counts all use of your API key.
            </Text>
          </>
        ) : (
          <Text style={styles.meta}>Not known for this model. Check the rate limits page in Google AI Studio.</Text>
        )}
      </View>
      <TopList title="Top devices today" entries={usage.devices} shorten />
      <TopList title="Top networks today" entries={usage.ips} />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, fontSize: 13, paddingVertical: spacing.xs },
  // Same thin line as the vibe score in VibeReviewSheet
  progressTrack: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: 2, backgroundColor: colors.text },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  // Flat list: a small title then hairline-separated rows, no box
  list: { marginTop: spacing.md },
  listTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  rowId: {
    color: colors.text,
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    minWidth: 80,
  },
  rowMeta: { flex: 1, color: colors.textMuted, fontSize: 12 },
  stat: { paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  statRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  statLabel: { color: colors.text, fontSize: 15 },
  statLabelCol: { flexShrink: 1 },
  footnote: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: spacing.md },
  statValues: { alignItems: 'flex-end' },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '500', fontVariant: ['tabular-nums'] },
  statOf: { color: colors.textMuted, fontWeight: '400' },
  statMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceVariant, marginTop: spacing.sm, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  skeleton: { height: 14, borderRadius: radius.sm, backgroundColor: colors.surfaceVariant },
  skeletonBar: { opacity: 0.7 },
  period: { color: colors.textSecondary, fontSize: 13, fontWeight: '500', paddingBottom: spacing.sm },
  blockTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  blockValue: { color: colors.text, fontSize: 14, marginTop: 2 },
  rowTokens: { color: colors.text, fontSize: 13, fontWeight: '500', textAlign: 'right', minWidth: 72, fontVariant: ['tabular-nums'] },
});
