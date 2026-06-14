// Hannah's war room — the single source of truth for this build.
// Profile, story bank, real question banks, "Your Edge" deck, and the 7-day
// plan, all drawn from her prep workbook and STAR case studies. Every screen
// and the grader read from here, so feedback knows her actual stories,
// metrics, and the traps she needs to avoid.

export const PROFILE = {
  name: 'Hannah Dron',
  role: 'Social Media Channel Manager, Gemini Marketing',
  level: 'L6',
  northStar:
    'I translate business goals into social-first campaigns people actually want to engage with, then build the operating system behind them so teams can ship fast without losing brand, trust, or measurement discipline.',
  // The frame she must hold the whole interview.
  mustProve: [
    'I own the calendar and the system, not just make posts.',
    'I generate earned conversation without chasing cheap virality.',
    'I move work across product, comms, legal, agencies and creative without slowing it down.',
    'I connect creative instinct to quantitative reasoning.',
    'Gemini marketing has a trust layer — AI content must be useful, accurate, clear, and responsible.',
  ],
  conversionTrap:
    "Don't over-index on \"I already do this as a contractor.\" That's evidence, not the argument. Better: \"My current role gives me context, but my broader value is turning fast-moving product and cultural signals into a repeatable social engine, with the judgment and measurement discipline Gemini needs.\"",
  geminiPOV: [
    'Gemini social should make AI feel useful, understandable, and worth trying — feature language becomes human use cases.',
    "It's a personal AI assistant, not just a chatbot. The social job is to show how Gemini helps people write, plan, learn, create, and make progress.",
    'AI marketing has a trust tax: every claim, demo, and creator brief needs extra discipline around accuracy, expectations, privacy, and safety.',
    'Earned conversation is not just volume. Quality matters: who is talking, what they say, whether they understand the product, and whether conversation changes behavior.',
  ],
};

// Google's four assessed attributes (re-mapped from the workbook).
export const ATTRIBUTES = {
  cognitive: { name: 'Cognitive ability', test: 'Break down messy problems, use data, weigh tradeoffs, explain your thinking.' },
  leadership: { name: 'Leadership', test: 'Mobilize others, especially without authority.' },
  role: { name: 'Role knowledge', test: 'Social, GTM, influencer, copy and positioning skill driving real impact.' },
  googleyness: { name: 'Googleyness', test: 'Comfort with ambiguity, humility with backbone, learning from others.' },
};

// STAR timing targets she's calibrating to (seconds).
export const STAR_TIMING = [
  { part: 'Situation', secs: '~10s', say: 'Where were you, what was happening, why it mattered.' },
  { part: 'Task', secs: '~10s', say: 'What you were accountable for and what made it hard.' },
  { part: 'Action', secs: '40–60s', say: 'Three crisp actions. Start each with a verb. Use "I", not "we".' },
  { part: 'Result', secs: '15–20s', say: 'Metrics, business impact, and what changed after.' },
  { part: 'Reflection', secs: '~10s', say: 'One sentence: what you learned or would do differently.' },
];

// ---- Story bank: her proof, mapped to Google attributes + question themes ----

