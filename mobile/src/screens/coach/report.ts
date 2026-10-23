// Vibe Review report: plain text, HTML/PDF export, share and copy.
// Ported from AppViewModel.getExportFormattedReport / exportPdfReport / shareChatReport / copyReportToClipboard.
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { ChatReportData } from './types';

const RULE = '==========================================';
const REPORT_TITLE = 'ChatElevate - Vibe Review Report';

export function buildReportText(data: ChatReportData): string {
  const { scenario, persona, history, review } = data;
  const lines: string[] = [
    RULE,
    '  CHAT ELEVATE - CHAT & VIBE REVIEW REPORT',
    RULE,
    `Scenario: ${scenario}`,
    `Persona: ${persona}`,
    '',
    '--- CHAT TRANSCRIPT ---',
  ];

  if (history.length === 0) {
    lines.push('(No messages exchanged)');
  } else {
    history.forEach((msg) => lines.push(`[${msg.sender}]: ${msg.body}`));
  }

  lines.push('', '--- VIBE REVIEW ---', `Score: ${review.score} / 100`, `Overall Feedback: ${review.overall_feedback}`);

  if (review.comparisons.length > 0) {
    lines.push('', '--- LINE-BY-LINE COACHING REVIEW ---');
    review.comparisons.forEach((comp, i) => {
      lines.push(
        `${i + 1}. Original: "${comp.original_message}"`,
        `   Better Option: "${comp.improved_message}"`,
        `   Coach Note: ${comp.explanation}`,
        '',
      );
    });
  }

  lines.push(RULE);
  return lines.join('\n') + '\n';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br/>');
}

export function buildReportHtml(data: ChatReportData): string {
  const { scenario, persona, history, review } = data;
  const e = escapeHtml;

  const transcript =
    history.length === 0
      ? '<p class="muted">(No messages exchanged)</p>'
      : history
          .map((msg) => {
            const mine = msg.sender === 'Me';
            return `<div class="msg ${mine ? 'me' : 'partner'}"><span class="sender">${mine ? 'Me' : 'Partner'}:</span> ${e(msg.body)}</div>`;
          })
          .join('');

  const coaching =
    review.comparisons.length === 0
      ? ''
      : `<h2>Line-by-Line Coaching Review</h2>` +
        review.comparisons
          .map(
            (comp, i) => `
        <div class="card">
          <div class="item">Item ${i + 1}</div>
          <div class="label original">Original</div>
          <p>&ldquo;${e(comp.original_message)}&rdquo;</p>
          <div class="label improved">Improved</div>
          <p><strong>&ldquo;${e(comp.improved_message)}&rdquo;</strong></p>
          <div class="label why">Coach Note</div>
          <p class="muted">${e(comp.explanation)}</p>
        </div>`,
          )
          .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${REPORT_TITLE}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif; color: #111827; margin: 32px; font-size: 12px; line-height: 1.5; }
  h1 { font-size: 20px; margin: 0 0 6px; }
  h2 { font-size: 14px; color: #374151; margin: 22px 0 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; }
  .accent { height: 4px; border-radius: 2px; background: linear-gradient(90deg, #38BDF8, #9E7AFF); margin-bottom: 18px; }
  .muted { color: #6B7280; }
  .score { display: flex; align-items: center; gap: 16px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 14px; margin-top: 18px; }
  .ring { flex: 0 0 64px; height: 64px; border-radius: 32px; background: linear-gradient(135deg, #38BDF8, #9E7AFF); color: #fff; font-size: 22px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .msg { padding: 4px 0; }
  .sender { font-weight: 700; }
  .msg.me .sender { color: #0284C7; }
  .msg.partner .sender { color: #7C3AED; }
  .card { border: 1px solid #E5E7EB; border-radius: 10px; padding: 12px; margin-bottom: 10px; page-break-inside: avoid; }
  .card p { margin: 2px 0 8px; }
  .item { font-weight: 700; margin-bottom: 6px; }
  .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
  .original { color: #E11D48; }
  .improved { color: #059669; }
  .why { color: #0284C7; }
</style>
</head>
<body>
  <h1>${REPORT_TITLE}</h1>
  <div class="accent"></div>
  <h2>Scenario Vibe</h2>
  <p>${e(scenario)}</p>
  <p class="muted">Partner Persona: ${e(persona)}</p>
  <div class="score">
    <div class="ring">${e(String(review.score))}</div>
    <div>
      <div><strong>Engagement Vibe Score: ${e(String(review.score))} / 100</strong></div>
      <div>${e(review.overall_feedback)}</div>
    </div>
  </div>
  <h2>Chat History Transcript</h2>
  ${transcript}
  ${coaching}
</body>
</html>`;
}

// Renders the report to a PDF and opens the share sheet. Falls back to the
// system print dialog (which can also save as PDF) when sharing is unavailable.
export async function exportReportPdf(data: ChatReportData): Promise<void> {
  const html = buildReportHtml(data);
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Export PDF Report',
    });
  } else {
    await Print.printAsync({ uri });
  }
}

export async function shareReport(data: ChatReportData): Promise<void> {
  await Share.share({ title: REPORT_TITLE, message: buildReportText(data) }, { subject: REPORT_TITLE, dialogTitle: 'Share / Export Chat Report' });
}

export async function copyReport(data: ChatReportData): Promise<boolean> {
  return Clipboard.setStringAsync(buildReportText(data));
}
