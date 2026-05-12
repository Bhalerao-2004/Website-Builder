import { NextRequest } from 'next/server';
import { BadRequestError, requireString, withAuth } from '../_helpers';
import { generateJSON } from '@/lib/gemini';
import {
  hashtagPrompt,
  hookPrompt,
  scriptPrompt,
  type HashtagOutput,
  type HookOutput,
  type ScriptOutput,
} from '@/lib/prompts';
import { scriptsCollection } from '@/lib/repo';
import { CONTENT_STYLES, PLATFORMS, toScriptDTO, type Script } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const body = await req.json();
    const topic = requireString(body.topic, 'topic', 300);
    const niche = requireString(body.niche, 'niche', 100);
    const platform = requireString(body.platform, 'platform', 40);
    const contentStyle = requireString(body.contentStyle, 'contentStyle', 40);
    const folderId = typeof body.folderId === 'string' ? body.folderId : null;

    if (!PLATFORMS.find((p) => p.value === platform)) {
      throw new BadRequestError('Invalid platform');
    }
    if (!CONTENT_STYLES.find((s) => s.value === contentStyle)) {
      throw new BadRequestError('Invalid content style');
    }

    const inputs = {
      topic,
      niche,
      platform: platform as Script['platform'],
      contentStyle: contentStyle as Script['contentStyle'],
    };

    // Step 1: hooks + title
    const h = hookPrompt(inputs);
    const hookOut = await generateJSON<HookOutput>(h.user, h.system);
    const title = hookOut.title?.trim() || `${topic} — ${niche}`;
    const hook = (hookOut.hooks?.[0] || '').trim();

    // Steps 2 & 3 run in parallel — script depends on title+hook, hashtags only on title
    const s = scriptPrompt(inputs, title, hook);
    const t = hashtagPrompt(inputs, title);
    const [scriptOut, tagOut] = await Promise.all([
      generateJSON<ScriptOutput>(s.user, s.system),
      generateJSON<HashtagOutput>(t.user, t.system),
    ]);

    const scenes = (scriptOut.scenes || []).map((sc, i) => ({
      index: i + 1,
      visual: sc.visual ?? '',
      voiceover: sc.voiceover ?? '',
      durationSeconds: Number(sc.durationSeconds) || 5,
      textOverlay: sc.textOverlay,
    }));

    const now = new Date();
    const doc: Script = {
      userId,
      folderId: folderId || null,
      topic,
      niche,
      platform: inputs.platform,
      contentStyle: inputs.contentStyle,
      title,
      hook: scriptOut.hook?.trim() || hook,
      script: scriptOut.script?.trim() || '',
      scenes,
      cta: scriptOut.cta?.trim() || '',
      hashtags: (tagOut.hashtags || []).map((x) => x.trim()).filter(Boolean),
      caption: tagOut.caption?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    const col = await scriptsCollection();
    const res = await col.insertOne(doc);
    doc._id = res.insertedId;
    return { script: toScriptDTO(doc), alternateHooks: hookOut.hooks ?? [] };
  });
}