export const STORIES = [
  {
    id: 'gemini-3', title: 'Gemini 3 integrated campaign', company: 'Google Gemini',
    metric: '29% of total owned engagements · 132.8K mentions in first 24h',
    attributes: ['role', 'leadership'], themes: ['biggest-win', 'influence', 'earned-conversation'],
    bestFor: 'Biggest win, launch GTM, cross-functional work, earned conversation at scale.',
    hook: 'I built the cross-functional GTM and it drove 29% of total owned engagements with 132.8K mentions in the first 24 hours.',
  },
  {
    id: 'gemini-ig', title: 'Gemini Instagram growth', company: 'Google Gemini',
    metric: 'Grew to 1M followers in under 12 months',
    attributes: ['role'], themes: ['biggest-win', 'systems', 'fast-growth'],
    bestFor: 'Ownership, scale, consistency, cross-functional approvals.',
    hook: 'I owned the editorial calendar and approvals and grew Gemini Instagram to 1M followers in under a year.',
  },
  {
    id: 'gemini-tiktok', title: 'Gemini TikTok acceleration', company: 'Google Gemini',
    metric: '550K new followers in 45 days',
    attributes: ['role', 'cognitive'], themes: ['fast-growth', 'data-creative'],
    bestFor: 'Platform expertise, speed, social SEO, data-informed creative.',
    hook: 'I used trending audio and social SEO to add 550K TikTok followers in 45 days.',
  },
  {
    id: 'gemini-gem', title: 'Gemini Custom Gem workflow', company: 'Google Gemini',
    metric: '70% reduction in drafting time · 3–4 hrs/week freed',
    attributes: ['role', 'cognitive'], themes: ['systems', 'ai-trust', 'initiative'],
    bestFor: 'Inventing systems, removing yourself as the bottleneck, building WITH Gemini.',
    hook: 'I built a custom Gem trained on brand voice and platform rules as a first-draft accelerator — not autopilot — and cut drafting time 70%.',
  },
  {
    id: 'gemini-review', title: 'Rapid review redesign', company: 'Google Gemini',
    metric: 'Approvals 2–4 days → 24 hours · 39.2M views on Heated Rivalry moment',
    attributes: ['leadership', 'role'], themes: ['systems', 'influence', 'speed'],
    bestFor: 'Influence without authority, moving fast without lowering the bar, process design.',
    hook: "I redesigned the approval workflow with pre-approved templates — didn't bypass review — and cut trend turnaround from 2–4 days to 24 hours.",
  },
  {
    id: 'picsart-swirl', title: 'Picsart Swirl tool trend', company: 'Picsart',
    metric: '6.6M downloads · $1.1M revenue in 21 days',
    attributes: ['cognitive', 'role'], themes: ['biggest-win', 'ambiguity', 'bias-for-action'],
    bestFor: 'Quick reversible decisions on incomplete data, customer-first judgment.',
    hook: 'On Christmas Eve, as the only social person online, I made a low-risk reversible call to surface the Swirl tool and made tutorials — 6.6M downloads and $1.1M in 21 days.',
  },
  {
    id: 'picsart-valentines', title: 'Mis-steak Valentine’s campaign', company: 'Picsart',
    metric: '25M impressions · 23K downloads · 500K+ engagements',
    attributes: ['cognitive', 'role'], themes: ['data-creative', 'ambiguity', 'fast-growth'],
    bestFor: 'Ambiguity, a 24-hour pivot grounded in live audience behavior.',
    hook: 'Given 24 hours to "go big" on AI Replace, I read live audience behavior (editing exes out of photos) and built the ex-to-clown concept — 25M impressions and real adoption.',
  },
  {
    id: 'picmonkey-roadtrip', title: 'PicMonkey Road Trip → Pro', company: 'PicMonkey',
    metric: '20% of free-tier attendees converted to Pro in 30 days',
    attributes: ['role', 'cognitive'], themes: ['data-creative', 'systems', 'failure'],
    bestFor: 'Proving social drives revenue, recovering when the obvious plan won’t hit the goal.',
    hook: 'When events alone wouldn’t hit the revenue goal, I found the friction blockers, partnered with product to fix them, and drove 20% free-to-Pro conversion.',
  },
  {
    id: 'birdy-pinterest', title: 'Birdy Grey Pinterest redesign', company: 'Birdy Grey',
    metric: '45% increase in click-through · 15% more product page visits',
    attributes: ['cognitive', 'role'], themes: ['data-creative', 'customer'],
    bestFor: 'Customer obsession, replacing internal assumptions with real behavior.',
    hook: 'I interviewed 20 customers, rebuilt the Pinterest strategy around how brides actually plan, and A/B-tested it — 45% CTR lift.',
  },
  {
    id: 'birdy-mens', title: 'Birdy Grey men’s reset', company: 'Birdy Grey',
    metric: '15% engagement lift · 10% follower growth',
    attributes: ['role'], themes: ['data-creative', 'culture-add'],
    bestFor: 'Relevance over volume, resetting a playbook for a different customer.',
    hook: 'I realized the men’s account was using the women’s playbook, made the case that relevance not awareness was the issue, and tested a culturally-native tone.',
  },
  {
    id: 'picsart-deck', title: 'Social impact deck', company: 'Picsart',
    metric: '18% sticker feature engagement · 22% uplift on pinned stickers',
    attributes: ['leadership', 'role'], themes: ['systems', 'influence'],
    bestFor: 'Systems thinking, turning social signal into product action.',
    hook: 'I built a monthly deck that turned community behavior into product recommendations — pinning trending stickers lifted feature engagement 18%.',
  },
  {
    id: 'picsart-mirror', title: 'Mirror sticker pivot', company: 'Picsart',
    metric: '12% MoM weighted-engagement increase',
    attributes: ['cognitive', 'role'], themes: ['data-creative', 'tradeoffs'],
    bestFor: 'Data sharpening creative, moving a team off vanity metrics.',
    hook: 'Impressions looked healthy but weighted engagement was declining — I recommended a low-risk A/B pivot off mirror stickers and lifted weighted engagement 12% MoM.',
  },
];

