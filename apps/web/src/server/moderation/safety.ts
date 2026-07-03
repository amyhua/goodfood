/**
 * Automated safety pre-check (F13). The first moderation pass. Default implementation is a
 * deterministic keyword/regex heuristic (so it runs in CI with no external calls); a real
 * LLM checker is a drop-in that returns the same SafetyResult shape. Rules are configurable.
 * This is a FLAGGING aid — a human moderator still makes the final call.
 */
export interface SafetyRule {
  category: string;
  patterns: RegExp[];
}

export interface SafetyResult {
  flagged: boolean;
  categories: string[];
  /** Human-readable reasons, logged with the content post. */
  rationale: string[];
  /** 0..1 severity heuristic (categories × 0.4, capped). */
  score: number;
}

/** Default ruleset: medical over-claims, unsafe/disordered-eating cues, and spam. */
export const DEFAULT_RULES: SafetyRule[] = [
  {
    category: "medical-overclaim",
    patterns: [
      /\bcures?\b/i,
      /\bmiracle\b/i,
      /\bguarantee(d|s)?\b/i,
      /\breverse(s|d)?\s+(diabetes|disease|cancer)/i,
      /\btreats?\s+\w+\s+(cancer|diabetes|disease)/i,
      /\bdetox(es|ify|ifies)?\b/i,
    ],
  },
  {
    category: "unsafe",
    patterns: [
      /\bstarv(e|ation|ing)\b/i,
      /\bonly\s+\d{1,3}\s+calories\b/i,
      /\bfast(ing)?\s+for\s+\d+\s+days\b/i,
      /\bpurg(e|ing)\b/i,
    ],
  },
  {
    category: "spam",
    patterns: [/\bbuy now\b/i, /\bclick here\b/i, /\bfree money\b/i, /\b(discount|promo)\s+code\b/i],
  },
];

export function runSafetyCheck(text: string, rules: SafetyRule[] = DEFAULT_RULES): SafetyResult {
  const categories = new Set<string>();
  const rationale: string[] = [];
  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      const match = text.match(pattern);
      if (match) {
        categories.add(rule.category);
        rationale.push(`${rule.category}: matched "${match[0]}"`);
      }
    }
  }
  const cats = [...categories];
  return {
    flagged: cats.length > 0,
    categories: cats,
    rationale,
    score: Math.min(1, cats.length * 0.4),
  };
}

/**
 * The active checker. Today it's the heuristic; a hosted-LLM implementation can be selected
 * here (e.g. via a MODERATION_LLM env flag) as long as it returns a SafetyResult.
 */
export async function checkContentSafety(text: string): Promise<SafetyResult> {
  return runSafetyCheck(text);
}
