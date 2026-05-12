import { NextRequest } from 'next/server';
import { BadRequestError, requireString, withAuth } from '../_helpers';
import { foldersCollection, scriptsCollection } from '@/lib/repo';
import { FOLDER_COLORS, toFolderDTO, type Folder } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
  return withAuth(async (userId) => {
    const fcol = await foldersCollection();
    const folders = await fcol.find({ userId }).sort({ name: 1 }).toArray();
    const scol = await scriptsCollection();
    const counts = await scol
      .aggregate<{ _id: string | null; count: number }>([
        { $match: { userId } },
        { $group: { _id: '$folderId', count: { $sum: 1 } } },
      ])
      .toArray();
    const countMap = new Map<string, number>();
    let unfiledCount = 0;
    for (const c of counts) {
      if (c._id) countMap.set(String(c._id), c.count);
      else unfiledCount = c.count;
    }
    return {
      folders: folders.map((f) => toFolderDTO(f, countMap.get(f._id!.toString()) ?? 0)),
      unfiledCount,
    };
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const body = await req.json();
    const name = requireString(body.name, 'name', 60);
    const color =
      typeof body.color === 'string' && FOLDER_COLORS.includes(body.color)
        ? body.color
        : FOLDER_COLORS[0];

    const col = await foldersCollection();
    const dup = await col.findOne({ userId, name });
    if (dup) throw new BadRequestError('A folder with that name already exists');

    const now = new Date();
    const doc: Folder = { userId, name, color, createdAt: now, updatedAt: now };
    const res = await col.insertOne(doc);
    return { folder: toFolderDTO({ ...doc, _id: res.insertedId }, 0) };
  });
}