export const storyById = id => STORIES.find(s => s.id === id);

// ---- Real question banks (the proven ones from the workbook) ----

export const QUESTION_BANK = {
  behavioral: {
    cognitive: [
      'Describe a specific problem you solved for an employer or team. How did you approach it? What role did others play? What was the outcome?',
      'Tell me about a time you used data to make a creative or marketing decision. What did the data show? What changed?',
      'Tell me about a time you had several possible solutions and had to choose one. What tradeoffs did you weigh?',
      'Describe a time you had to diagnose why a campaign was underperforming. What did you look at first?',
    ],
    leadership: [
      'Tell me about a time you influenced a cross-functional team when you did not have authority.',
      'Tell me about a time you helped a team move faster without lowering quality.',
      'Tell me about a time you gave difficult creative feedback. How did you keep the relationship productive?',
      'Tell me about a time you took initiative outside your assigned responsibilities.',
    ],
    role: [
      'Walk me through how you would build a social GTM plan for a major Gemini feature launch.',
      'How do you decide what belongs on Instagram versus TikTok versus YouTube?',
      'How do you measure earned conversation? What metrics would you trust and what metrics would you question?',
      'What makes AI product marketing different from marketing a typical consumer app?',
    ],
    googleyness: [
      'Tell me about a time you had to operate in ambiguity.',
      'Tell me about a time you failed, missed a deadline, or got something wrong. What did you learn?',
      'Tell me about a time you changed your mind after hearing another perspective.',
      'How do you balance speed, quality, and stakeholder input?',
    ],
  },
  hypothetical: [
    'A new Gemini feature is technically impressive but users do not understand why they need it. How would you build the social plan?',
    'A competitor launches a viral AI assistant feature the week before Gemini has a major update. What do you recommend?',
    'A creator post goes live with an inaccurate AI claim. What do you do?',
    'Engagement drops 25% on TikTok but follower growth is still strong. What do you investigate?',
    'Legal rejects the strongest creative concept 24 hours before launch. How do you handle it?',
    'You need to build a GTM social source-of-truth for a Gemini launch with shifting product dates. What goes in it?',
    'A launch post gets high reach but the comments show confusion or distrust. What do you do next?',
    'How would you decide whether a Gemini moment deserves paid support, influencer support, both, or neither?',
    'You inherit a huge content calendar with too many stakeholder requests. How do you prioritize?',
    'How would you grow Gemini on YouTube without just reposting TikToks?',
  ],
  opener: [
    'Tell me about yourself.',
    'Why Google? Why Gemini? And why move from contractor to a full-time role?',
  ],
};

// Flattened list with metadata, for Practice and Full Mock.
export function allQuestions() {
  const out = [];
  for (const [attr, qs] of Object.entries(QUESTION_BANK.behavioral))
    qs.forEach(q => out.push({ q, category: 'behavioral', attribute: attr }));
  QUESTION_BANK.hypothetical.forEach(q => out.push({ q, category: 'hypothetical', attribute: 'role' }));
  QUESTION_BANK.opener.forEach(q => out.push({ q, category: 'opener', attribute: 'role' }));
  return out;
}

// A balanced ~6-question mock spanning all four attributes.
export function mockSlate() {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const b = QUESTION_BANK.behavioral;
  return [
    { q: QUESTION_BANK.opener[0], category: 'opener', attribute: 'role' },
    { q: pick(b.cognitive), category: 'behavioral', attribute: 'cognitive' },
    { q: pick(b.leadership), category: 'behavioral', attribute: 'leadership' },
    { q: pick(b.role), category: 'behavioral', attribute: 'role' },
    { q: pick(QUESTION_BANK.hypothetical), category: 'hypothetical', attribute: 'role' },
    { q: pick(b.googleyness), category: 'behavioral', attribute: 'googleyness' },
  ];
}

