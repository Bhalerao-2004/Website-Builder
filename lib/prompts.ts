import type { ContentStyle, Platform } from './types';

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram Reels (9:16 vertical, 15–60s)',
  tiktok: 'TikTok (9:16 vertical, 15–60s)',
  'youtube-shorts': 'YouTube Shorts (9:16 vertical, up to 60s)',
  linkedin: 'LinkedIn (1:1 square, professional tone, 30–90s)',
  twitter: 'X / Twitter (16:9 landscape, 30–60s)',
};

const STYLE_LABEL: Record<ContentStyle, string> = {
  storytelling: 'narrative storytelling with a clear arc',
  tutorial: 'step-by-step tutorial / how-to',
  listicle: 'fast-paced listicle (e.g. "5 things…")',
  reaction: 'reaction-style commentary',
  comedy: 'comedic, punchline-driven',
  motivational: 'motivational, energetic',
  'product-review': 'honest product review',
  pov: 'first-person POV',
  asmr: 'calm, sensory ASMR',
  vlog: 'casual day-in-the-life vlog',
};

const SYSTEM_INSTRUCTION = `You are ReelForge, an expert short-form content strategist for top creators.
You understand viral patterns on TikTok, Reels, Shorts, LinkedIn, and X.
Your output is concrete, specific, and ready to film — never generic filler.
Always respond in the exact JSON shape requested. Never wrap output in markdown fences.`;

export interface GenerateInputs {
  topic: string;
  niche: string;
  platform: Platform;
  contentStyle: ContentStyle;
}

function ctx(inputs: GenerateInputs): string {
  return `TOPIC: ${inputs.topic}
NICHE: ${inputs.niche}
PLATFORM: ${PLATFORM_LABEL[inputs.platform]}
STYLE: ${STYLE_LABEL[inputs.contentStyle]}`;
}

// --- Step 1: Hooks ---
export interface HookOutput {
  title: string;
  hooks: string[];
}

export function hookPrompt(inputs: GenerateInputs) {
  return {
    system: SYSTEM_INSTRUCTION,
    user: `Brainstorm a scroll-stopping video for the following brief.

${ctx(inputs)}

Return JSON with this exact shape:
{
  "title": "A punchy, click-worthy video title under 70 characters",
  "hooks": ["hook 1", "hook 2", "hook 3"]
}

Hook rules:
- Each hook is the FIRST 3 seconds of dialogue / on-screen text.
- Must trigger curiosity, controversy, or a strong promise.
- Under 15 words each. No emojis. No clichés like "In today's video".
- Pick three distinct angles (question / bold claim / pattern-interrupt).`,
  };
}

// --- Step 2: Script + Scenes + CTA ---
export interface ScriptOutput {
  hook: string;
  script: string;
  scenes: Array<{
    visual: string;
    voiceover: string;
    durationSeconds: number;
    textOverlay?: string;
  }>;
  cta: string;
}

export function scriptPrompt(inputs: GenerateInputs, title: string, hook: string) {
  return {
    system: SYSTEM_INSTRUCTION,
    user: `Write the full short-form script for this video.

${ctx(inputs)}
TITLE: ${title}
CHOSEN HOOK: ${hook}

Return JSON with this exact shape:
{
  "hook": "the opening line as it will be said on camera (use the chosen hook, refined if needed)",
  "script": "the full verbatim voiceover / dialogue as one block of text, with line breaks between scenes",
  "scenes": [
    {
      "visual": "what is on screen — concrete shot description, framing, action",
      "voiceover": "the exact words said during this scene",
      "durationSeconds": 4,
      "textOverlay": "optional on-screen text caption, keep short"
    }
  ],
  "cta": "the closing call-to-action — what the viewer should do next"
}

Rules:
- 4 to 7 scenes total. Total runtime between 25 and 55 seconds.
- Every scene's voiceover must be the EXACT words spoken — no stage directions.
- Visuals must be filmable (real shots, not abstract concepts).
- The CTA must be specific to this topic, not "follow for more".
- No emojis in voiceover. Keep language natural and spoken, not written.`,
  };
}

// --- Step 3: Hashtags + Caption ---
export interface HashtagOutput {
  hashtags: string[];
  caption: string;
}

export function hashtagPrompt(inputs: GenerateInputs, title: string) {
  return {
    system: SYSTEM_INSTRUCTION,
    user: `Produce the social caption and hashtag set.

${ctx(inputs)}
TITLE: ${title}

Return JSON with this exact shape:
{
  "caption": "a 2-3 sentence caption written for the chosen platform, with a hook line and a soft CTA",
  "hashtags": ["#tag1", "#tag2", "..."]
}

Rules:
- Caption tone matches the platform (LinkedIn = professional, TikTok/Reels/Shorts = casual, X = punchy).
- 10 to 15 hashtags. Mix of: 2-3 broad (high volume), 4-6 mid-tier niche, 3-5 specific long-tail.
- Each hashtag starts with # and contains no spaces.
- No banned / spammy tags (#follow4follow, #l4l, etc.).`,
  };
}

// --- Step 4: Thumbnail prompt ---
export function thumbnailPrompt(
  inputs: GenerateInputs,
  title: string,
  hook: string,
  customDirection?: string,
): string {
  const aspect =
    inputs.platform === 'linkedin'
      ? 'square 1:1 composition'
      : inputs.platform === 'twitter'
        ? 'landscape 16:9 composition'
        : 'vertical 9:16 composition';

  return `Design a high-CTR thumbnail / poster for a short-form video.

Topic: ${inputs.topic}
Niche: ${inputs.niche}
Title: ${title}
Hook: ${hook}
${customDirection ? `Creator direction: ${customDirection}` : ''}

Visual brief:
- ${aspect}, designed to stop the scroll.
- One clear focal subject, expressive, high contrast.
- Bold, large title text (max 5–6 words) lifted from the title above. Text must be readable on a phone screen.
- Punchy color palette appropriate for the niche. Avoid muddy or low-contrast backgrounds.
- No watermarks, no logos, no platform UI, no fake "play" buttons.
- Cinematic lighting. Sharp focus on the subject.
- Style: modern, premium, editorial — not stock-photo or AI-generic.`;
}
