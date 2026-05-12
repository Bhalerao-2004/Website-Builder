import { Suspense } from 'react';
import { NewScriptClient } from './NewScriptClient';

export const dynamic = 'force-dynamic';

export default function NewScriptPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink-400">Loading…</div>}>
      <NewScriptClient />
    </Suspense>
  );
}
