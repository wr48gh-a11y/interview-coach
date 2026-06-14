// Question categories, the coaching taxonomy, and every prompt the app sends.

import { gradingContext } from './hannah.js';

export const CATEGORIES = {
  behavioral: 'Behavioral',
  hypothetical: 'Hypothetical',
  googleyness: 'Googleyness & leadership',
  role: 'Role-related',
};

export const ROLE_FAMILIES = [
  'Program management',
  'Sales & account management',
  'Marketing',
  'Strategy & operations',
  'People operations',
  'General business',
];

// Fixed taxonomy so errors/strengths aggregate across sessions on the dashboard.
export const ERROR_TAGS = {
  'missing-result': 'Result/impact missing',
  'vague-metrics': 'Vague or missing metrics',
  'rambling': 'Ran long or rambled',
  'filler': 'Heavy filler words',
  'no-structure': 'Weak structure (STAR)',
  'jumped-to-action': 'Skipped the context',
  'weak-ownership': 'Unclear personal ownership',
  'off-question': "Didn't answer the question",
  'no-tradeoffs': 'No trade-off reasoning',
  'no-stakeholders': 'Ignored stakeholders',
  'too-short': 'Underdeveloped answer',
  'no-learning': 'No reflection or learning',
};

export const STRENGTH_TAGS = {
  'clear-structure': 'Clear structure',
  'strong-metrics': 'Concrete metrics',
  'ownership': 'Strong ownership language',
  'stakeholder-empathy': 'Stakeholder empathy',
  'concise': 'Concise and focused',
  'tradeoffs': 'Trade-off reasoning',
  'user-first': 'User-first thinking',
  'data-driven': 'Data-driven decisions',
  'leadership': 'Leadership signals',
  'prioritization': 'Sharp prioritization',
  'authentic': 'Authentic and specific',
  'learning': 'Reflective learning',
};

const JSON_RULES =
  'Respond with ONLY a single valid JSON object. No markdown fences, no commentary before or after. Inside string values, use single quotes for any quoted phrase — never raw double quotes — so the JSON always parses.';

function profileBlock(profile, roleFamily, level) {
  if (profile) {
    return `Target role: ${profile.title || 'unknown'} (${profile.team || 'Google'}), level ${profile.level || level}.
What the posting emphasizes: ${(profile.focusAreas || []).join('; ') || 'n/a'}.
Summary: ${profile.summary || 'n/a'}`;
  }
  return `Target role: a non-technical ${level} role at Google (${roleFamily || 'General business'}). No job posting was provided — keep questions broadly applicable to that role family.`;
}

export function jdPrompts(jd) {
  return {
    system: `You analyze Google job postings for an interview-coaching app. Extract a compact target-role profile. Google levels: L5 = senior individual contributor who leads large projects; L6 = leads through others and sets strategy across teams. Infer the most likely level from scope language in the posting; if genuinely unclear choose L6. ${JSON_RULES}
Shape: {"title": string, "team": string, "level": "L5"|"L6", "focusAreas": [3-5 short strings — the competencies this posting actually tests], "summary": one sentence}`,
    user: `Job posting:\n\n${jd.slice(0, 14000)}`,
  };
}

export function questionPrompts({ profile, roleFamily, level, category, pastQuestions }) {
  const avoid = (pastQuestions || []).slice(0, 12).map(q => `- ${q}`).join('\n');
  return {
    system: `You are a Google interviewer writing one interview question for a practice session. Write questions that sound like real Google interviews: specific, situational, one clear ask — never compound multi-part questions, never warm-up softballs. Calibrate difficulty to the candidate's level (${level}: ${level === 'L6' ? 'expect scope across teams, influencing executives, strategy' : 'expect large-project ownership, cross-functional influence'}). ${JSON_RULES}
Shape: {"question": string, "intent": one short sentence describing what a Google interviewer is testing with this question}`,
    user: `${profileBlock(profile, roleFamily, level)}

Category: ${CATEGORIES[category]} — ${categoryGuidance(category)}
${avoid ? `\nDo NOT repeat or closely resemble these already-asked questions:\n${avoid}` : ''}`,
  };
}

function categoryGuidance(category) {
  return {
    behavioral: 'a "Tell me about a time…" question probing real past experience.',
    hypothetical: 'a realistic "How would you handle…" scenario with tension or ambiguity.',
    googleyness: 'a question probing collaboration, comfort with ambiguity, intellectual humility, or doing right by users.',
    role: 'a question testing role-specific judgment and domain craft for this exact role.',
  }[category];
}