// Story Drill: given a story, pick a real question that story answers well, so
// she practices deploying a specific proof point under a question she didn't
// choose. Drawn from the behavioral bank by the story's mapped attributes.
export function questionForStory(storyId, avoid = []) {
  const story = storyById(storyId);
  if (!story) return null;
  const pool = [];
  for (const attr of story.attributes) {
    (QUESTION_BANK.behavioral[attr] || []).forEach(q =>
      pool.push({ q, category: 'behavioral', attribute: attr }));
  }
  if (!pool.length) return null;
  const fresh = pool.filter(x => !avoid.includes(x.q));
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(Math.random() * from.length)];
}

// ---- "Your Edge" deck — bite-sized priming cards, all from her real proof ----

export const EDGE_CARDS = [
  // ---- proof: a concrete win + how to frame it ----
  { type: 'proof', text: 'You grew Gemini Instagram to 1M followers in under 12 months. That is ownership at scale — do not frame it as "just my job".' },
  { type: 'proof', text: 'Gemini TikTok: 550K followers in 45 days with trending audio and social SEO. Speed plus platform instinct — a Google-caliber growth story.' },
  { type: 'proof', text: 'Your Christmas Eve Swirl-tool call drove $1.1M in 21 days. Quick, reversible, customer-tied. That is Bias for Action in one story.' },
  { type: 'proof', text: 'You built a custom Gem that cut drafting time 70%. You do not just use AI — you build operating systems with it. That is the Gemini story.' },
  { type: 'proof', text: 'Gemini 3: 29% of total owned engagements and 132.8K mentions in the first 24 hours. That is earned conversation at launch scale.' },
  { type: 'proof', text: 'You cut trend approvals from 2–4 days to 24 hours without lowering the bar. That is process design under real pressure.' },
  { type: 'proof', text: '24 hours to "go big" — you read live audience behavior and shipped the ex-to-clown concept for 25M impressions. Judgment, not luck.' },
  { type: 'proof', text: 'When events alone would not hit revenue, you drove 20% free-to-Pro in 30 days. You can tie social to the P&L.' },
  { type: 'proof', text: 'Birdy Grey: 20 customer interviews, then a 45% click-through lift. You replace internal assumptions with real behavior.' },
  { type: 'proof', text: 'The Picsart mirror-sticker call: you caught declining weighted engagement behind healthy impressions and lifted it 12% MoM.' },
  { type: 'proof', text: 'Your monthly social-signal deck lifted feature engagement 18%. You turn community behavior into product action.' },
  { type: 'proof', text: 'The Heated Rivalry moment hit 39.2M views because your system let you move at culture speed. The system is the story.' },
  { type: 'proof', text: 'Birdy Grey men’s reset: you bet on relevance over volume — 15% engagement lift and 10% follower growth. Right instinct, tested.' },
  { type: 'proof', text: 'Swirl drove 6.6M downloads from one reversible call when you were the only person online. Composure under ambiguity.' },
  { type: 'proof', text: '1M Instagram followers came from owning the editorial calendar AND the approvals — the operating system behind the growth.' },
  { type: 'proof', text: 'Across Picsart, PicMonkey, Birdy Grey and Gemini you have grown four very different brand voices. You adapt the system, not just the post.' },
  { type: 'proof', text: 'You have revenue proof — $1.1M from Swirl, 20% free-to-Pro at PicMonkey. Few social people tie work to dollars. Lead with it.' },
  { type: 'proof', text: 'The Gem is a first-draft accelerator, not autopilot. That single distinction is your whole AI-trust point — say it out loud.' },
  { type: 'proof', text: 'Picsart Valentine’s: 25M impressions, 23K downloads, 500K+ engagements from a 24-hour pivot. Fast and grounded in data.' },
  { type: 'proof', text: 'TikTok’s 550K in 45 days came from trending audio plus social SEO — name the mechanism, do not just quote the number.' },

  // ---- theme: need a story about X → reach for ----
  { type: 'theme', text: 'Need a "biggest win"? Gemini 3 integrated campaign — cross-functional GTM, 29% of owned engagements, 132.8K mentions in 24h.' },
  { type: 'theme', text: 'Asked about fast growth or platform instinct? Gemini TikTok — 550K in 45 days with trending audio and social SEO.' },
  { type: 'theme', text: 'Need "data changed my creative"? Picsart mirror stickers — you caught declining weighted engagement behind healthy impressions and pivoted.' },
  { type: 'theme', text: 'Need a systems story? The Gemini rapid-review redesign — approvals from 2–4 days to 24 hours, without lowering the bar.' },
  { type: 'theme', text: 'Need a recoverable failure? PicMonkey Road Trip — events alone would not hit revenue, so you built post-event conversion support.' },
  { type: 'theme', text: 'Need Bias for Action on incomplete data? Picsart Swirl — a reversible Christmas Eve call, $1.1M in 21 days.' },
  { type: 'theme', text: 'Need ambiguity or a fast pivot? Picsart Valentine’s — a 24-hour pivot grounded in live audience behavior.' },
  { type: 'theme', text: 'Need customer obsession? Birdy Grey Pinterest — 20 interviews, rebuilt around how brides actually plan, 45% CTR lift.' },
  { type: 'theme', text: 'Need influence without authority? Gemini rapid-review — you aligned product, creative and legal through one source of truth.' },
  { type: 'theme', text: 'Need building WITH AI? The custom Gem — a brand-voice-trained first-draft accelerator that saved 70% of drafting time.' },
  { type: 'theme', text: 'Need relevance over vanity metrics? Birdy Grey men’s reset — wrong playbook, fixed the tone, 15% engagement lift.' },
  { type: 'theme', text: 'Need signal-to-product? The Picsart social impact deck — pinning trending stickers lifted feature engagement 18%.' },
  { type: 'theme', text: 'Need earned conversation at scale? Gemini 3 — 132.8K organic mentions in the first 24 hours.' },
  { type: 'theme', text: 'Need ownership and consistency? Gemini Instagram — 1M followers in under a year, calendar and approvals owned.' },
  { type: 'theme', text: 'Need "social drives revenue"? PicMonkey 20% free-to-Pro, or Swirl’s $1.1M in 21 days.' },
  { type: 'theme', text: 'Need a hard-creative-feedback story? A Gemini agency briefing — you separated taste from the goal and kept the relationship.' },
  { type: 'theme', text: 'Need "diagnose underperformance"? Mirror stickers — you looked past impressions to weighted engagement first.' },
  { type: 'theme', text: 'Need cross-functional scope? Gemini 3 GTM moved product, comms, legal, creative and agencies without slowing.' },
  { type: 'theme', text: 'Need a culturally-native creative bet? Picsart Valentine’s ex-to-clown — you read the audience and made it shareable.' },
  { type: 'theme', text: 'Need speed without lowering quality? Rapid-review templates — faster trend turnaround, same brand bar.' },
  { type: 'theme', text: 'Need "took initiative"? The Gem — nobody asked you to build it; you did, then shared it with the team.' },
  { type: 'theme', text: 'Need a YouTube/platform-judgment answer? Frame native long and short form, not reposted TikToks.' },

  // ---- value: Google values X, your proof is Y ----
  { type: 'value', text: 'Google wants data that sharpens creative, not replaces it. Proof: the mirror-sticker pivot lifted weighted engagement 12% MoM.' },
  { type: 'value', text: 'Google loves earned conversation over cheap virality. Proof: Gemini 3 drove 132.8K organic mentions in 24 hours.' },
  { type: 'value', text: 'Google values moving cross-functional work without slowing it. Proof: your rapid-review template kept product, creative and review all fast.' },
  { type: 'value', text: 'AI marketing has a trust tax — claims, demos and creator briefs need accuracy and clarity. You get this. Make it your Gemini POV.' },
  { type: 'value', text: 'Google wants systems thinkers. Proof: the social impact deck turned community behavior into product decisions — 18% feature engagement lift.' },
  { type: 'value', text: 'Google rewards Bias for Action. Proof: the Swirl call — reversible, fast, $1.1M in 21 days.' },
  { type: 'value', text: 'Google prizes customer obsession. Proof: Birdy Grey — 20 interviews before any redesign, then a 45% CTR lift.' },
  { type: 'value', text: 'Google looks for ownership. Proof: you owned the Gemini Instagram calendar AND approvals on the way to 1M.' },
  { type: 'value', text: 'Googleyness is humility with backbone. You can challenge work without creating drama — that is the balance they test.' },
  { type: 'value', text: 'Google wants impact tied to the business. Proof: 20% free-to-Pro and $1.1M in revenue — social to dollars.' },
  { type: 'value', text: 'Google asks "would this change behavior?" not "did it go viral?". Frame earned conversation by quality, not just reach.' },
  { type: 'value', text: 'Google likes leaders who remove themselves as the bottleneck. Proof: the Gem freed 3–4 hours a week from drafting.' },
  { type: 'value', text: 'Google values learning from others. Cite the customer interviews and the team signals you actually acted on.' },
  { type: 'value', text: 'Google wants comfort with ambiguity. Proof: the 24-hour Valentine’s pivot built on live behavior.' },
  { type: 'value', text: 'Google rewards measurement discipline. You separate impressions from weighted engagement — show that instinct.' },
  { type: 'value', text: 'Google looks for scale judgment. You decide paid vs influencer vs organic by the moment, not by habit.' },
  { type: 'value', text: 'Responsible AI is a value, not a checkbox. Every claim and creator brief gets extra accuracy and expectation-setting.' },
  { type: 'value', text: 'Google wants people who connect creative instinct to quantitative reasoning. That bridge IS your north star.' },

  // ---- match: an exact question → the move ----
  { type: 'match', text: 'Influence without authority? → Gemini agency creative-briefing: clarify the decision criteria up front, align everyone through the SOT.' },
  { type: 'match', text: 'Operate in ambiguity? → Picsart Valentine’s 24-hour pivot, grounded in live audience behavior, kept lightweight and fast.' },
  { type: 'match', text: 'Used data to change your approach? → Birdy Grey Pinterest: 20 customer interviews, then a 45% CTR lift after redesign.' },
  { type: 'match', text: 'A failure or missed deadline? → A true, recoverable miss. Own your role, name the mechanism you built after, do not drag the team.' },
  { type: 'match', text: 'Balancing speed, quality and stakeholders? → Rapid-review redesign: faster AND on-brand, because the bottleneck was process, not creative.' },
  { type: 'match', text: '"Tell me about yourself." → North star first, then three proof beats: Gemini growth, a revenue story, the Gem.' },
  { type: 'match', text: '"Why Google, why Gemini, why full-time?" → Context from the contractor role, then the bigger value: a repeatable social engine.' },
  { type: 'match', text: '"Biggest accomplishment?" → Gemini 3: you built the GTM, 29% of owned engagements, 132.8K mentions in 24h.' },
  { type: 'match', text: '"Disagreed with a decision?" → Birdy Grey men’s: you argued relevance over awareness, tested it, and were right.' },
  { type: 'match', text: '"Gave hard creative feedback?" → Name the criteria, separate taste from goal, keep the relationship — the agency briefing.' },
  { type: 'match', text: '"How do you measure earned conversation?" → Who is talking, what they say, do they understand it, did behavior change.' },
  { type: 'match', text: '"Instagram vs TikTok vs YouTube?" → Platform intent: IG for owned polish, TikTok for trend speed, YT for depth — not reposts.' },
  { type: 'match', text: '"An inaccurate AI claim goes live?" → Pause, correct fast, tighten the brief. The trust tax is real — own it.' },
  { type: 'match', text: '"Engagement drops but followers grow?" → Look past the vanity metric: which segment, which format, weighted engagement.' },
  { type: 'match', text: '"Legal kills the concept 24h out?" → You have lived this — hold the bar, find the on-brand fast alternative, ship.' },
  { type: 'match', text: '"Build a GTM source-of-truth?" → Shifting dates, owners, the one message, approval paths — you have built exactly this.' },
  { type: 'match', text: '"Inherited an overloaded calendar?" → Prioritize by business goal and earned-conversation potential, not the loudest stakeholder.' },
  { type: 'match', text: '"Grow Gemini on YouTube?" → Native long and short form, not reposted TikToks — show platform-specific judgment.' },

  // ---- trap: discipline & delivery ----
  { type: 'trap', text: 'Contractor trap: do not lean on "I already do this". Pivot to "it gives me context — my value is building a repeatable social engine with judgment and measurement".' },
  { type: 'trap', text: 'Start with the point, not the backstory. One-sentence opener first ("I’ll use the Gemini 3 launch because…"), then the 90 seconds.' },
  { type: 'trap', text: 'Say "I" for your action, "we" for team outcomes. Name your specific ownership every time.' },
  { type: 'trap', text: 'On hypotheticals: ask one or two clarifying questions, then make a recommendation. Do not hide behind analysis.' },
  { type: 'trap', text: 'Googleyness = humility with a spine. You can challenge work without creating drama. Collaboration is not being passive.' },
  { type: 'trap', text: 'End every answer with what changed, what you would repeat, or what you would improve.' },
  { type: 'trap', text: 'Keep Situation to about ten seconds. You tend to over-set the scene — get to the action.' },
  { type: 'trap', text: 'One metric, said clearly, beats three rushed numbers. Pick the number that proves the point.' },
  { type: 'trap', text: 'Do not bury the result. The "after" is what they remember — land it, then stop.' },
  { type: 'trap', text: 'Action is 40–60 seconds, three crisp verbs. A list of everything reads as nothing.' },
  { type: 'trap', text: 'No perfect story? Use a true one and frame it well. Never invent a metric.' },
  { type: 'trap', text: 'Reflection in one sentence. "What I learned" signals L6 maturity — do not skip it, do not ramble it.' },
  { type: 'trap', text: 'Resist name-dropping every tool. Depth on one decision beats breadth across ten.' },
  { type: 'trap', text: 'When you pivot fast, say WHY out loud — the judgment is the point, not just the speed.' },
  { type: 'trap', text: 'For weakness questions, pick a real one with a real mechanism you built — not a humblebrag.' },
  { type: 'trap', text: 'Breathe before answering. A two-second pause reads as composure, not a gap.' },
  { type: 'trap', text: 'Tie every story back to the role: social engine, earned conversation, trust discipline, cross-functional speed.' },
  { type: 'trap', text: 'If they push back, do not fold and do not dig in — acknowledge, then hold your reasoning. That is backbone.' },
  { type: 'trap', text: 'Numbers need context: "29% of total owned engagements" lands harder than "29%". Give the denominator.' },
  { type: 'trap', text: 'You have done the work and have the proof. Walk in calm — you are not auditioning, you are showing them the system you built.' },
  { type: 'value', text: 'Google wants people who make AI feel useful, not hyped. Translate Gemini features into human use cases — write, plan, learn, create.' },
  { type: 'match', text: '"Decide paid, influencer, both, or neither?" → Weigh the moment’s goal and trust sensitivity, commit, then measure what changed.' },
];

