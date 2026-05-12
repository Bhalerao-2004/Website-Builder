'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, FolderOpen, Inbox } from 'lucide-react';
import type { ScriptDTO, FolderDTO } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { ScriptCard } from '@/components/ScriptCard';

export function DashboardClient() {
  const params = useSearchParams();
  const folder = params.get('folder');
  const { show } = useToast();
  const [scripts, setScripts] = useState<ScriptDTO[] | null>(null);
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setScripts(null);
    const url = new URL('/api/scripts', window.location.origin);
    if (folder) url.searchParams.set('folderId', folder);
    if (q.trim()) url.searchParams.set('q', q.trim());
    try {
      const [s, f] = await Promise.all([
        fetch(url.toString()).then((r) => r.json()),
        fetch('/api/folders').then((r) => r.json()),
      ]);
      setScripts(s.scripts ?? []);
      setFolders(f.folders ?? []);
    } catch {
      show('Could not load scripts', 'error');
      setScripts([]);
    }
  }, [folder, q, show]);

  useEffect(() => {
    load();
  }, [load]);

  const activeFolder =
    folder === 'unfiled'
      ? { name: 'Unfiled', color: '#94a3b8' }
      : folder
        ? folders.find((f) => f.id === folder)
        : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            {activeFolder ? (
              <span className="flex items-center gap-2">
                {folder === 'unfiled' ? (
                  <Inbox className="h-6 w-6 text-ink-400" />
                ) : (
                  <FolderOpen className="h-6 w-6" style={{ color: activeFolder.color }} />
                )}
                {activeFolder.name}
              </span>
            ) : (
              'All scripts'
            )}
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {scripts === null
              ? 'Loading…'
              : scripts.length === 0
                ? 'Nothing here yet — generate your first script.'
                : `${scripts.length} ${scripts.length === 1 ? 'script' : 'scripts'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="input pl-9 w-56"
            />
          </div>
          <Link href="/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New script
          </Link>
        </div>
      </header>

      <div className="mt-8">
        {scripts === null ? (
          <SkeletonGrid />
        ) : scripts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {scripts.map((s) => (
              <ScriptCard
                key={s.id}
                script={s}
                folder={folders.find((f) => f.id === s.folderId)}
                onChanged={load}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="skeleton aspect-video w-full" />
          <div className="skeleton mt-3 h-4 w-3/4" />
          <div className="skeleton mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500">
        <Plus className="h-7 w-7 text-white" />
      </div>
      <h2 className="text-xl font-semibold">Generate your first script</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-300">
        Give us a topic, niche, and platform. We&apos;ll write the hook, script, scenes, hashtags,
        and a thumbnail — in seconds.
      </p>
      <Link href="/new" className="btn-primary mt-6">
        <Plus className="h-4 w-4" /> Create script
      </Link>
    </div>
  );
}
