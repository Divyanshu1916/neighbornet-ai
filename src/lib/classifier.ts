import type { IssueCategory, IssueUrgency } from "./issues";

const CATEGORY_RULES: { category: IssueCategory; keywords: string[] }[] = [
  { category: "Garbage", keywords: ["garbage", "waste", "dustbin", "trash", "bin", "litter", "dump"] },
  { category: "Road Damage", keywords: ["pothole", "road", "broken road", "crack", "asphalt", "speed breaker", "footpath"] },
  { category: "Water Leakage", keywords: ["water", "leakage", "leak", "pipe", "sewage", "drain", "flood"] },
  { category: "Street Light", keywords: ["light", "streetlight", "street light", "dark", "lamp", "bulb"] },
  { category: "Public Safety", keywords: ["unsafe", "fight", "theft", "danger", "harass", "crime", "robbery", "assault"] },
];

const HIGH_URGENCY = ["danger", "accident", "emergency", "urgent", "fire", "injury", "blood", "unsafe", "theft"];
const MEDIUM_URGENCY = ["leakage", "leak", "road damage", "pothole", "garbage overflow", "overflow", "broken"];

export interface Suggestion {
  category: IssueCategory | null;
  urgency: IssueUrgency | null;
  matchedCategoryKeyword?: string;
  matchedUrgencyKeyword?: string;
}

export function classifyIssue(text: string): Suggestion {
  const t = text.toLowerCase();
  if (!t.trim()) return { category: null, urgency: null };

  let category: IssueCategory | null = null;
  let matchedCategoryKeyword: string | undefined;
  let bestScore = 0;
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (t.includes(kw)) {
        const score = kw.length; // longer keyword = stronger match
        if (score > bestScore) {
          bestScore = score;
          category = rule.category;
          matchedCategoryKeyword = kw;
        }
      }
    }
  }

  let urgency: IssueUrgency | null = null;
  let matchedUrgencyKeyword: string | undefined;
  const highHit = HIGH_URGENCY.find((k) => t.includes(k));
  if (highHit) {
    urgency = "High";
    matchedUrgencyKeyword = highHit;
  } else {
    const medHit = MEDIUM_URGENCY.find((k) => t.includes(k));
    if (medHit) {
      urgency = "Medium";
      matchedUrgencyKeyword = medHit;
    } else if (t.length > 0) {
      urgency = "Low";
    }
  }

  return { category, urgency, matchedCategoryKeyword, matchedUrgencyKeyword };
}
