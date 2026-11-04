/**
 * What every Drona surface shares: the answer shape and the honest fallback.
 *
 * Two disciplines govern this file.
 *
 * **The numbers are derived, the sentences are authored.** Scene-specific prose
 * lives beside the figures it quotes (`production.ts`, `exposure.ts`,
 * `lib/portfolio/attention.ts`); this file holds only what every scene shares.
 *
 * **State the limit.** Where Drona cannot answer, it says so plainly rather than
 * generating something plausible.
 */
export interface DronaAnswer {
  readonly id: string;
  /** The prompt as the reviewer sees it offered. */
  readonly prompt: string;
  /** Paragraphs. Kept short; a wall of text on a calm surface is a contradiction. */
  readonly paragraphs: readonly string[];
}

/**
 * The honest fallback. A scripted demo cannot answer free text, and pretending
 * otherwise — with a plausible-sounding generated paragraph — is exactly the
 * behaviour this product exists to argue against.
 */
export const FREE_TEXT_FALLBACK: readonly string[] = [
  `I can't answer that one here. This surface is running against a fixed, synthetic network, and I only hold worked answers for the questions offered above.`,
  `Ask me one of those, or open a commitment — the analysis gets considerably more specific once there is a bill of materials underneath it.`,
];
