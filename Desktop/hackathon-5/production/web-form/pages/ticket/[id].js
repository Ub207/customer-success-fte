import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';

const STATUS_STYLES = {
  open:        { bg: 'bg-amber-50',    border: 'border-amber-300',  text: 'text-amber-800',   dot: 'bg-amber-400',   label: 'Open' },
  processing:  { bg: 'bg-blue-50',     border: 'border-blue-300',   text: 'text-blue-800',    dot: 'bg-blue-400',    label: 'Processing' },
  resolved:    { bg: 'bg-emerald-50',  border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Resolved' },
  escalated:   { bg: 'bg-red-50',      border: 'border-red-300',    text: 'text-red-800',     dot: 'bg-red-500',     label: 'Escalated to Human' },
  closed:      { bg: 'bg-surface-50',  border: 'border-surface-300', text: 'text-surface-700', dot: 'bg-surface-400', label: 'Closed' },
};

function IconBolt({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function IconSpinner({ className = 'w-5 h-5' }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function IconRefresh({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  );
}

function IconArrowLeft({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.open;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${s.bg} ${s.border} ${s.text}`} role="status">
      <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}

function MessageBubble({ msg }) {
  const isAgent = msg.role === 'agent';
  return (
    <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'} animate-fade-up`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
          isAgent
            ? 'bg-white border border-surface-200 text-surface-800 shadow-card'
            : 'bg-brand-600 text-white shadow-card'
        }`}
      >
        <p className={`text-xs mb-1 font-medium ${isAgent ? 'text-surface-400' : 'text-brand-200'}`}>
          {isAgent ? 'AI Support Agent' : 'You'} &bull;{' '}
          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ''}
        </p>
        {msg.content}
      </div>
    </div>
  );
}

export default function TicketStatusPage() {
  const router = useRouter();
  const { id } = router.query;

  const [ticket, setTicket]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/web-form/ticket/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTicket(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, API_URL]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  useEffect(() => {
    if (!ticket) return;
    if (ticket.status === 'resolved' || ticket.status === 'closed') return;
    const interval = setInterval(fetchTicket, 15_000);
    return () => clearInterval(interval);
  }, [ticket, fetchTicket]);

  return (
    <>
      <Head>
        <title>Ticket {id ? id.slice(0, 8) : '...'} — TechCorp Support</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-brand-50/50 via-white to-surface-50">
        {/* Header */}
        <header className="bg-white border-b border-surface-100 shadow-xs" role="banner">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm shadow-brand-600/20">
                <IconBolt className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-surface-900 text-lg">TechCorp Support</span>
            </div>
            <a href="/" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded px-2 -mx-2 py-1">
              <IconArrowLeft className="w-4 h-4" />
              New Request
            </a>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-3xl mx-auto px-4 py-3">
          <nav aria-label="Breadcrumb" className="text-xs text-surface-400">
            <ol className="flex items-center gap-1.5">
              <li><a href="/" className="hover:text-surface-700 transition-colors">Home</a></li>
              <li aria-hidden="true">/</li>
              <li><a href="/" className="hover:text-surface-700 transition-colors">Support</a></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-medium text-surface-600">{id ? id.slice(0, 12) : '...'}</li>
            </ol>
          </nav>
        </div>

        <main className="max-w-3xl mx-auto px-4 pb-10">
          {loading && (
            <div className="text-center py-20 text-surface-500" role="status" aria-label="Loading ticket">
              <IconSpinner className="h-8 w-8 text-brand-500 mx-auto mb-4" />
              <p className="text-sm font-medium">Loading ticket...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center animate-fade-up" role="alert">
              <p className="text-red-700 font-medium mb-2">Could not load ticket</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={fetchTicket}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <IconRefresh className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {ticket && !loading && (
            <div className="space-y-6 animate-fade-up">
              {/* Ticket header card */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-surface-400 uppercase tracking-wider mb-1 font-medium">Ticket ID</p>
                    <p className="font-mono text-sm font-semibold text-surface-700 break-all">{id}</p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-surface-400 uppercase tracking-wider font-medium">Channel</p>
                    <p className="font-medium text-surface-700 capitalize">{ticket.channel?.replace('_', ' ') || 'Web Form'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 uppercase tracking-wider font-medium">Created</p>
                    <p className="font-medium text-surface-700">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '—'}
                    </p>
                  </div>
                  {ticket.last_updated && (
                    <div>
                      <p className="text-xs text-surface-400 uppercase tracking-wider font-medium">Last Update</p>
                      <p className="font-medium text-surface-700">{new Date(ticket.last_updated).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100" role="status">
                    <IconSpinner className="w-3.5 h-3.5 text-blue-500" />
                    Auto-refreshing every 15 seconds...
                  </div>
                )}
              </div>

              {/* Conversation thread */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-6">
                <h2 className="text-sm font-semibold text-surface-700 mb-4">Conversation</h2>
                {ticket.messages && ticket.messages.length > 0 ? (
                  <div className="space-y-4" role="list" aria-label="Conversation messages">
                    {ticket.messages.map((msg, i) => (
                      <div key={msg.id || i} role="listitem">
                        <MessageBubble msg={msg} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-surface-400 text-center py-6">
                    Your message has been received. Our AI agent is reviewing it now.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  Submit Another Request
                </a>
                <button
                  onClick={fetchTicket}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-surface-200 text-surface-700 text-sm font-medium rounded-xl hover:bg-surface-50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  <IconRefresh className="w-4 h-4" />
                  Refresh Now
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="text-center pb-8 text-xs text-surface-400" role="contentinfo">
          <p>
            Need immediate help?{' '}
            <a href="mailto:support@techcorp.io" className="text-brand-500 hover:text-brand-600 underline underline-offset-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded">
              support@techcorp.io
            </a>
          </p>
          <p className="mt-1">&copy; {new Date().getFullYear()} TechCorp SaaS. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
