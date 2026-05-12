import { NextRequest } from 'next/server';
import { BadRequestError, NotFoundError, withAuth } from '../../_helpers';
import { foldersCollection, scriptsCollection, toObjectId } from '@/lib/repo';
import { FOLDER_COLORS, toFolderDTO, type Folder } from '@/lib/types';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const oid = toObjectId(id);
    if (!oid) throw new BadRequestError('Invalid id');
    const body = await req.json();
    const update: Partial<Folder> = { updatedAt: new Date() };
    if (typeof body.name === 'string' && body.name.trim()) {
      if (body.name.length > 60) throw new BadRequestError('Name too long');
      update.name = body.name.trim();
    }
    if (typeof body.color === 'string' && FOLDER_COLORS.includes(body.color)) {
      update.color = body.color;
    }
    const col = await foldersCollection();
    const res = await col.findOneAndUpdate(
      { _id: oid, userId },
      { $set: update },
      { returnDocument: 'after' },
    );
    if (!res) throw new NotFoundError('Folder not found');
    return { folder: toFolderDTO(res) };
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const oid = toObjectId(id);
    if (!oid) throw new BadRequestError('Invalid id');
    const fcol = await foldersCollection();
    const res = await fcol.deleteOne({ _id: oid, userId });
    if (res.deletedCount === 0) throw new NotFoundError('Folder not found');
    const scol = await scriptsCollection();
    await scol.updateMany({ userId, folderId: id }, { $set: { folderId: null } });
    return { ok: true };
  });
}
