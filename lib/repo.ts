import { Collection, ObjectId } from 'mongodb';
import { getDb } from './mongodb';
import type { Folder, Script } from './types';

export async function scriptsCollection(): Promise<Collection<Script>> {
  const db = await getDb();
  const col = db.collection<Script>('scripts');
  await col.createIndex({ userId: 1, updatedAt: -1 }).catch(() => {});
  await col.createIndex({ userId: 1, folderId: 1 }).catch(() => {});
  return col;
}

export async function foldersCollection(): Promise<Collection<Folder>> {
  const db = await getDb();
  const col = db.collection<Folder>('folders');
  await col.createIndex({ userId: 1, name: 1 }).catch(() => {});
  return col;
}

export function toObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}
