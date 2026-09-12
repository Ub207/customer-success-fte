import { useState } from 'react';

// ─── SVG Icon Components ──────────────────────────────────────────────────────
// Category icons
function IconGear({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconCreditCard({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconUser({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconBug({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.88 1.88" />
      <path d="M14.12 3.88L16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" />
      <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
      <path d="M22 13h-4" />
      <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </svg>
  );
}

function IconChat({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconStar({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconClipboard({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

// Flow / Journey step icons
function IconGlobe({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconClipboardCheck({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function IconSend({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconBot({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

function IconDatabase({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function IconMail({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconCheckCircle({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconTicket({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}

function IconFlag({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function IconClock({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconPaperclip({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

// Flow diagram arrow
function IconArrowRight({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// Tab icons
function IconSubmission({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconAI({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconMap({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

// Status indicator icons
function IconCheckSolid({ className = 'w-3 h-3' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconLoader({ className = 'w-3 h-3' }) {
  return (
    <svg className={`${className} animate-[spin_2s_linear_infinite]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ─── Icon Map ─────────────────────────────────────────────────────────────────
const CAT_ICONS = {
  technical: IconGear,
  billing:   IconCreditCard,
  account:   IconUser,
  bug:       IconBug,
  general:   IconChat,
  feedback:  IconStar,
  other:     IconClipboard,
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TICKETS = [
  {
    id: 'WEB-A1B2C3D4',
    db_id: 'a1b2c3d4-0000-0000-0000-000000000001',
    name: 'Fatima Khan',
    email: 'fatima@techstartup.pk',
    subject: 'Integration not working with Zapier',
    message: 'We are trying to connect TechCorp to Zapier but the OAuth flow fails at the authorization step. We get error: "redirect_uri_mismatch". We have tried multiple redirect URIs listed in the docs but none work. Our team is blocked.',
    category: 'technical',
    priority: 'high',
    status: 'resolved',
    submitted_at: '2026-03-31T08:00:00Z',
    resolved_at: '2026-03-31T08:00:02Z',
    sla: '4 hours',
    latency_ms: 1920,
    ai_response: 'Hi Fatima,\n\nThanks for the detailed report. The redirect_uri_mismatch error happens when the URI in your Zapier app settings doesn\'t exactly match what\'s registered in TechCorp.\n\nFix:\n1. Go to TechCorp Developer Settings → OAuth Apps\n2. Add this exact URI: https://zapier.com/dashboard/auth/oauth/return/TechCorp/\n3. Save and retry the Zapier flow\n\nThis is the most common cause. If it still fails, please share a screenshot of your OAuth app settings.\n\nTicket: WEB-A1B2C3D4\nTechCorp AI Support',
    smtp_status: 'sent',
    kafka_topic: 'webform_inbound',
  },
  {
    id: 'WEB-E5F6G7H8',
    db_id: 'e5f6g7h8-0000-0000-0000-000000000002',
    name: 'Omar Siddiqui',
    email: 'omar@agency.com',
    subject: 'Request for bulk discount',
    message: 'We are an agency managing 15 client accounts. We want to know if there is a reseller or bulk discount program available. We are currently paying individually for each account.',
    category: 'billing',
    priority: 'medium',
    status: 'escalated',
    submitted_at: '2026-03-31T09:30:00Z',
    resolved_at: null,
    sla: '8 hours',
    latency_ms: 2050,
    ai_response: 'Hi Omar,\n\nThank you for your interest in our bulk program!\n\nYour request has been forwarded to our Billing Team who handles agency partnerships. They will reach out within 4 hours with pricing details for your 15 accounts.\n\nEscalated to: billing@techcorp.io\nTicket: WEB-E5F6G7H8\n\nTechCorp AI Support',
    smtp_status: 'sent',
    kafka_topic: 'webform_inbound',
    escalated_to: 'billing@techcorp.io',
  },
  {
    id: 'WEB-I9J0K1L2',
    db_id: 'i9j0k1l2-0000-0000-0000-000000000003',
    name: 'Maryam Butt',
    email: 'maryam@nonprofit.org',
    subject: 'Data export feature missing',
    message: 'I cannot find the data export button that was available last month. I need to export all my customer data to CSV for our quarterly report. Is this feature removed?',
    category: 'bug',
    priority: 'medium',
    status: 'resolved',
    submitted_at: '2026-03-31T10:15:00Z',
    resolved_at: '2026-03-31T10:15:02Z',
    sla: '8 hours',
    latency_ms: 1750,
    ai_response: 'Hi Maryam,\n\nThe export button was moved in our latest update (v2.4). New location:\n\nSettings → Data Management → Export → Export to CSV\n\nYou can also export directly from any data table using the "⋮" menu on the right → Export.\n\nFor your quarterly report, I recommend using the "Date Range" filter first to select Q1 2026 before exporting.\n\nLet me know if you need help!\nTechCorp AI Support',
    smtp_status: 'sent',
    kafka_topic: 'webform_inbound',
  },
  {
    id: 'WEB-M3N4O5P6',
    db_id: 'm3n4o5p6-0000-0000-0000-000000000004',
    name: 'Imran Hussain',
    email: 'imran@ecom.pk',
    subject: 'Slow response times on API',
    message: 'Our API calls are taking 8-12 seconds to respond when they used to take under 1 second. This started 2 days ago. Our region is ap-south-1. Is there a known issue?',
    category: 'technical',
    priority: 'urgent',
    status: 'processing',
    submitted_at: '2026-03-31T12:00:00Z',
    resolved_at: null,
    sla: '2 hours',
    latency_ms: null,
    ai_response: null,
    smtp_status: 'pending',
    kafka_topic: 'webform_inbound',
  },
];

const SLA_MAP = {
  urgent: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Urgent' },
  high:   { bg: 'bg-orange-100', text: 'text-orange-700', label: 'High'   },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
  low:    { bg: 'bg-surface-100', text: 'text-surface-500', label: 'Low'   },
};

const STATUS_MAP = {
  resolved:   { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',               label: 'Resolved'   },
  escalated:  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500',               label: 'Escalated'  },
  processing: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500 animate-pulse-soft', label: 'Processing' },
  queued:     { bg: 'bg-surface-100', text: 'text-surface-600', dot: 'bg-surface-400',              label: 'Queued'     },
};

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
}

// ─── Flow Diagram ─────────────────────────────────────────────────────────────
const FLOW_STEP_ICONS = [
  { Icon: IconGlobe,          label: 'Web Form',    sub: 'Next.js UI' },
  { Icon: IconClipboardCheck, label: 'Validate',    sub: 'Pydantic model' },
  { Icon: IconSend,           label: 'Kafka',        sub: 'webform_inbound' },
  { Icon: IconBot,            label: 'AI Agent',     sub: 'GPT-4o / Groq' },
  { Icon: IconDatabase,       label: 'PostgreSQL',   sub: 'ticket saved' },
  { Icon: IconMail,           label: 'SMTP Reply',   sub: 'email customer' },
  { Icon: IconCheckCircle,    label: 'Status API',   sub: 'GET /ticket/{id}' },
];

function FlowDiagram() {
  return (
    <div className="bg-surface-900 rounded-xl p-4 mb-5 shadow-card">
      <p className="text-xs text-surface-400 mb-3 font-mono uppercase tracking-wider">Web Form Flow — Submit → Kafka → AI → SMTP → Status</p>
      <div className="flex flex-wrap items-center gap-1" role="list" aria-label="Web form processing flow">
        {FLOW_STEP_ICONS.map((s, i) => (
          <div key={i} className="flex items-center gap-1" role="listitem">
            <div className="bg-surface-800 rounded-lg px-2.5 py-1.5 text-center min-w-[72px] transition-colors duration-200 hover:bg-surface-700">
              <div className="text-surface-300 flex justify-center">
                <s.Icon className="w-4 h-4" />
              </div>
              <div className="text-xs text-white font-medium leading-tight mt-1">{s.label}</div>
              <div className="text-xs text-surface-400 leading-tight">{s.sub}</div>
            </div>
            {i < FLOW_STEP_ICONS.length - 1 && (
              <span className="text-surface-500 flex-shrink-0" aria-hidden="true">
                <IconArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function Stats({ tickets }) {
  const resolved   = tickets.filter(t => t.status === 'resolved').length;
  const escalated  = tickets.filter(t => t.status === 'escalated').length;
  const avgMs      = tickets.filter(t => t.latency_ms).reduce((a, t) => a + t.latency_ms, 0)
                   / tickets.filter(t => t.latency_ms).length;
  const sent       = tickets.filter(t => t.smtp_status === 'sent').length;
  return (
    <div className="grid grid-cols-4 gap-3 mb-4" role="status" aria-label="Ticket statistics">
      {[
        { label: 'Total Tickets',  value: tickets.length,                    color: 'text-surface-900' },
        { label: 'Resolved',       value: resolved,                          color: 'text-green-600'  },
        { label: 'Escalated',      value: escalated,                         color: 'text-orange-600' },
        { label: 'Emails Sent',    value: sent,                              color: 'text-brand-600'  },
      ].map(s => (
        <div key={s.label} className="bg-surface-0 rounded-xl border border-surface-200 p-3 text-center shadow-card transition-shadow duration-200 hover:shadow-card-hover">
          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          <div className="text-xs text-surface-500 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Ticket Row ───────────────────────────────────────────────────────────────
function TicketRow({ ticket, selected, onClick }) {
  const st = STATUS_MAP[ticket.status] || STATUS_MAP.queued;
  const pr = SLA_MAP[ticket.priority]  || SLA_MAP.medium;
  const CatIcon = CAT_ICONS[ticket.category] || IconClipboard;
  return (
    <button onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      className={`w-full text-left px-4 py-3 border-b border-surface-100 cursor-pointer transition-all duration-200 ease-out hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset ${
        selected ? 'bg-brand-50 border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'
      }`}>
      <div className="flex items-start gap-2">
        <span className="text-surface-500 mt-0.5 shrink-0" aria-hidden="true"><CatIcon className="w-5 h-5" /></span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-surface-900 truncate">{ticket.name}</span>
            <span className="text-xs text-surface-400 shrink-0 ml-2">{fmtTime(ticket.submitted_at)}</span>
          </div>
          <p className="text-xs font-medium text-surface-700 truncate">{ticket.subject}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${pr.bg} ${pr.text}`}>{pr.label}</span>
            <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} aria-hidden="true" />{st.label}
            </span>
            <span className="text-xs font-mono text-brand-500">{ticket.id}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Ticket Detail ────────────────────────────────────────────────────────────
const TAB_META = {
  submission: { Icon: IconSubmission, label: 'Submission' },
  ai_response: { Icon: IconAI,        label: 'AI Response' },
  journey:    { Icon: IconMap,        label: 'Journey' },
};

const JOURNEY_STEPS = [
  { key: 'submitted', done: true,  Icon: IconGlobe,          title: 'Form Submitted',      getSub: () => 'POST /web-form/submit' },
  { key: 'validated', done: true,  Icon: IconClipboardCheck, title: 'Pydantic Validated',  getSub: () => 'name, email, message, priority, category' },
  { key: 'kafka',     done: true,  Icon: IconSend,           title: 'Queued to Kafka',     getSub: (t) => `topic: ${t.kafka_topic}` },
  { key: 'ticket',    done: true,  Icon: IconTicket,         title: 'Ticket ID Generated', getSub: (t) => t.id },
  { key: 'agent',     done: null,  Icon: IconBot,            title: 'AI Agent Processed',  getSub: (t) => t.latency_ms ? `${(t.latency_ms/1000).toFixed(1)}s response` : 'in progress...' },
  { key: 'saved',     done: null,  Icon: IconDatabase,       title: 'Saved to PostgreSQL', getSub: () => 'ticket, conversation, message rows' },
  { key: 'email',     done: null,  Icon: IconMail,           title: 'Email Sent via SMTP', getSub: (t) => `→ ${t.email}` },
  { key: 'closed',    done: null,  Icon: IconFlag,           title: 'Ticket Closed',       getSub: (t) => t.status },
];

function TicketDetail({ ticket }) {
  const [tab, setTab] = useState('submission');
  const st = STATUS_MAP[ticket.status] || STATUS_MAP.queued;
  const pr = SLA_MAP[ticket.priority]  || SLA_MAP.medium;
  const CatIcon = CAT_ICONS[ticket.category] || IconClipboard;

  const journeyData = JOURNEY_STEPS.map(step => {
    let done;
    let time;
    switch (step.key) {
      case 'submitted':
      case 'validated':
      case 'kafka':
      case 'ticket':
        done = true;
        time = fmtTime(ticket.submitted_at);
        break;
      case 'agent':
        done = !!ticket.ai_response;
        time = ticket.resolved_at ? fmtTime(ticket.resolved_at) : '⏳';
        break;
      case 'saved':
        done = !!ticket.ai_response;
        time = ticket.resolved_at ? fmtTime(ticket.resolved_at) : '⏳';
        break;
      case 'email':
        done = ticket.smtp_status === 'sent';
        time = ticket.resolved_at ? fmtTime(ticket.resolved_at) : '⏳';
        break;
      case 'closed':
        done = ticket.status === 'resolved' || ticket.status === 'escalated';
        time = '—';
        break;
      default:
        done = false;
        time = '—';
    }
    return { ...step, done, time, sub: step.getSub(ticket) };
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-surface-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-surface-900">{ticket.subject}</h2>
            <p className="text-sm text-surface-500 mt-0.5">
              <span className="font-medium text-surface-700">{ticket.name}</span>
              {' '}&lt;{ticket.email}&gt;
            </p>
            <p className="text-xs text-surface-400">{fmtDate(ticket.submitted_at)} at {fmtTime(ticket.submitted_at)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-xs font-mono text-brand-600 bg-brand-50 px-2 py-1 rounded">{ticket.id}</span>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} aria-hidden="true" />{st.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pr.bg} ${pr.text}`}>
              {pr.label} — SLA: {ticket.sla}
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-2" role="list" aria-label="Ticket metrics">
          {[
            { label: 'Category',    value: ticket.category,      Icon: CatIcon },
            { label: 'Kafka Topic', value: ticket.kafka_topic,   Icon: null },
            { label: 'AI Latency',  value: ticket.latency_ms ? `${(ticket.latency_ms/1000).toFixed(1)}s` : null, Icon: ticket.latency_ms ? IconCheckCircle : IconLoader },
            { label: 'SMTP Status', value: ticket.smtp_status === 'sent' ? 'Sent' : ticket.smtp_status === 'pending' ? 'Pending' : ticket.smtp_status, Icon: ticket.smtp_status === 'sent' ? IconCheckCircle : IconLoader },
          ].map(m => (
            <div key={m.label} className="bg-surface-50 rounded-lg p-2 text-center" role="listitem">
              <div className="text-xs text-surface-500">{m.label}</div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                {m.Icon && <span className="text-surface-400" aria-hidden="true"><m.Icon className="w-3 h-3" /></span>}
                <span className="text-xs font-semibold text-surface-800 capitalize">{m.value ?? 'processing'}</span>
              </div>
            </div>
          ))}
        </div>

        {ticket.escalated_to && (
          <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <p className="text-xs text-orange-700">
              <span className="font-semibold">Escalated to:</span> {ticket.escalated_to}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200" role="tablist" aria-label="Ticket detail tabs">
        {Object.entries(TAB_META).map(([key, { Icon, label }]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            aria-controls={`tabpanel-${key}`}
            id={`tab-${key}`}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset ${
              tab === key ? 'border-b-2 border-brand-500 text-brand-600' : 'text-surface-500 hover:text-surface-700'
            }`}>
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'submission' && (
          <div role="tabpanel" id="tabpanel-submission" aria-labelledby="tab-submission" className="space-y-3 animate-fade-in">
            <div className="bg-surface-50 rounded-xl p-4">
              <p className="text-xs text-surface-500 mb-2 font-medium uppercase tracking-wider">Customer Message</p>
              <p className="text-sm text-surface-700 leading-relaxed">{ticket.message}</p>
            </div>
            <div className="bg-surface-50 rounded-xl p-3">
              <p className="text-xs text-surface-500 mb-2 font-medium uppercase tracking-wider">Pydantic Validation Passed</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { k: 'name',     v: ticket.name     },
                  { k: 'email',    v: ticket.email    },
                  { k: 'category', v: ticket.category },
                  { k: 'priority', v: ticket.priority },
                  { k: 'subject',  v: ticket.subject  },
                ].map(({k, v}) => (
                  <div key={k} className="flex gap-1">
                    <span className="text-surface-400 font-mono">{k}:</span>
                    <span className="text-green-700 font-medium">
                      <svg className="w-3 h-3 inline-block mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'ai_response' && (
          <div role="tabpanel" id="tabpanel-ai_response" aria-labelledby="tab-ai_response" className="animate-fade-in">
            {ticket.ai_response ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900">TechCorp AI Support</p>
                    <p className="text-xs text-surface-400">support@techcorp.io → {ticket.email}</p>
                  </div>
                  <span className="ml-auto text-xs text-surface-400">
                    {ticket.latency_ms ? `${(ticket.latency_ms/1000).toFixed(1)}s` : ''}
                  </span>
                </div>
                <div className="bg-surface-0 border border-surface-200 rounded-xl p-4 shadow-card">
                  <pre className="text-sm text-surface-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {ticket.ai_response}
                  </pre>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    ticket.smtp_status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'
                  }`}>
                    {ticket.smtp_status === 'sent'
                      ? <IconCheckCircle className="w-3 h-3" />
                      : <IconLoader className="w-3 h-3" />
                    }
                    SMTP: {ticket.smtp_status}
                  </span>
                  <span className="text-xs text-surface-400">Delivered to {ticket.email}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-surface-400">
                <div className="w-10 h-10 border-4 border-brand-300 border-t-brand-600 rounded-full animate-spin mb-3" aria-hidden="true" />
                <p className="text-sm" role="status">Kafka worker processing...</p>
                <p className="text-xs mt-1">webform_inbound → Agent → PostgreSQL → SMTP</p>
              </div>
            )}
          </div>
        )}

        {tab === 'journey' && (
          <div role="tabpanel" id="tabpanel-journey" aria-labelledby="tab-journey" className="space-y-1 animate-fade-in">
            {journeyData.map((step, i) => {
              const StepIcon = step.Icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                    step.done ? 'bg-green-100 text-green-600' : 'bg-surface-100 text-surface-400'
                  }`} aria-hidden="true">
                    {step.done ? <StepIcon className="w-3.5 h-3.5" /> : <IconClock className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 pb-3 border-b border-surface-100 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${step.done ? 'text-surface-800' : 'text-surface-400'}`}>{step.title}</span>
                      <span className="text-xs text-surface-400">{step.time}</span>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">{step.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WebFormDashboard() {
  const [selected, setSelected] = useState(MOCK_TICKETS[0]);
  const [filter, setFilter]     = useState('all');

  const filtered = filter === 'all' ? MOCK_TICKETS : MOCK_TICKETS.filter(t => t.status === filter);

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-surface-0 border-b border-surface-200 shadow-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-surface-900">Web Form Channel</span>
              <span className="ml-2 text-xs text-surface-400">AI Customer Success FTE</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-brand-600 font-medium">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse-soft" aria-hidden="true" />
            <span role="status">FastAPI Active</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-5">
        <FlowDiagram />
        <Stats tickets={MOCK_TICKETS} />

        <div className="flex gap-2 mb-3" role="group" aria-label="Filter tickets by status">
          {['all', 'resolved', 'escalated', 'processing'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                filter === f ? 'bg-brand-600 text-white shadow-card' : 'bg-surface-0 border border-surface-200 text-surface-600 hover:border-brand-300'
              }`}>
              {f === 'all' ? `All (${MOCK_TICKETS.length})` : f}
            </button>
          ))}
        </div>

        <div className="bg-surface-0 rounded-xl border border-surface-200 shadow-card overflow-hidden h-[calc(100vh-320px)] min-h-[480px] grid"
             style={{ gridTemplateColumns: '340px 1fr' }}>
          <div className="border-r border-surface-200 overflow-y-auto">
            <div className="px-4 py-2 bg-brand-600">
              <p className="text-xs font-semibold text-brand-200 uppercase tracking-wider">Tickets — {filtered.length}</p>
            </div>
            {filtered.map(t => (
              <TicketRow key={t.id} ticket={t} selected={selected?.id === t.id} onClick={() => setSelected(t)} />
            ))}
          </div>
          <div className="overflow-hidden">
            {selected
              ? <TicketDetail ticket={selected} />
              : <div className="flex items-center justify-center h-full text-surface-400">Select a ticket</div>
            }
          </div>
        </div>

        <div className="mt-5 bg-surface-900 rounded-xl p-4 text-sm font-mono shadow-card">
          <p className="text-green-400 mb-2"># web_form_handler.py — key functions</p>
          <p className="text-surface-400"><span className="text-blue-400">SupportFormSubmission</span><span className="text-surface-500">     # Pydantic — validates name, email, message, priority, category</span></p>
          <p className="text-surface-400 mt-1"><span className="text-blue-400">submit_support_form</span><span className="text-surface-500">       # POST /web-form/submit → Kafka → returns ticket_id + SLA</span></p>
          <p className="text-surface-400 mt-1"><span className="text-blue-400">get_ticket_status</span><span className="text-surface-500">         # GET /web-form/ticket/{"{id}"} → PostgreSQL lookup</span></p>
          <p className="text-surface-400 mt-1"><span className="text-blue-400">send_web_form_reply</span><span className="text-surface-500">       # SMTP (smtplib) → email reply to customer</span></p>
          <p className="text-yellow-400 mt-2"># SLA by priority</p>
          <p className="text-surface-400"><span className="text-white">urgent</span><span className="text-surface-500">→2h  </span><span className="text-white">high</span><span className="text-surface-500">→4h  </span><span className="text-white">medium</span><span className="text-surface-500">→8h  </span><span className="text-white">low</span><span className="text-surface-500">→24h</span></p>
        </div>
      </div>
    </div>
  );
}
