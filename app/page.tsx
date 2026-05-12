import Link from 'next/link';
import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { Sparkles, FileText, Image as ImageIcon, FolderOpen, Wand2, ArrowRight } from 'lucide-react';

export default async function LandingPage() {
  const session = await auth0.getSession();
  if (session?.user) redirect('/dashboard');

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <nav className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-500">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          ReelForge
        </Link>
        <div className="flex items-center gap-3">
          <a href="/auth/login" className="btn-ghost">Sign in</a>
          <a href="/auth/login?screen_hint=signup" className="btn-primary">
            Get started <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </nav>

      <section className="mt-20 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink-200">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          Powered by Google Gemini
        </div>
        <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
          From idea to <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">filmable script</span> in 30 seconds.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-300">
          The AI co-writer for short-form creators. Generate viral hooks, full scripts, scene
          breakdowns, captions, hashtags, and thumbnails — all from a one-line topic.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/auth/login?screen_hint=signup" className="btn-primary text-base px-6 py-3">
            Start creating free <ArrowRight className="h-4 w-4" />
          </a>
          <a href="/auth/login" className="btn-secondary text-base px-6 py-3">
            Sign in
          </a>
        </div>
      </section>

      <section className="mt-24 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Feature
          icon={<Wand2 className="h-5 w-5" />}
          title="Multi-step generation"
          desc="Hooks, scripts, scenes, and hashtags are written by specialized AI prompts — not one giant call."
        />
        <Feature
          icon={<FileText className="h-5 w-5" />}
          title="Filmable scene breakdowns"
          desc="Every script ships with shot-by-shot visuals, voiceover, and on-screen text overlays."
        />
        <Feature
          icon={<ImageIcon className="h-5 w-5" />}
          title="AI thumbnails"
          desc="Scroll-stopping posters generated on demand with Gemini's image model."
        />
        <Feature
          icon={<FolderOpen className="h-5 w-5" />}
          title="Organize & iterate"
          desc="Folders, duplication, inline editing — built around how creators actually work."
        />
      </section>

      <footer className="mt-32 border-t border-white/5 py-8 text-center text-sm text-ink-400">
        Built with Next.js, Auth0, MongoDB, and Gemini.
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card card-hover p-5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-ink-300">{desc}</p>
    </div>
  );
}
