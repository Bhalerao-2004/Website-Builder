'use client';
// import { useState } from 'react';
import Link from 'next/link';
import { Copy, Trash2, MoreVertical, FolderInput, FileText, Image as ImageIcon } from 'lucide-react';
import type { FolderDTO, ScriptDTO } from '@/lib/types';
import { useToast } from './Toast';
import { fmtRelative } from '@/lib/utils';
// import React, { useState } from 'react';
import { useState, type ReactNode } from 'react';

export function ScriptCard({
  script,
  folder,
  onChanged,
}: {
  script: ScriptDTO;
  folder?: FolderDTO;
  onChanged: () => void;
}) {
  const { show } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [folders, setFolders] = useState<FolderDTO[]>([]);

  async function duplicate() {
    setMenuOpen(false);
    const r = await fetch(`/api/scripts/${script.id}/duplicate`, { method: 'POST' });
    if (!r.ok) {
      show('Could not duplicate', 'error');
      return;
    }
    show('Script duplicated', 'success');
    onChanged();
  }

  async function remove() {
    setMenuOpen(false);
    if (!confirm(`Delete "${script.title}"? This cannot be undone.`)) return;
    const r = await fetch(`/api/scripts/${script.id}`, { method: 'DELETE' });
    if (!r.ok) {
      show('Could not delete', 'error');
      return;
    }
    show('Script deleted', 'success');
    onChanged();
  }

  async function openMove() {
    setMenuOpen(false);
    const r = await fetch('/api/folders');
    const data = await r.json();
    setFolders(data.folders ?? []);
    setShowMove(true);
  }

  async function moveTo(folderId: string | null) {
    setShowMove(false);
    const r = await fetch(`/api/scripts/${script.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    if (!r.ok) {
      show('Could not move', 'error');
      return;
    }
    show('Moved', 'success');
    onChanged();
  }

  return (
    <div className="card card-hover group relative overflow-hidden">
      <Link href={`/scripts/${script.id}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-brand-500/20 via-purple-500/10 to-ink-900">
          {script.thumbnailDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={script.thumbnailDataUrl}
              alt={script.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-500">
              <div className="text-center">
                <ImageIcon className="mx-auto h-8 w-8 opacity-40" />
                <p className="mt-1 text-xs">No thumbnail yet</p>
              </div>
            </div>
          )}
          <div className="absolute left-2 top-2 flex items-center gap-1">
            <span className="chip text-[10px]">{platformLabel(script.platform)}</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 font-semibold leading-tight">{script.title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-ink-400">{script.niche} · {script.contentStyle}</p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-ink-500">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {script.scenes.length} scenes
            </span>
            <span>{fmtRelative(script.updatedAt)}</span>
          </div>
          {folder && (
            <span
              className="mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
              style={{ background: `${folder.color}22`, color: folder.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: folder.color }} />
              {folder.name}
            </span>
          )}
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen((s) => !s);
        }}
        className={`absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white transition hover:bg-black/80 ${
          menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        aria-label="More"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-2 top-10 z-30 w-44 overflow-hidden rounded-lg border border-white/10 bg-ink-900 shadow-2xl">
            <MenuButton onClick={duplicate} icon={<Copy className="h-4 w-4" />}>
              Duplicate
            </MenuButton>
            <MenuButton onClick={openMove} icon={<FolderInput className="h-4 w-4" />}>
              Move to folder
            </MenuButton>
            <MenuButton onClick={remove} icon={<Trash2 className="h-4 w-4" />} danger>
              Delete
            </MenuButton>
          </div>
        </>
      )}

      {showMove && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowMove(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">Move script</h3>
            <p className="mt-1 text-sm text-ink-400">Pick a destination folder.</p>
            <div className="mt-4 max-h-72 overflow-y-auto">
              <button
                onClick={() => moveTo(null)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
              >
                <span className="h-3 w-3 rounded-full bg-ink-500" />
                Unfiled
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => moveTo(f.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: f.color }} />
                  {f.name}
                </button>
              ))}
              {folders.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-ink-400">
                  No folders yet — create one from the sidebar.
                </p>
              )}
            </div>
            <button onClick={() => setShowMove(false)} className="btn-ghost mt-4 w-full">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MenuButton({
  onClick,
  icon,
  children,
  danger,
}: {
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
   <button
     onClick={onClick}
    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-white/5 ${
      danger ? 'text-red-300 hover:bg-red-500/10' : 'text-ink-200'
  }`}
    >
  {icon}
  {children}
</button>
  );
}

function platformLabel(p: ScriptDTO['platform']) {
  switch (p) {
    case 'instagram':
      return 'Reels';
    case 'tiktok':
      return 'TikTok';
    case 'youtube-shorts':
      return 'Shorts';
    case 'linkedin':
      return 'LinkedIn';
    case 'twitter':
      return 'X';
  }
}
