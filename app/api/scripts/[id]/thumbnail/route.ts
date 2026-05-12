import { NextRequest } from 'next/server';
import { BadRequestError, NotFoundError, withAuth } from '../../../_helpers';
import { generateImage } from '@/lib/gemini';
import { thumbnailPrompt } from '@/lib/prompts';
import { scriptsCollection, toObjectId } from '@/lib/repo';
import { toScriptDTO } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const oid = toObjectId(id);
    if (!oid) throw new BadRequestError('Invalid id');
    const body = await req.json().catch(() => ({}));
    const customDirection =
      typeof body.direction === 'string' && body.direction.trim()
        ? body.direction.trim().slice(0, 500)
        : undefined;

    const col = await scriptsCollection();
    const src = await col.findOne({ _id: oid, userId });
    if (!src) throw new NotFoundError('Script not found');

    const prompt = thumbnailPrompt(
      {
        topic: src.topic,
        niche: src.niche,
        platform: src.platform,
        contentStyle: src.contentStyle,
      },
      src.title,
      src.hook,
      customDirection,
    );
    const img = await generateImage(prompt);

    const updated = await col.findOneAndUpdate(
      { _id: oid, userId },
      {
        $set: {
          thumbnail: {
            mimeType: img.mimeType,
            dataBase64: img.dataBase64,
            prompt,
            generatedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    );
    if (!updated) throw new NotFoundError('Script not found');
    return { script: toScriptDTO(updated) };
  });
}