export function coachChatPrompts({ profile, roleFamily, level, question, category, transcript, score, subscores, errors, great, userMessage, isFirst }) {
  const errList = (errors || []).map(e => e.title).join('; ') || 'none identified';
  const greatList = (great || []).map(g => g.title).join('; ') || 'none identified';
  return {
    system: `You are a sharp, direct Google interview coach. The candidate just completed a practice answer and you've graded it. Now you're giving deeper coaching — not repeating the scores, but coaching the HOW of improvement.

${gradingContext()}

Question (${CATEGORIES[category]}): ${question}
Score: ${score}/10. Sub-scores — Structure: ${subscores?.structure ?? '?'}, Specificity: ${subscores?.specificity ?? '?'}, Relevance: ${subscores?.relevance ?? '?'}, Delivery: ${subscores?.delivery ?? '?'}.
Main errors: ${errList}.
Strengths: ${greatList}.

Transcript:
<<<
${(transcript || '').slice(0, 8000)}
>>>

Rules:
- 150–500 words. Dense insight, no filler phrases.
- Focus 70% on the weaknesses — be specific, quote exact moments from their transcript.
- 30% on what worked and how to build on it.
- Write in conversational paragraphs, no bullet lists, no headers.
- Do NOT repeat the numeric scores back to them.`,
    user: isFirst
      ? `Give me your most important coaching on what held my answer back and exactly how to fix it at the ${level} bar. Be specific and direct.`
      : (userMessage || ''),
  };
}

export function idealAnswerPrompts({ profile, roleFamily, level, question, category }) {
  return {
    system: `You are a Google interview coach writing a model spoken answer for a ${level} candidate. ${profileBlock(profile, roleFamily, level)}

Rules:
- 150–220 words, as if spoken aloud in an interview — no bullet points, continuous prose.
- For behavioral: tight STAR structure, end on a measurable result.
- For hypothetical: clear framework, one concrete decision with trade-off, end on outcome.
- Confident, first-person, specific.
${JSON_RULES}
Shape: {"answer": string}`,
    user: `Question (${CATEGORIES[category]}): ${question}\n\nWrite the ideal spoken answer.`,
  };
}

export function warmupPrompts({ level, question, category }) {
  return {
    system: `${gradingContext()}

You are her coach giving a FAST, calming warm-up read the morning of her interview — not a full grade. She just spoke one answer. Be encouraging and brief: she is loosening up, not being judged. Score against the ${level} bar but keep the tone light. ${JSON_RULES}
Shape: {"score": number 0-10 one decimal, "verdict": one short encouraging sentence (max 16 words), "tip": one tiny concrete thing to sharpen for the real thing (max 18 words)}`,
    user: `Question (${CATEGORIES[category] || 'Opener'}): ${question}\n\nGive the quick warm-up read.`,
  };
}

export function gradePrompts({ profile, roleFamily, level, materialsText, question, category, transcript, durationSec, wpm, fillers, targetStory }) {
  const materials = materialsText
    ? `\nThe candidate's own materials (resume/notes) — use them to judge whether they undersold real experience, and to make the rewrite draw on their strongest true stories:\n<<<\n${materialsText.slice(0, 12000)}\n>>>`
    : '';
  const drill = targetStory
    ? `\nSTORY DRILL: She is deliberately practicing deploying ONE specific story — "${targetStory.title}" (${targetStory.company}: ${targetStory.metric}). Judge whether she actually reached for THIS story and landed its metric. If she told a different story, that is not a failure of the answer, but note it. Add two fields to your JSON: "storyLanded": "yes" | "partial" | "no", and "storyNote": one short sentence on how well she deployed it and the metric.`
    : '';
  return {
    system: `${gradingContext()}${drill}

You are a rigorous, kind Google interview coach grading one spoken answer. You grade against the bar for ${level} (${level === 'L6' ? 'leads through others, multi-team scope' : 'senior IC, large-project ownership'}). Be honest — a 7 means "solid but not yet there", reserve 9+ for genuinely excellent. Scores must be earned by the sub-scores.

Sub-scores (0-10 integers):
- structure: did the answer have a clear arc (for behavioral: STAR — situation, task, action, result)?
- specificity: real names, numbers, and concrete detail vs vague generalities
- relevance: did it answer the exact question asked?
- delivery: pace, length vs the ~2 minute target, filler density (delivery stats provided)

Error tags — pick ONLY from: ${Object.keys(ERROR_TAGS).join(', ')}
Strength tags — pick ONLY from: ${Object.keys(STRENGTH_TAGS).join(', ')}

${JSON_RULES}
Shape: {
 "score": number 0-10 with one decimal,
 "verdict": short verdict calibrated to level, e.g. "Solid L5 — not yet L6" or "L6-ready answer",
 "subscores": {"structure": int, "specificity": int, "relevance": int, "delivery": int},
 "great": [exactly 3 of {"title": short, "detail": one sentence}],
 "errors": [exactly 3 of {"title": short, "detail": one actionable sentence, "tag": error tag}],
 "strengthTags": [up to 3 strength tags],
 "rewrite": a 150-220 word first-person rewrite of THEIR OWN answer as a 9/10 would sound — keep their true story, sharpen structure and specifics; if their materials contain a stronger relevant story, weave it in,
 "annotations": [2-4 of {"quote": EXACT substring copied verbatim from the transcript, "note": short margin note, "kind": "warn"|"good"}]
}`,
    user: `${profileBlock(profile, roleFamily, level)}${materials}

Question (${CATEGORIES[category]}): ${question}

Delivery stats: ${durationSec}s long (target ~120s), ${wpm} words/min, ${fillers} filler words detected.

Transcript of the spoken answer:
<<<
${transcript}
>>>`,
  };
}
