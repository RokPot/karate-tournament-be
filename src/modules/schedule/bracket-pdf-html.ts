import {
  BRACKET_LAYOUT,
  BRACKET_SCORE_LAYOUT,
  computeSingleEliminationLayout,
  getMatchWinnerItem,
  getSlotItem,
  type Bracket,
  type LayoutRect,
  type SingleEliminationLayoutOptions,
} from '~common/brackets/core';

import type { BracketCompetitor } from './bracket-from-games';

/** Usable area of an A4 landscape page with 10mm margins, in CSS px (96dpi). */
export const PDF_PAGE_WIDTH = 1047;
export const PDF_PAGE_HEIGHT = 718;
/** Slightly under the page height so rounding never spills onto an extra page. */
const SECTION_HEIGHT = PDF_PAGE_HEIGHT - 8;
const TITLE_HEIGHT = 44;

/** Handwritten score cells per match, plus one Sum cell. */
export const DEFAULT_SCORE_COUNT = 5;

/**
 * Print size at scale 1. Cards are tall enough for a name on two lines.
 * A sheet that is wider or taller than the page is drawn again with every
 * metric multiplied by the same factor, so nothing is clipped by a CSS scale.
 */
type PrintMetrics = {
  slotWidth: number;
  slotHeight: number;
  slotGap: number;
  roundGap: number;
  padding: number;
  roundTitleHeight: number;
  scoreCellWidth: number;
  scoreCellGap: number;
  sumCellWidth: number;
  scoreStripGap: number;
};

const PRINT: PrintMetrics = {
  slotWidth: BRACKET_LAYOUT.slotWidth,
  slotHeight: 52,
  slotGap: BRACKET_LAYOUT.slotGap,
  roundGap: BRACKET_LAYOUT.roundGap,
  padding: BRACKET_LAYOUT.padding,
  roundTitleHeight: BRACKET_LAYOUT.roundTitleHeight,
  scoreCellWidth: 64,
  scoreCellGap: BRACKET_SCORE_LAYOUT.scoreCellGap,
  sumCellWidth: 84,
  scoreStripGap: BRACKET_SCORE_LAYOUT.scoreStripGap,
};

const layoutOptions = (scoreCount: number, metrics: PrintMetrics): SingleEliminationLayoutOptions => ({
  scoreCount,
  layout: {
    slotWidth: metrics.slotWidth,
    slotHeight: metrics.slotHeight,
    slotGap: metrics.slotGap,
    roundGap: metrics.roundGap,
    padding: metrics.padding,
    roundTitleHeight: metrics.roundTitleHeight,
  },
  scoreCellWidth: metrics.scoreCellWidth,
  scoreCellGap: metrics.scoreCellGap,
  sumCellWidth: metrics.sumCellWidth,
  scoreStripGap: metrics.scoreStripGap,
});

/** 1 when the sheet fits. Smaller only when the drawing would otherwise leave the page. */
const fitScale = (width: number, height: number): number => {
  const availableWidth = PDF_PAGE_WIDTH - 2;
  const availableHeight = SECTION_HEIGHT - TITLE_HEIGHT - 2;
  return Math.min(1, availableWidth / width, availableHeight / height);
};

const scaledMetrics = (scale: number): PrintMetrics => {
  if (scale >= 1) {
    return PRINT;
  }
  const px = (value: number) => Math.max(1, Math.floor(value * scale));
  return {
    slotWidth: px(PRINT.slotWidth),
    slotHeight: px(PRINT.slotHeight),
    slotGap: px(PRINT.slotGap),
    roundGap: px(PRINT.roundGap),
    padding: px(PRINT.padding),
    roundTitleHeight: px(PRINT.roundTitleHeight),
    scoreCellWidth: px(PRINT.scoreCellWidth),
    scoreCellGap: px(PRINT.scoreCellGap),
    sumCellWidth: px(PRINT.sumCellWidth),
    scoreStripGap: px(PRINT.scoreStripGap),
  };
};

export type BracketPdfSection = {
  title: string;
  subtitle?: string;
  bracket: Bracket<BracketCompetitor>;
  /** Handwritten score cells per match. 0 (or unset) prints no score row. */
  scoreCount?: number;
};

export type BracketPdfOptions = {
  documentTitle?: string;
};

const COLORS = {
  card: '#F3E6C8',
  border: '#B8963E',
  line: '#9A7B32',
  text: '#1C1C1E',
  muted: '#6B6B6B',
  score: '#FDFCFB',
} as const;

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const box = (rect: LayoutRect, className: string, content = '', extraStyle = ''): string =>
  `<div class="${className}" style="left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;${extraStyle}">${content}</div>`;

const columnLabel = (columnIndex: number, roundCount: number): string => {
  // Column 0 lists the competitors; column n holds the results (and score row) of round n - 1.
  if (columnIndex === 0) {
    return 'Competitors';
  }
  const roundIndex = columnIndex - 1;
  const fromEnd = roundCount - 1 - roundIndex;
  if (fromEnd === 0) {
    return 'Final';
  }
  if (fromEnd === 1) {
    return 'Semifinal';
  }
  if (fromEnd === 2) {
    return 'Quarterfinal';
  }
  return `Round ${roundIndex + 1}`;
};

