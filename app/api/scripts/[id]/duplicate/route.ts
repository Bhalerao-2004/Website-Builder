import { NextRequest } from 'next/server';
import { BadRequestError, NotFoundError, withAuth } from '../../../_helpers';
import { scriptsCollection, toObjectId } from '@/lib/repo';
import { toScriptDTO } from '@/lib/types';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const oid = toObjectId(id);
    if (!oid) throw new BadRequestError('Invalid id');
    const col = await scriptsCollection();
    const src = await col.findOne({ _id: oid, userId });
    if (!src) throw new NotFoundError('Script not found');

    const now = new Date();
    const { _id: _ignored, ...rest } = src;
    const copy = {
      ...rest,
      title: `${src.title} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    const res = await col.insertOne(copy);
    return { script: toScriptDTO({ ...copy, _id: res.insertedId }) };
  });
}
