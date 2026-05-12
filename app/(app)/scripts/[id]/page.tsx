import { notFound, redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { scriptsCollection, toObjectId } from '@/lib/repo';
import { toScriptDTO } from '@/lib/types';
import { ScriptEditor } from '@/components/ScriptEditor';

export const dynamic = 'force-dynamic';

export default async function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');
  const { id } = await params;
  const oid = toObjectId(id);
  if (!oid) notFound();
  const col = await scriptsCollection();
  const doc = await col.findOne({ _id: oid, userId: session.user.sub });
  if (!doc) notFound();
  return <ScriptEditor initial={toScriptDTO(doc)} />;
}
