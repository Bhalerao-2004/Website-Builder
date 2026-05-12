import { NextRequest } from 'next/server';
import { withAuth } from '../_helpers';
import { scriptsCollection } from '@/lib/repo';
import { toScriptDTO } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const url = new URL(req.url);
    const folderId = url.searchParams.get('folderId');
    const q = url.searchParams.get('q');

    const filter: Record<string, unknown> = { userId };
    if (folderId === 'unfiled') filter.folderId = null;
    else if (folderId) filter.folderId = folderId;
    if (q && q.trim()) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { topic: { $regex: q.trim(), $options: 'i' } },
        { niche: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const col = await scriptsCollection();
    const docs = await col.find(filter).sort({ updatedAt: -1 }).limit(200).toArray();
    return { scripts: docs.map(toScriptDTO) };
  });
}
