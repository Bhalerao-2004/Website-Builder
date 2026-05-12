import { ObjectId } from 'mongodb';

export type Platform = 'instagram' | 'tiktok' | 'youtube-shorts' | 'linkedin' | 'twitter';
export type ContentStyle =
  | 'storytelling'
  | 'tutorial'
  | 'listicle'
  | 'reaction'
  | 'comedy'
  | 'motivational'
  | 'product-review'
  | 'pov'
  | 'asmr'
  | 'vlog';

export interface Scene {
  index: number;
  visual: string;
  voiceover: string;
  durationSeconds: number;
  textOverlay?: string;
}

export interface Folder {
  _id?: ObjectId;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderDTO {
  id: string;
  name: string;
  color: string;
  scriptCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Script {
  _id?: ObjectId;
  userId: string;
  folderId?: string | null;
  topic: string;
  niche: string;
  platform: Platform;
  contentStyle: ContentStyle;
  title: string;
  hook: string;
  script: string;
  scenes: Scene[];
  cta: string;
  hashtags: string[];
  caption: string;
  thumbnail?: {
    mimeType: string;
    dataBase64: string;
    prompt: string;
    generatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ScriptDTO {
  id: string;
  folderId: string | null;
  topic: string;
  niche: string;
  platform: Platform;
  contentStyle: ContentStyle;
  title: string;
  hook: string;
  script: string;
  scenes: Scene[];
  cta: string;
  hashtags: string[];
  caption: string;
  thumbnailDataUrl?: string;
  thumbnailPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export function toScriptDTO(s: Script): ScriptDTO {
  return {
    id: s._id!.toString(),
    folderId: s.folderId ?? null,
    topic: s.topic,
    niche: s.niche,
    platform: s.platform,
    contentStyle: s.contentStyle,
    title: s.title,
    hook: s.hook,
    script: s.script,
    scenes: s.scenes,
    cta: s.cta,
    hashtags: s.hashtags,
    caption: s.caption,
    thumbnailDataUrl: s.thumbnail
      ? `data:${s.thumbnail.mimeType};base64,${s.thumbnail.dataBase64}`
      : undefined,
    thumbnailPrompt: s.thumbnail?.prompt,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function toFolderDTO(f: Folder, scriptCount?: number): FolderDTO {
  return {
    id: f._id!.toString(),
    name: f.name,
    color: f.color,
    scriptCount,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

export const PLATFORMS: { value: Platform; label: string; aspect: string }[] = [
  { value: 'instagram', label: 'Instagram Reels', aspect: '9:16' },
  { value: 'tiktok', label: 'TikTok', aspect: '9:16' },
  { value: 'youtube-shorts', label: 'YouTube Shorts', aspect: '9:16' },
  { value: 'linkedin', label: 'LinkedIn', aspect: '1:1' },
  { value: 'twitter', label: 'X / Twitter', aspect: '16:9' },
];

export const CONTENT_STYLES: { value: ContentStyle; label: string }[] = [
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'tutorial', label: 'Tutorial / How-to' },
  { value: 'listicle', label: 'Listicle' },
  { value: 'reaction', label: 'Reaction' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'motivational', label: 'Motivational' },
  { value: 'product-review', label: 'Product Review' },
  { value: 'pov', label: 'POV' },
  { value: 'asmr', label: 'ASMR' },
  { value: 'vlog', label: 'Vlog' },
];

export const FOLDER_COLORS = [
  '#d946ef',
  '#a855f7',
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
];