const renderCanvas = (
  bracket: Bracket<BracketCompetitor>,
  scoreCount: number,
  metrics: PrintMetrics,
  scale: number,
): { html: string; width: number; height: number } => {
  const layout = computeSingleEliminationLayout(bracket, layoutOptions(scoreCount, metrics));
  const roundCount = bracket.rounds.length;

  const matchById = new Map(
    bracket.rounds.flatMap((round) => round.matches).map((match) => [match.id, match] as const),
  );
  if (bracket.thirdPlace) {
    matchById.set(bracket.thirdPlace.id, bracket.thirdPlace);
  }

  const parts: string[] = [];

  parts.push(
    `<svg class="lines" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">` +
      layout.connectors.map((c) => `<path d="${c.d}" />`).join('') +
      '</svg>',
  );

  for (const header of layout.headers) {
    parts.push(box(header.rect, 'header', escapeHtml(columnLabel(header.columnIndex, roundCount))));
  }

  for (const node of layout.nodes) {
    if (!node.visible) {
      continue;
    }
    const match = matchById.get(node.matchId);
    let label = '';
    if (match) {
      const item =
        node.kind === 'slot-item'
          ? getSlotItem(match.item)
          : node.kind === 'slot-item2'
            ? getSlotItem(match.item2)
            : getMatchWinnerItem(match);
      label = item?.label ?? '';
    }
    const className = node.kind === 'outcome' ? 'card outcome' : 'card';
    parts.push(box(node.rect, className, `<span>${escapeHtml(label)}</span>`));
  }

  if (bracket.thirdPlace) {
    const bronzeSlot = layout.nodes.find((node) => node.id === `${bracket.thirdPlace?.id}-item`);
    if (bronzeSlot) {
      const captionHeight = Math.max(8, Math.round(14 * scale));
      parts.push(
        box(
          { ...bronzeSlot.rect, y: bronzeSlot.rect.y - captionHeight - 2, height: captionHeight },
          'caption',
          'Third place',
        ),
      );
    }
  }

  for (const cell of layout.scoreCells) {
    parts.push(box(cell.rect, cell.kind === 'sum' ? 'score sum' : 'score', cell.kind === 'sum' ? 'Sum' : ''));
  }

  return { html: parts.join(''), width: layout.width, height: layout.height };
};

const renderSection = (section: BracketPdfSection, isLast: boolean): string => {
  const scoreCount = section.scoreCount ?? 0;
  const natural = computeSingleEliminationLayout(section.bracket, layoutOptions(scoreCount, PRINT));
  const scale = fitScale(natural.width, natural.height);
  const canvas = renderCanvas(section.bracket, scoreCount, scaledMetrics(scale), scale);

  return `
<section class="page${isLast ? ' last' : ''}">
  <div class="title">
    <h1>${escapeHtml(section.title)}</h1>
    ${section.subtitle ? `<p>${escapeHtml(section.subtitle)}</p>` : ''}
  </div>
  <div class="canvas" style="width:${canvas.width}px;height:${canvas.height}px;--fit:${scale}">
    ${canvas.html}
  </div>
</section>`;
};

const STYLES = `
@page { size: A4 landscape; margin: 10mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: ${COLORS.text}; font-family: 'Roboto', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: ${PDF_PAGE_WIDTH}px; height: ${SECTION_HEIGHT}px; page-break-after: always; break-after: page; overflow: hidden; }
.page.last { page-break-after: auto; break-after: auto; }
.title { width: 100%; height: ${TITLE_HEIGHT}px; display: flex; align-items: baseline; gap: 12px; border-bottom: 2px solid ${COLORS.border}; margin-bottom: 0; }
.title h1 { margin: 0; font-size: 20px; font-weight: 700; }
.title p { margin: 0; font-size: 13px; color: ${COLORS.muted}; }
.canvas { position: relative; }
.canvas > * { position: absolute; }
.lines { left: 0; top: 0; }
.lines path { fill: none; stroke: ${COLORS.line}; stroke-width: 1.5; }
.header { display: flex; align-items: center; justify-content: center; font-size: calc(14px * var(--fit, 1)); font-weight: 600; color: ${COLORS.muted}; text-align: center; }
.caption { font-size: calc(11px * var(--fit, 1)); font-weight: 600; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.04em; }
.card { display: flex; align-items: center; padding: 0 calc(8px * var(--fit, 1)); background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 6px; font-size: calc(13px * var(--fit, 1)); line-height: calc(16px * var(--fit, 1)); }
.card span { display: -webkit-box; width: 100%; min-width: 0; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-height: calc(16px * var(--fit, 1)); white-space: normal; overflow-wrap: anywhere; }
.card.outcome { background: #fff; }
.score { border: 1px solid ${COLORS.border}; border-radius: 4px; background: ${COLORS.score}; }
.score.sum { display: flex; align-items: flex-start; padding: calc(3px * var(--fit, 1)) calc(6px * var(--fit, 1)); font-size: calc(11px * var(--fit, 1)); color: ${COLORS.muted}; }
`;

export const renderBracketsHtml = (sections: BracketPdfSection[], options: BracketPdfOptions = {}): string => {
  const body = sections.map((section, index) => renderSection(section, index === sections.length - 1)).join('\n');
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(options.documentTitle ?? 'Brackets')}</title>
<style>${STYLES}</style>
</head>
<body>
${body}
</body>
</html>`;
};
