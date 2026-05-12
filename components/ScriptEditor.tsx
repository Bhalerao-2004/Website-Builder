'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Trash2,
  Image as ImageIcon,
  Wand2,
  Download,
  Hash,
  FolderInput,
  Check,
  Save,
  Plus,
} from 'lucide-react';
import type { FolderDTO, Scene, ScriptDTO } from '@/lib/types';
import { CONTENT_STYLES, PLATFORMS } from '@/lib/types';
import { useToast } from './Toast';
import { cn, fmtRelative } from '@/lib/utils';

export function ScriptEditor({ initial }: { initial: ScriptDTO }) {
  const router = useRouter();
  const params = useSearchParams();
  const isNew = params.get('new') === '1';
  const { show } = useToast();
  const [s, setS] = useState<ScriptDTO>(initial);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [showMove, setShowMove] = useState(false);
  const [genThumb, setGenThumb] = useState(false);
  const [thumbDirection, setThumbDirection] = useState('');
  const dirtyRef = useRef(false);
  const sRef = useRef(s);
  sRef.current = s;
  dirtyRef.current = dirty;

  useEffect(() => {
    fetch('/api/folders').then((r) => r.json()).then((d) => setFolders(d.folders ?? [])).catch(() => {});
  }, []);

  function patchLocal<K extends keyof ScriptDTO>(key: K, value: ScriptDTO[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/scripts/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: s.title,
          hook: s.hook,
          script: s.script,
          scenes: s.scenes,
          cta: s.cta,
          hashtags: s.hashtags,
          caption: s.caption,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setS(data.script);
      setDirty(false);
      show('Saved', 'success');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  // Auto-save on blur via debounce
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      save();
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, dirty]);

  async function duplicate() {
    const r = await fetch(`/api/scripts/${s.id}/duplicate`, { method: 'POST' });
    const data = await r.json();
    if (!r.ok) {
      show('Could not duplicate', 'error');
      return;
    }
    show('Duplicated', 'success');
    router.push(`/scripts/${data.script.id}`);
  }

  async function remove() {
    if (!confirm(`Delete "${s.title}"? This cannot be undone.`)) return;
    const r = await fetch(`/api/scripts/${s.id}`, { method: 'DELETE' });
    if (!r.ok) {
      show('Could not delete', 'error');
      return;
    }
    show('Deleted', 'success');
    router.push('/dashboard');
  }

  async function moveTo(folderId: string | null) {
    setShowMove(false);
    const r = await fetch(`/api/scripts/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    const data = await r.json();
    if (!r.ok) {
      show('Could not move', 'error');
      return;
    }
    setS(data.script);
    show('Moved', 'success');
  }

  async function generateThumbnail() {
    if (genThumb) return;
    setGenThumb(true);
    try {
      const r = await fetch(`/api/scripts/${s.id}/thumbnail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: thumbDirection || undefined }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Thumbnail generation failed');
      setS(data.script);
      show('Thumbnail ready', 'success');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Thumbnail failed', 'error');
    } finally {
      setGenThumb(false);
    }
  }

  function updateScene(i: number, patch: Partial<Scene>) {
    const next = s.scenes.map((sc, idx) => (idx === i ? { ...sc, ...patch } : sc));
    patchLocal('scenes', next);
  }
  function removeScene(i: number) {
    patchLocal(
      'scenes',
      s.scenes.filter((_, idx) => idx !== i).map((sc, idx) => ({ ...sc, index: idx + 1 })),
    );
  }
  function addScene() {
    patchLocal('scenes', [
      ...s.scenes,
      { index: s.scenes.length + 1, visual: '', voiceover: '', durationSeconds: 5 },
    ]);
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => show(`${label} copied`, 'success'),
      () => show('Copy failed', 'error'),
    );
  }

  function downloadThumb() {
    if (!s.thumbnailDataUrl) return;
    const a = document.createElement('a');
    a.href = s.thumbnailDataUrl;
    a.download = `${s.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-thumbnail.png`;
    a.click();
  }

  const totalDuration = s.scenes.reduce((sum, sc) => sum + (sc.durationSeconds || 0), 0);
  const platformLabel = PLATFORMS.find((p) => p.value === s.platform)?.label ?? s.platform;
  const styleLabel = CONTENT_STYLES.find((c) => c.value === s.contentStyle)?.label ?? s.contentStyle;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-500">
            {saving ? 'Saving…' : dirty ? 'Unsaved changes' : `Saved · ${fmtRelative(s.updatedAt)}`}
          </span>
          <button onClick={save} disabled={!dirty || saving} className="btn-secondary text-xs">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
          <button onClick={duplicate} className="btn-ghost" aria-label="Duplicate">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={() => setShowMove(true)} className="btn-ghost" aria-label="Move">
            <FolderInput className="h-4 w-4" />
          </button>
          <button onClick={remove} className="btn-ghost text-red-300 hover:text-red-200" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isNew && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-sm text-emerald-200 animate-fade-in">
          <Check className="h-4 w-4" /> Your script is ready. Edit anything you want, then generate a thumbnail when you&apos;re happy.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Section>
            <input
              value={s.title}
              onChange={(e) => patchLocal('title', e.target.value)}
              className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-ink-500"
              placeholder="Untitled script"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-400">
              <span className="chip">{platformLabel}</span>
              <span className="chip">{styleLabel}</span>
              <span className="chip">{s.niche}</span>
              <span className="chip">{totalDuration}s total</span>
              <span className="chip">{s.scenes.length} scenes</span>
            </div>
          </Section>

          <Section title="Hook" copyAs={s.hook} onCopy={(t) => copyText(t, 'Hook')}>
            <textarea
              value={s.hook}
              onChange={(e) => patchLocal('hook', e.target.value)}
              rows={2}
              className="w-full resize-none bg-transparent text-lg font-medium leading-snug outline-none placeholder:text-ink-500"
              placeholder="The opening line that stops the scroll…"
            />
          </Section>

          <Section
            title="Full script"
            copyAs={s.script}
            onCopy={(t) => copyText(t, 'Script')}
            subtitle="Verbatim voiceover — what you'll actually say on camera."
          >
            <textarea
              value={s.script}
              onChange={(e) => patchLocal('script', e.target.value)}
              rows={Math.max(8, s.script.split('\n').length + 2)}
              className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-ink-500"
              placeholder="The full voiceover…"
            />
          </Section>

          <Section
            title="Scene breakdown"
            subtitle="Shot-by-shot: what's on screen, what's said, how long."
          >
            <div className="space-y-3">
              {s.scenes.map((sc, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/20 text-sm font-semibold text-brand-300">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="label">Visual</label>
                        <textarea
                          value={sc.visual}
                          onChange={(e) => updateScene(i, { visual: e.target.value })}
                          rows={2}
                          className="input resize-none"
                          placeholder="Wide shot of…"
                        />
                      </div>
                      <div>
                        <label className="label">Voiceover</label>
                        <textarea
                          value={sc.voiceover}
                          onChange={(e) => updateScene(i, { voiceover: e.target.value })}
                          rows={2}
                          className="input resize-none"
                          placeholder="What's said in this scene…"
                        />
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-3">
                        <div>
                          <label className="label">Seconds</label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={sc.durationSeconds}
                            onChange={(e) =>
                              updateScene(i, { durationSeconds: Number(e.target.value) || 0 })
                            }
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="label">On-screen text (optional)</label>
                          <input
                            value={sc.textOverlay ?? ''}
                            onChange={(e) => updateScene(i, { textOverlay: e.target.value })}
                            className="input"
                            placeholder="Short caption…"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeScene(i)}
                      className="text-ink-400 hover:text-red-300"
                      aria-label="Remove scene"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addScene} className="btn-secondary w-full">
                <Plus className="h-4 w-4" /> Add scene
              </button>
            </div>
          </Section>

          <Section title="Call to action" copyAs={s.cta} onCopy={(t) => copyText(t, 'CTA')}>
            <textarea
              value={s.cta}
              onChange={(e) => patchLocal('cta', e.target.value)}
              rows={2}
              className="w-full resize-none bg-transparent leading-relaxed outline-none placeholder:text-ink-500"
              placeholder="What should the viewer do next?"
            />
          </Section>

          <Section title="Caption" copyAs={s.caption} onCopy={(t) => copyText(t, 'Caption')}>
            <textarea
              value={s.caption}
              onChange={(e) => patchLocal('caption', e.target.value)}
              rows={4}
              className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-ink-500"
              placeholder="Your social caption…"
            />
          </Section>

          <Section
            title="Hashtags"
            copyAs={s.hashtags.join(' ')}
            onCopy={(t) => copyText(t, 'Hashtags')}
          >
            <HashtagEditor
              hashtags={s.hashtags}
              onChange={(tags) => patchLocal('hashtags', tags)}
            />
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="card overflow-hidden">
            <div
              className={cn(
                'relative w-full bg-gradient-to-br from-brand-500/20 via-purple-500/10 to-ink-900',
                s.platform === 'twitter'
                  ? 'aspect-video'
                  : s.platform === 'linkedin'
                    ? 'aspect-square'
                    : 'aspect-[9/16]',
              )}
            >
              {s.thumbnailDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.thumbnailDataUrl}
                  alt={s.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center">
                  <div>
                    <ImageIcon className="mx-auto h-10 w-10 text-ink-500" />
                    <p className="mt-2 px-6 text-sm text-ink-400">
                      No thumbnail yet. Add direction below and generate one.
                    </p>
                  </div>
                </div>
              )}
              {genThumb && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="text-center">
                    <Sparkles className="mx-auto h-8 w-8 animate-pulse text-brand-300" />
                    <p className="mt-2 text-sm">Painting your thumbnail…</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 space-y-3">
              <textarea
                value={thumbDirection}
                onChange={(e) => setThumbDirection(e.target.value)}
                rows={2}
                placeholder="Optional creative direction (e.g. 'neon cyberpunk, close-up portrait')"
                maxLength={500}
                className="input resize-none text-xs"
              />
              <div className="flex gap-2">
                <button
                  onClick={generateThumbnail}
                  disabled={genThumb}
                  className="btn-primary flex-1 text-sm"
                >
                  <Wand2 className="h-4 w-4" />
                  {s.thumbnailDataUrl ? 'Regenerate' : 'Generate thumbnail'}
                </button>
                {s.thumbnailDataUrl && (
                  <button onClick={downloadThumb} className="btn-secondary" aria-label="Download">
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-ink-500">
                Thumbnails are generated with Gemini&apos;s image model. Takes 5–15 seconds.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {showMove && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowMove(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">Move script</h3>
            <div className="mt-4 max-h-72 overflow-y-auto">
              <button
                onClick={() => moveTo(null)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
              >
                <span className="h-3 w-3 rounded-full bg-ink-500" /> Unfiled
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

function Section({
  title,
  subtitle,
  children,
  copyAs,
  onCopy,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  copyAs?: string;
  onCopy?: (text: string) => void;
}) {
  return (
    <section className="card p-5">
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
          </div>
          {onCopy && copyAs && (
            <button
              onClick={() => onCopy(copyAs)}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-ink-300 hover:bg-white/10"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

function HashtagEditor({
  hashtags,
  onChange,
}: {
  hashtags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [val, setVal] = useState('');
  function add() {
    const cleaned = val
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#?/, '#').trim())
      .filter((t) => t.length > 1);
    if (cleaned.length === 0) return;
    onChange([...hashtags, ...cleaned.filter((c) => !hashtags.includes(c))]);
    setVal('');
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag, i) => (
          <span key={i} className="chip group/tag">
            <Hash className="h-3 w-3 text-brand-400" />
            {tag.replace(/^#/, '')}
            <button
              onClick={() => onChange(hashtags.filter((_, idx) => idx !== i))}
              className="ml-1 text-ink-400 opacity-0 transition group-hover/tag:opacity-100 hover:text-red-300"
              aria-label="Remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add hashtag and press Enter"
          className="input flex-1 text-sm"
        />
        <button onClick={add} className="btn-secondary text-sm">
          Add
        </button>
      </div>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z"
      />
    </svg>
  );
}
