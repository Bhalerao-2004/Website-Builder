'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  LayoutDashboard,
  Plus,
  FolderOpen,
  Folder as FolderIcon,
  Trash2,
  LogOut,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from './Toast';
import type { FolderDTO } from '@/lib/types';
import { FOLDER_COLORS } from '@/lib/types';

interface User {
  name: string;
  email?: string;
  picture?: string;
}

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeFolder = params.get('folder');
  const { show } = useToast();

  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [unfiledCount, setUnfiledCount] = useState(0);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

  async function loadFolders() {
    try {
      const r = await fetch('/api/folders');
      if (!r.ok) return;
      const data = await r.json();
      setFolders(data.folders ?? []);
      setUnfiledCount(data.unfiledCount ?? 0);
    } catch {}
  }

  useEffect(() => {
    loadFolders();
    const i = setInterval(loadFolders, 30000);
    return () => clearInterval(i);
  }, [pathname]);

  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFolderName.trim(), color: newFolderColor }),
    });
    const data = await res.json();
    if (!res.ok) {
      show(data.error || 'Could not create folder', 'error');
      return;
    }
    setNewFolderName('');
    setShowFolderForm(false);
    await loadFolders();
    show('Folder created', 'success');
  }

  async function deleteFolder(id: string) {
    if (!confirm('Delete this folder? Scripts inside will move to Unfiled.')) return;
    const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      show('Could not delete folder', 'error');
      return;
    }
    await loadFolders();
    if (activeFolder === id) router.push('/dashboard');
    show('Folder deleted', 'success');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-ink-950/60 backdrop-blur md:flex md:flex-col">
        <div className="px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-base font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-500">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            ReelForge
          </Link>
        </div>

        <div className="px-3">
          <Link
            href="/new"
            className="btn-primary w-full"
          >
            <Plus className="h-4 w-4" /> New script
          </Link>
        </div>

        <nav className="mt-6 flex-1 overflow-y-auto px-3 pb-4">
          <NavItem
            href="/dashboard"
            active={pathname === '/dashboard' && !activeFolder}
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="All scripts"
          />
          <NavItem
            href="/dashboard?folder=unfiled"
            active={activeFolder === 'unfiled'}
            icon={<Inbox className="h-4 w-4" />}
            label="Unfiled"
            badge={unfiledCount > 0 ? String(unfiledCount) : undefined}
          />

          <div className="mt-6 flex items-center justify-between px-3 text-xs uppercase tracking-wider text-ink-400">
            <span>Folders</span>
            <button
              onClick={() => setShowFolderForm((s) => !s)}
              className="text-ink-300 hover:text-white"
              aria-label="New folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {showFolderForm && (
            <form onSubmit={createFolder} className="mt-2 space-y-2 rounded-lg bg-white/5 p-3">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                autoFocus
                className="input text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {FOLDER_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setNewFolderColor(c)}
                    className={cn(
                      'h-5 w-5 rounded-full border-2 transition',
                      newFolderColor === c ? 'border-white scale-110' : 'border-transparent',
                    )}
                    style={{ background: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 py-1.5 text-xs">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowFolderForm(false)}
                  className="btn-ghost py-1.5 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="mt-2 space-y-0.5">
            {folders.length === 0 && !showFolderForm && (
              <p className="px-3 py-2 text-xs text-ink-500">No folders yet</p>
            )}
            {folders.map((f) => (
              <FolderNavItem
                key={f.id}
                folder={f}
                active={activeFolder === f.id}
                onDelete={() => deleteFolder(f.id)}
              />
            ))}
          </div>
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            {user.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.picture} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/30 text-sm font-medium">
                {user.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              {user.email && <p className="truncate text-xs text-ink-400">{user.email}</p>}
            </div>
            <a href="/auth/logout" className="text-ink-400 hover:text-white" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </a>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <MobileTopBar user={user} />
        {children}
      </main>
    </div>
  );
}

function NavItem({
  href,
  active,
  icon,
  label,
  badge,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
        active
          ? 'bg-brand-500/15 text-white'
          : 'text-ink-300 hover:bg-white/5 hover:text-white',
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{badge}</span>
      )}
    </Link>
  );
}

function FolderNavItem({
  folder,
  active,
  onDelete,
}: {
  folder: FolderDTO;
  active: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
        active ? 'bg-brand-500/15 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white',
      )}
    >
      <Link href={`/dashboard?folder=${folder.id}`} className="flex flex-1 items-center gap-2.5 min-w-0">
        <FolderIcon className="h-4 w-4 shrink-0" style={{ color: folder.color }} />
        <span className="truncate">{folder.name}</span>
        {folder.scriptCount !== undefined && folder.scriptCount > 0 && (
          <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
            {folder.scriptCount}
          </span>
        )}
      </Link>
      <button
        onClick={onDelete}
        className="opacity-0 transition hover:text-red-400 group-hover:opacity-100"
        aria-label="Delete folder"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MobileTopBar({ user }: { user: User }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-500">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </span>
        ReelForge
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/new" className="btn-primary px-3 py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> New
        </Link>
        <a href="/auth/logout" className="btn-ghost px-2 py-1.5">
          <LogOut className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
