import { NextRequest } from 'next/server';
import { BadRequestError, NotFoundError, withAuth } from '../../_helpers';
import { scriptsCollection, toObjectId } from '@/lib/repo';
import { toScriptDTO, type Scene, type Script } from '@/lib/types';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const oid = toObjectId(id);
    if (!oid) throw new BadRequestError('Invalid id');
    const col = await scriptsCollection();
    const doc = await col.findOne({ _id: oid, userId });
    if (!doc) throw new NotFoundError('Script not found');
    return { script: toScriptDTO(doc) };
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const oid = toObjectId(id);
    if (!oid) throw new BadRequestError('Invalid id');
    const body = await req.json();
    const allowed = [
      'title',
      'hook',
      'script',
      'scenes',
      'cta',
      'hashtags',
      'caption',
      'folderId',
    ] as const;
    const update: Partial<Script> = { updatedAt: new Date() };
    for (const k of allowed) {
      if (k in body) {
        if (k === 'scenes') {
          if (!Array.isArray(body.scenes)) throw new BadRequestError('scenes must be array');
          update.scenes = body.scenes.map(
            (s: Scene, i: number): Scene => ({
              index: i + 1,
              visual: String(s.visual ?? ''),
              voiceover: String(s.voiceover ?? ''),
              durationSeconds: Number(s.durationSeconds) || 5,
              textOverlay: s.textOverlay ? String(s.textOverlay) : undefined,
            }),
          );
        } else if (k === 'hashtags') {
          if (!Array.isArray(body.hashtags)) throw new BadRequestError('hashtags must be array');
          update.hashtags = body.hashtags
            .map((x: unknown) => String(x).trim())
            .filter(Boolean) as string[];
        } else if (k === 'folderId') {
          (update as Record<string, unknown>).folderId =
            body.folderId === null || body.folderId === undefined ? null : String(body.folderId);
        } else {
          (update as Record<string, unknown>)[k] = String(body[k] ?? '');
        }
      }
    }
    const col = await scriptsCollection();
    const res = await col.findOneAndUpdate(
      { _id: oid, userId },
      { $set: update },
      { returnDocument: 'after' },
    );
    if (!res) throw new NotFoundError('Script not found');
    return { script: toScriptDTO(res) };
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const oid = toObjectId(id);
    if (!oid) throw new BadRequestError('Invalid id');
    const col = await scriptsCollection();
    const res = await col.deleteOne({ _id: oid, userId });
    if (res.deletedCount === 0) throw new NotFoundError('Script not found');
    return { ok: true };
  });
}
