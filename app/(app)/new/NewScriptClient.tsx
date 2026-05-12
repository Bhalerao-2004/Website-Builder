'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, ArrowLeft, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { CONTENT_STYLES, PLATFORMS, type ContentStyle, type FolderDTO, type Platform } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';

const PROMPT_IDEAS = [
  { topic: 'Why minimalist morning routines actually backfire', niche: 'Productivity', style: 'storytelling' as ContentStyle },
  { topic: '3 underrated VS Code shortcuts senior devs swear by', niche: 'Tech / Dev', style: 'listicle' as ContentStyle },
  { topic: 'The boring habit that doubled my deep-work hours', niche: 'Productivity', style: 'storytelling' as ContentStyle },
  { topic: 'POV: you finally understand async/await', niche: 'Tech / Dev', style: 'pov' as ContentStyle },
  { topic: 'How a 30-second cold shower changes your day', niche: 'Health & wellness', style: 'motivational' as ContentStyle },
  { topic: 'Trying the viral "75 hard" without going insane', niche: 'Fitness', style: 'vlog' as ContentStyle },
];

export function NewScriptClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { show } = useToast();
  const preselectedFolder = params.get('folder');

  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [style, setStyle] = useState<ContentStyle>('storytelling');
  const [folderId, setFolderId] = useState<string | null>(
    preselectedFolder && preselectedFolder !== 'unfiled' ? preselectedFolder : null,
  );
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'generating'>('form');
  const [progress, setProgress] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/folders')
      .then((r) => r.json())
      .then((d) => setFolders(d.folders ?? []))
      .catch(() => {});
  }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !niche.trim()) {
      show('Topic and niche are required', 'error');
      return;
    }
    setLoading(true);
    setStep('generating');
    setProgress([]);
    const append = (msg: string) =>
      setProgress((p) => [...p, msg]);

    append('Brainstorming hooks and a title…');
    const stepTimer = setInterval(() => {
      setProgress((p) => {
        if (p.length === 1) return [...p, 'Drafting the script and scenes…'];
        if (p.length === 2) return [...p, 'Picking hashtags and a caption…'];
        return p;
      });
    }, 2500);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          niche: niche.trim(),
          platform,
          contentStyle: style,
          folderId,
        }),
      });
      const data = await res.json();
      clearInterval(stepTimer);
      if (!res.ok) {
        show(data.error || 'Generation failed', 'error');
        setStep('form');
        setLoading(false);
        return;
      }
      show('Script generated', 'success');
      router.push(`/scripts/${data.script.id}?new=1`);
    } catch (err) {
      clearInterval(stepTimer);
      show('Something went wrong. Please try again.', 'error');
      setStep('form');
      setLoading(false);
    }
  }

  if (step === 'generating') {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center px-6">
        <div className="text-center">
          <div className="relative mx-auto inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500">
            <Sparkles className="h-9 w-9 animate-pulse text-white" />
            <span className="absolute inset-0 animate-ping rounded-2xl bg-brand-500/30" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">Forging your script…</h2>
          <p className="mt-2 text-ink-400">This takes 10–25 seconds. Multiple AI passes — hold tight.</p>
          <ul className="mt-8 space-y-3 text-left">
            {progress.map((p, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3 text-sm animate-slide-up">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/30 text-brand-300">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-bold">New script</h1>
      <p className="mt-2 text-ink-400">
        Tell us what the video is about. We&apos;ll handle the hook, script, scenes, caption, and
        hashtags — all in one shot.
      </p>

      <form onSubmit={generate} className="mt-8 space-y-6">
        <div>
          <label className="label">Topic</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Why most morning routines actually hurt your focus"
            rows={3}
            maxLength={300}
            className="input resize-none"
          />
          <p className="mt-1 text-xs text-ink-500">{topic.length}/300 characters</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Niche / category</label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Productivity, Fitness, Finance"
              maxLength={100}
              className="input"
            />
          </div>
          <div>
            <label className="label">Folder (optional)</label>
            <select
              value={folderId ?? ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="input"
            >
              <option value="">Unfiled</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Platform</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {PLATFORMS.map((p) => (
              <button
                type="button"
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm transition',
                  platform === p.value
                    ? 'border-brand-400 bg-brand-500/15 text-white'
                    : 'border-white/10 bg-white/[0.03] text-ink-300 hover:border-white/20',
                )}
              >
                <div className="font-medium">{p.label}</div>
                <div className="mt-0.5 text-[10px] text-ink-500">{p.aspect}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Content style</label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_STYLES.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition',
                  style === s.value
                    ? 'border-brand-400 bg-brand-500/15 text-white'
                    : 'border-white/10 bg-white/[0.03] text-ink-300 hover:border-white/20',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Need inspiration?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PROMPT_IDEAS.map((p, i) => (
              <button
                type="button"
                key={i}
                onClick={() => {
                  setTopic(p.topic);
                  setNiche(p.niche);
                  setStyle(p.style);
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs text-ink-200 transition hover:border-brand-400/60 hover:bg-brand-500/10"
              >
                {p.topic}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/dashboard" className="btn-ghost">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary">
            <Wand2 className="h-4 w-4" /> Generate script
          </button>
        </div>
      </form>
    </div>
  );
}