export const EDGE_LABELS = {
  proof: "Don't forget",
  theme: 'Reach for',
  value: 'Google loves this',
  match: 'If they ask…',
  trap: 'Stay sharp',
};

// ---- 7-day plan ----

export const PLAN = [
  { day: 1, focus: 'Pick your 8 stories and map each to the four Google attributes.', output: 'One-page story map.' },
  { day: 2, focus: 'Write and speak your 4 highest-value STAR stories: biggest win, ambiguity, data decision, influence without authority.', output: '90-second versions, recorded.' },
  { day: 3, focus: 'Practice failure, conflict and missed-deadline stories.', output: 'One honest failure answer with a clear mechanism.' },
  { day: 4, focus: 'Drill hypotheticals: clarify, diagnose, options, recommend, measure.', output: 'Five 3-minute hypothetical answers.' },
  { day: 5, focus: 'Role knowledge: Gemini POV, metrics, earned conversation, AI trust.', output: 'One crisp POV answer per topic.' },
  { day: 6, focus: 'Full mock. Have it interrupt you.', output: 'Tighter answers, fewer tangents.' },
  { day: 7, focus: 'Final polish: tell me about yourself, why Google, why Gemini, why FTE, and questions to ask.', output: 'Calm, rehearsed, not robotic.' },
];

// ---- Grading context injected into the coach so feedback knows her arsenal ----

export function gradingContext() {
  const stories = STORIES.map(s => `- ${s.title} (${s.company}): ${s.metric}. Best for: ${s.bestFor}`).join('\n');
  return `You are coaching ONE specific candidate, ${PROFILE.name}, for a ${PROFILE.level} ${PROFILE.role} role at Google. Hold her to the L6 bar.

Her north star (she should open and close on this): "${PROFILE.northStar}"

What she must prove:
${PROFILE.mustProve.map(m => '- ' + m).join('\n')}

CONVERSION TRAP to flag if she falls into it: ${PROFILE.conversionTrap}

Her real story bank — reference these by name in feedback, and call out when she had a stronger story or a real metric available and didn't use it:
${stories}

STAR timing targets: Situation ~10s, Task ~10s, Action 40–60s, Result 15–20s, Reflection ~10s.

When you write the 9/10 rewrite, use HER real stories and metrics above — never invent fake metrics, stakeholders, or crises.`;
}
