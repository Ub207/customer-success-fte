import Head from 'next/head';
import SupportForm from '../components/SupportForm';

// ─── SVG Icons (Heroicons-inspired, 24x24 viewBox) ──────────────────────────

function IconBolt({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
    </svg>
  );
}

function IconMail({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 6L2 7" />
    </svg>
  );
}

function IconChatBubble({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconGlobe({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function IconArrowRight({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChannelBadge({ icon, label, dotColor }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-surface-600 shadow-xs transition-all duration-200 hover:border-surface-300 hover:shadow-card">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span className="text-surface-400" aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-surface-50 selection:bg-brand-100 selection:text-brand-900">
      <Head>
        <title>Support | TechCorp</title>
        <meta name="description" content="Get help from TechCorp AI support. Fast, intelligent, 24/7." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-surface-200/60 bg-white/80 backdrop-blur-md" aria-label="Main navigation">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5 group" aria-label="TechCorp Home">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-lg shadow-brand-600/20 transition-transform duration-200 group-hover:scale-105">
              <IconBolt className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-surface-900">TechCorp</span>
          </a>

          <div className="flex items-center gap-3">
            <a href="/webform" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-surface-500 transition-colors duration-200 hover:text-surface-900 hover:bg-surface-100">
              Web Form
            </a>
            <a href="/whatsapp" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-surface-500 transition-colors duration-200 hover:text-surface-900 hover:bg-surface-100">
              WhatsApp
            </a>
            <a href="/gmail" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-surface-500 transition-colors duration-200 hover:text-surface-900 hover:bg-surface-100">
              Gmail
            </a>
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600" role="status" aria-label="AI support is active">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" aria-hidden="true" />
              AI ACTIVE
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 pt-16 pb-24 sm:px-6">

        {/* ── Hero Section ─────────────────────────────── */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-3.5 py-1.5 text-xs font-semibold text-brand-600 mb-6">
            <span className="w-1 h-1 rounded-full bg-brand-400" aria-hidden="true" />
            24/7 Intelligent Support
          </div>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-surface-900 sm:text-5xl">
            How can we help?
          </h1>
          <p className="mx-auto max-w-md text-base leading-relaxed text-surface-500">
            Our AI support agent typically responds in under 5 minutes.
            Describe your issue below to get started.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3" role="list" aria-label="Available support channels">
            <ChannelBadge icon={<IconMail />}    label="Email Channel"    dotColor="bg-blue-400" />
            <ChannelBadge icon={<IconChatBubble />} label="Live Chat"      dotColor="bg-emerald-400" />
            <ChannelBadge icon={<IconGlobe />}   label="Web Support"      dotColor="bg-brand-400" />
          </div>
        </div>

        {/* ── Form Card ────────────────────────────────── */}
        <div className="mx-auto w-full max-w-xl animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-elevated">

            {/* Card Header */}
            <div className="border-b border-surface-100 bg-surface-50/50 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-surface-200 shadow-xs">
                  <span className="text-surface-600"><IconChatBubble className="w-4 h-4" /></span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-surface-900">Open a Ticket</h2>
                  <p className="text-xs text-surface-400 mt-0.5">Please provide as much detail as possible.</p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8">
              <SupportForm />
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-surface-400">
              By submitting, you agree to our{' '}
              <a href="#" className="underline underline-offset-2 decoration-surface-300 transition-colors duration-150 hover:text-surface-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="#" className="underline underline-offset-2 decoration-surface-300 transition-colors duration-150 hover:text-surface-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded">
                Terms of Service
              </a>.
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-surface-100 bg-white py-10" role="contentinfo">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 text-surface-400">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} TechCorp Inc.
          </p>
          <div className="flex gap-6 text-xs font-medium">
            <a href="mailto:support@techcorp.io" className="transition-colors duration-150 hover:text-surface-900 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded px-1 -mx-1">
              support@techcorp.io
            </a>
            <a href="https://status.techcorp.io" target="_blank" rel="noopener noreferrer"
              className="transition-colors duration-150 hover:text-surface-900 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded px-1 -mx-1">
              System Status
            </a>
            <a href="#" className="transition-colors duration-150 hover:text-surface-900 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded px-1 -mx-1">
              Help Center
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
