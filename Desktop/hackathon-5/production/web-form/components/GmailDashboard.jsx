import { useState } from 'react';

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_EMAILS = [
  {
    id: 'msg_001',
    ticket_id: 'TKT-2841',
    from_name: 'Ahmed Khan',
    from_email: 'ahmed@company.com',
    subject: 'Cannot reset my password',
    preview: 'I have been trying to reset my password for the last 2 hours...',
    body: 'I have been trying to reset my password for the last 2 hours. The reset email never arrives in my inbox. I checked spam as well. My account email is ahmed@company.com. This is blocking me from doing my work.',
    received_at: '2026-03-31T09:14:00Z',
    status: 'replied',
    ai_reply: 'Hi Ahmed,\n\nThank you for reaching out! I\'ve looked into your account and can see the issue.\n\nThe reset emails were being filtered by your email provider\'s security rules. I\'ve whitelisted our domain on your account.\n\nPlease try requesting a password reset again — it should arrive within 2 minutes.\n\nIf you still face issues, reply to this email and I\'ll escalate to our account team immediately.\n\nBest regards,\nTechCorp AI Support',
    category: 'account',
    priority: 'high',
    sentiment: 0.35,
    escalated: false,
    latency_ms: 1840,
  },
  {
    id: 'msg_002',
    ticket_id: 'TKT-2842',
    from_name: 'Sara Malik',
    from_email: 'sara@startup.io',
    subject: 'Billing charge question — urgent',
    preview: 'I was charged twice this month for my subscription...',
    body: 'I was charged twice this month for my subscription. My invoice number is INV-9921. Please refund the duplicate charge immediately. This is unacceptable.',
    received_at: '2026-03-31T10:02:00Z',
    status: 'escalated',
    ai_reply: 'Hi Sara,\n\nI sincerely apologize for this billing issue. I\'ve reviewed your account and confirmed the duplicate charge on invoice INV-9921.\n\nThis has been escalated to our Billing Team (billing@techcorp.io) with HIGH priority. They will process your refund within 4 hours and email you a confirmation.\n\nTicket reference: TKT-2842\n\nSorry again for the inconvenience.\n\nTechCorp AI Support',
    category: 'billing',
    priority: 'urgent',
    sentiment: 0.18,
    escalated: true,
    escalated_to: 'billing@techcorp.io',
    latency_ms: 2100,
  },
  {
    id: 'msg_003',
    ticket_id: 'TKT-2843',
    from_name: 'Usman Farooq',
    from_email: 'usman@freelance.pk',
    subject: 'How to add a team member?',
    preview: 'Quick question — I want to add my colleague to my workspace...',
    body: 'Quick question — I want to add my colleague to my workspace. I looked in settings but could not find the option. Can you guide me?',
    received_at: '2026-03-31T11:30:00Z',
    status: 'replied',
    ai_reply: 'Hi Usman,\n\nGreat question! Adding a team member is easy:\n\n1. Go to Settings → Team → Members\n2. Click "Invite Member"\n3. Enter their email address\n4. Choose their role (Admin/Editor/Viewer)\n5. Click Send Invite\n\nThey\'ll receive an email and can join immediately.\n\nLet me know if you need any help!\n\nTechCorp AI Support',
    category: 'general',
    priority: 'low',
    sentiment: 0.82,
    escalated: false,
    latency_ms: 1650,
  },
  {
    id: 'msg_004',
    ticket_id: 'TKT-2844',
    from_name: 'Zainab Ali',
    from_email: 'zainab@enterprise.com',
    subject: 'API rate limit issue in production',
    preview: 'Our integration is hitting 429 errors every 10 minutes...',
    body: 'Our integration is hitting 429 Too Many Requests errors every 10 minutes during peak hours. We are on the Business plan. Is there a way to increase our rate limit? This is affecting our production system.',
    received_at: '2026-03-31T12:45:00Z',
    status: 'processing',
    ai_reply: null,
    category: 'technical',
    priority: 'high',
    sentiment: 0.52,
    escalated: false,
    latency_ms: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
}

const STATUS_CONFIG = {
  replied:    { label: 'Replied',    bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  escalated:  { label: 'Escalated', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  processing: { label: 'Processing',bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500 animate-pulse' },
  pending:    { label: 'Pending',   bg: 'bg-surface-100', text: 'text-surface-600', dot: 'bg-surface-400' },
};

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', bg: 'bg-red-100',    text: 'text-red-700'    },
  high:   { label: 'High',   bg: 'bg-orange-100', text: 'text-orange-700' },
  medium: { label: 'Medium', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  low:    { label: 'Low',    bg: 'bg-surface-100', text: 'text-surface-500' },
};

// ─── SVG Icon Components ──────────────────────────────────────────────────────
function IconEnvelope({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconBell({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function IconInbox({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function IconUnlock({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function IconSend({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function IconBot({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect x="2" y="8" width="16" height="12" rx="2" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="14" cy="14" r="1" />
    </svg>
  );
}

function IconCheck({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconX({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function IconSpinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function IconMail({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconChevronRight({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// ─── SentimentBar ─────────────────────────────────────────────────────────────
function SentimentBar({ score }) {
  const pct = Math.round(score * 100);
  const color = score < 0.3 ? 'bg-red-500' : score < 0.6 ? 'bg-yellow-500' : 'bg-green-500';
  const label = score < 0.3 ? 'Negative' : score < 0.6 ? 'Neutral' : 'Positive';
  const labelColor = score < 0.3 ? 'text-red-700 font-semibold' : score < 0.6 ? 'text-yellow-700 font-semibold' : 'text-green-700 font-semibold';
  return (
    <div>
      <div className="flex justify-between text-xs text-surface-500 mb-1.5">
        <span className="font-medium">Sentiment Score</span>
        <span className={labelColor}>
          {label} &middot; {pct}%
        </span>
      </div>
      <div className="w-full bg-surface-200 rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-2 rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Sentiment: ${label}, ${pct}%`}
        />
      </div>
    </div>
  );
}

// ─── Flow Diagram ─────────────────────────────────────────────────────────────
function FlowDiagram() {
  const steps = [
    { Icon: IconEnvelope, label: 'Customer Email', sub: 'customer sends email' },
    { Icon: IconBell, label: 'Pub/Sub Notify', sub: 'Google notifies server' },
    { Icon: IconInbox, label: 'Webhook Hit', sub: 'POST /webhooks/gmail' },
    { Icon: IconUnlock, label: 'Decode + Fetch', sub: 'base64 → Gmail API' },
    { Icon: IconSend, label: 'Kafka Queue', sub: 'gmail_inbound topic' },
    { Icon: IconBot, label: 'AI Agent', sub: '5 tools, GPT-4o' },
    { Icon: IconChevronRight, label: 'Gmail Reply', sub: 'send_gmail_reply()' },
  ];
  return (
    <div className="bg-surface-900 rounded-xl p-5 mb-6 shadow-card">
      <p className="text-xs text-surface-400 mb-3 font-mono uppercase tracking-wider">Gmail Flow — How it works</p>
      <div className="flex flex-wrap items-center gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="text-center">
              <div className="bg-surface-800 rounded-lg px-3 py-2 min-w-[80px] shadow-card">
                <div className="flex justify-center text-surface-300">
                  <s.Icon className="w-5 h-5" />
                </div>
                <div className="text-xs text-white font-medium leading-tight mt-1">{s.label}</div>
                <div className="text-xs text-surface-400 leading-tight">{s.sub}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <svg className="w-5 h-5 text-surface-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Email Row ────────────────────────────────────────────────────────────────
function EmailRow({ email, selected, onClick }) {
  const status = STATUS_CONFIG[email.status] || STATUS_CONFIG.pending;
  const priority = PRIORITY_CONFIG[email.priority] || PRIORITY_CONFIG.medium;
  return (
    <button
      onClick={onClick}
      role="option"
      aria-selected={selected}
      className={`w-full text-left px-4 py-3 border-b border-surface-100 transition-all duration-200 cursor-pointer hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-inset ${
        selected ? 'bg-brand-50 border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm text-surface-900 truncate">{email.from_name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priority.bg} ${priority.text}`}>
              {priority.label}
            </span>
          </div>
          <p className="text-sm text-surface-700 truncate font-medium">{email.subject}</p>
          <p className="text-xs text-surface-400 truncate mt-0.5">{email.preview}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-surface-400">{formatTime(email.received_at)}</span>
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Email Detail ─────────────────────────────────────────────────────────────
function EmailDetail({ email }) {
  const [tab, setTab] = useState('original');
  const status = STATUS_CONFIG[email.status] || STATUS_CONFIG.pending;
  const priority = PRIORITY_CONFIG[email.priority] || PRIORITY_CONFIG.medium;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-surface-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-bold text-surface-900">{email.subject}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-surface-500">
              <span>From:</span>
              <span className="font-medium text-surface-700">{email.from_name}</span>
              <span className="text-surface-400">&lt;{email.from_email}&gt;</span>
            </div>
            <div className="text-xs text-surface-400 mt-0.5">
              {formatDate(email.received_at)} at {formatTime(email.received_at)}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-xs font-mono text-brand-600 bg-brand-50 px-2 py-1 rounded">
              {email.ticket_id}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.bg} ${priority.text}`}>
              {priority.label}
            </span>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="bg-surface-50 rounded-lg p-2 text-center">
            <div className="text-xs text-surface-500">Channel</div>
            <div className="text-sm font-semibold text-surface-800 flex items-center justify-center gap-1.5 mt-0.5">
              <IconMail className="w-4 h-4 text-surface-600" />
              Gmail
            </div>
          </div>
          <div className="bg-surface-50 rounded-lg p-2 text-center">
            <div className="text-xs text-surface-500">AI Latency</div>
            <div className="text-sm font-semibold text-surface-800 mt-0.5">
              {email.latency_ms ? `${(email.latency_ms / 1000).toFixed(1)}s` : '—'}
            </div>
          </div>
          <div className="bg-surface-50 rounded-lg p-2 text-center">
            <div className="text-xs text-surface-500">Escalated</div>
            <div className="text-sm font-semibold text-surface-800 flex items-center justify-center gap-1.5 mt-0.5">
              {email.escalated ? (
                <>
                  <IconCheck className="w-4 h-4 text-green-600" />
                  <span>{email.escalated_to?.split('@')[0]}</span>
                </>
              ) : (
                <>
                  <IconX className="w-4 h-4 text-surface-400" />
                  <span>No</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <SentimentBar score={email.sentiment} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200">
        {[
          { key: 'original', label: 'Original Email', Icon: IconEnvelope },
          { key: 'ai_reply', label: 'AI Reply', Icon: IconBot },
        ].map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              tab === t.key
                ? 'border-b-2 border-brand-500 text-brand-600'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <t.Icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'original' ? (
          <div id="panel-original" role="tabpanel" className="bg-surface-50 rounded-xl p-4">
            <pre className="text-sm text-surface-700 whitespace-pre-wrap font-sans leading-relaxed">
              {email.body}
            </pre>
          </div>
        ) : email.ai_reply ? (
          <div id="panel-ai_reply" role="tabpanel">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900">TechCorp AI Support</p>
                <p className="text-xs text-surface-400">support@techcorp.io → {email.from_email}</p>
              </div>
            </div>
            <div className="bg-white border border-surface-200 rounded-xl p-4 shadow-card">
              <pre className="text-sm text-surface-700 whitespace-pre-wrap font-sans leading-relaxed">
                {email.ai_reply}
              </pre>
            </div>
            {email.latency_ms && (
              <p className="text-xs text-surface-400 mt-2 text-right">
                Generated in {(email.latency_ms / 1000).toFixed(1)}s via OpenAI Agents SDK
              </p>
            )}
          </div>
        ) : (
          <div id="panel-ai_reply" role="tabpanel" className="flex flex-col items-center justify-center h-40 text-surface-400">
            <IconSpinner className="w-10 h-10 text-brand-400 mb-3" />
            <p className="text-sm">AI is processing this email...</p>
            <p className="text-xs mt-1">Kafka worker → Agent → Gmail reply</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ emails }) {
  const total     = emails.length;
  const replied   = emails.filter(e => e.status === 'replied').length;
  const escalated = emails.filter(e => e.status === 'escalated').length;
  const avgMs     = emails.filter(e => e.latency_ms).reduce((a, e) => a + e.latency_ms, 0)
                  / emails.filter(e => e.latency_ms).length;

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {[
        { label: 'Total Emails',     value: total,                        color: 'text-surface-900' },
        { label: 'AI Replied',       value: replied,                      color: 'text-green-600'  },
        { label: 'Escalated',        value: escalated,                    color: 'text-orange-600' },
        { label: 'Avg Response',     value: `${(avgMs/1000).toFixed(1)}s`, color: 'text-brand-600'  },
      ].map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-surface-200 p-3 text-center shadow-card">
          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          <div className="text-xs text-surface-500 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GmailDashboard() {
  const [selected, setSelected] = useState(MOCK_EMAILS[0]);
  const [filter, setFilter]     = useState('all');

  const filtered = filter === 'all'
    ? MOCK_EMAILS
    : MOCK_EMAILS.filter(e => e.status === filter);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-surface-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-surface-900">Gmail Channel</span>
              <span className="ml-2 text-xs text-surface-400">AI Customer Success FTE</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium" role="status" aria-label="Pub/Sub connection active">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Pub/Sub Active
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Flow Diagram */}
        <FlowDiagram />

        {/* Stats */}
        <StatsBar emails={MOCK_EMAILS} />

        {/* Filter tabs */}
        <div className="flex gap-2 mb-3" role="group" aria-label="Filter emails by status">
          {['all', 'replied', 'escalated', 'processing'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              role="button"
              aria-pressed={filter === f}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize cursor-pointer ${
                filter === f
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white border border-surface-200 text-surface-600 hover:border-brand-300 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
              }`}
            >
              {f === 'all' ? `All (${MOCK_EMAILS.length})` : f}
            </button>
          ))}
        </div>

        {/* Email split view */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-elevated overflow-hidden h-[calc(100vh-360px)] min-h-[440px]"
             style={{ display: 'grid', gridTemplateColumns: '340px 1fr' }}>
          {/* Left: email list */}
          <div className="border-r border-surface-200 overflow-y-auto" role="listbox" aria-label="Email inbox">
            <div className="px-4 py-2 bg-surface-50 border-b border-surface-200">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Inbox — {filtered.length} emails
              </p>
            </div>
            {filtered.map(email => (
              <EmailRow
                key={email.id}
                email={email}
                selected={selected?.id === email.id}
                onClick={() => setSelected(email)}
              />
            ))}
          </div>

          {/* Right: detail */}
          <div className="overflow-hidden">
            {selected
              ? <EmailDetail email={selected} />
              : (
                <div className="flex items-center justify-center h-full text-surface-400">
                  <p>Select an email to view details</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Code explanation */}
        <div className="mt-6 bg-surface-900 rounded-xl p-5 text-sm font-mono shadow-elevated">
          <p className="text-green-400 mb-3"># gmail_handler.py — key functions</p>
          <p className="text-surface-400">
            <span className="text-blue-400">parse_gmail_pubsub</span>
            <span className="text-white">(data)</span>
            <span className="text-surface-500">  # base64 decode → historyId, emailAddress</span>
          </p>
          <p className="text-surface-400 mt-1">
            <span className="text-blue-400">process_notification</span>
            <span className="text-white">(history_id)</span>
            <span className="text-surface-500">  # Gmail API → actual email content</span>
          </p>
          <p className="text-surface-400 mt-1">
            <span className="text-blue-400">send_gmail_reply</span>
            <span className="text-white">(to, subject, body)</span>
            <span className="text-surface-500">  # Google service account → reply</span>
          </p>
          <p className="text-yellow-400 mt-3"># Kafka topics</p>
          <p className="text-surface-400">
            <span className="text-white">gmail_inbound</span>
            <span className="text-surface-500">  → worker picks up → AI Agent processes → </span>
            <span className="text-white">gmail_outbound</span>
          </p>
        </div>
      </div>
    </div>
  );
}
