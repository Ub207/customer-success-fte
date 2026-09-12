/**
 * SupportForm — Upgraded SaaS-style UI
 * Style: Clean, modern, Stripe/Linear inspired.
 * Fields: Name, Email, Subject, Category, Message
 * UX: Inline validation, accessible labels, focus management, loading states
 */
import { useState, useRef } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: '',          label: 'Select a category' },
  { value: 'general',   label: 'General Question' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing',   label: 'Billing & Payments' },
  { value: 'account',   label: 'Account & Login' },
  { value: 'bug',       label: 'Bug Report' },
  { value: 'feedback',  label: 'Feedback' },
  { value: 'other',     label: 'Other' },
];

const INITIAL_STATE = {
  name: '',
  email: '',
  subject: '',
  category: '',
  message: '',
};

const MAX_MESSAGE_LENGTH = 2000;

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function IconExclamationCircle({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  );
}

function IconCheck({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconArrowRight({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

function IconChevronDown({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 7.5l5 5 5-5" />
    </svg>
  );
}

function IconSpinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── UI Components ───────────────────────────────────────────────────────────

function Label({ htmlFor, children, hint, required }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-surface-700">
        {children}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {hint && <span className="text-[11px] text-surface-400 font-normal">{hint}</span>}
    </div>
  );
}

const inputClasses = (error) => `
  block w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-200
  placeholder:text-surface-400 focus:outline-none focus:ring-2
  ${error
    ? 'border-red-300 bg-red-50/30 text-red-900 focus:ring-red-500/15 focus:border-red-400'
    : 'border-surface-200 bg-white text-surface-900 focus:ring-brand-500/15 focus:border-brand-400 hover:border-surface-300 shadow-xs'
  }
`;

function FieldError({ id, msg }) {
  if (!msg) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500 animate-fade-up">
      <IconExclamationCircle className="w-3.5 h-3.5 shrink-0" />
      {msg}
    </p>
  );
}

function SuccessScreen({ ticketId, eta, onReset }) {
  return (
    <div className="animate-fade-up flex flex-col items-center text-center py-6">
      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 shadow-glow-green">
        <IconCheck className="w-5 h-5 text-emerald-600" />
      </div>

      <h3 className="text-lg font-bold text-surface-900 mb-2">Request received</h3>
      <p className="text-sm text-surface-500 mb-8 max-w-[280px] leading-relaxed">
        Our support team has been notified. We usually reply in {eta}.
      </p>

      <div className="w-full bg-surface-50 border border-surface-200 rounded-xl p-4 mb-8 text-left">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] uppercase tracking-wider text-surface-400 font-bold">Ticket Reference</p>
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-soft" aria-hidden="true" />
        </div>
        <p className="font-mono text-sm font-semibold text-brand-600 break-all">{ticketId}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          onClick={() => window.location.href = `/ticket/${ticketId}`}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Track Status
          <IconArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onReset}
          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          New Ticket
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SupportForm({ apiUrl = '/api/support/submit' }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState('');
  const [touched, setTouched] = useState({});
  const firstErrorRef = useRef(null);

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2)
      e.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'Enter a valid email address.';
    if (form.subject.trim().length < 5)
      e.subject = 'Subject is too short (min 5 chars).';
    if (!form.category)
      e.category = 'Please select a category.';
    if (form.message.trim().length < 10)
      e.message = 'Please provide more details (min 10 chars).';
    if (form.message.length > MAX_MESSAGE_LENGTH)
      e.message = `Max ${MAX_MESSAGE_LENGTH} characters allowed.`;
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const validationErrors = validate();
    if (validationErrors[name]) {
      setErrors(prev => ({ ...prev, [name]: validationErrors[name] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({ name: true, email: true, subject: true, category: true, message: true });
      const firstErrorField = Object.keys(validationErrors)[0];
      const el = document.getElementById(firstErrorField);
      if (el) el.focus();
      return;
    }

    setSubmitting(true);
    setApiError('');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, priority: 'medium' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong. Please try again.');
      }
      setResult(data);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setForm(INITIAL_STATE);
    setErrors({});
    setTouched({});
    setApiError('');
  };

  if (result) {
    return (
      <SuccessScreen
        ticketId={result.ticket_id}
        eta={result.estimated_response_time || '5-10 minutes'}
        onReset={handleReset}
      />
    );
  }

  const showError = (field) => touched[field] && errors[field];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 animate-fade-up" aria-label="Support ticket form">

      {/* Global API Error */}
      {apiError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 animate-fade-up">
          <IconExclamationCircle className="mt-0.5 w-4 h-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-800 leading-tight">{apiError}</p>
        </div>
      )}

      {/* Row: Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" required>Full Name</Label>
          <input
            id="name" name="name" type="text"
            value={form.name} onChange={handleChange} onBlur={handleBlur}
            placeholder="Jane Smith" autoComplete="name" required
            aria-invalid={!!showError('name')} aria-describedby={showError('name') ? 'error-name' : undefined}
            className={inputClasses(showError('name'))}
          />
          <FieldError id="error-name" msg={showError('name')} />
        </div>
        <div>
          <Label htmlFor="email" required>Email Address</Label>
          <input
            id="email" name="email" type="email"
            value={form.email} onChange={handleChange} onBlur={handleBlur}
            placeholder="jane@example.com" autoComplete="email" required
            aria-invalid={!!showError('email')} aria-describedby={showError('email') ? 'error-email' : undefined}
            className={inputClasses(showError('email'))}
          />
          <FieldError id="error-email" msg={showError('email')} />
        </div>
      </div>

      {/* Subject */}
      <div>
        <Label htmlFor="subject" required>Subject</Label>
        <input
          id="subject" name="subject" type="text"
          value={form.subject} onChange={handleChange} onBlur={handleBlur}
          placeholder="What's your request about?" required
          aria-invalid={!!showError('subject')} aria-describedby={showError('subject') ? 'error-subject' : undefined}
          className={inputClasses(showError('subject'))}
        />
        <FieldError id="error-subject" msg={showError('subject')} />
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category" required>Category</Label>
        <div className="relative">
          <select
            id="category" name="category"
            value={form.category} onChange={handleChange} onBlur={handleBlur}
            aria-invalid={!!showError('category')} aria-describedby={showError('category') ? 'error-category' : undefined}
            className={`${inputClasses(showError('category'))} appearance-none pr-10`}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value} disabled={cat.value === ''}>
                {cat.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5" aria-hidden="true">
            <IconChevronDown className="w-3.5 h-3.5 text-surface-400" />
          </div>
        </div>
        <FieldError id="error-category" msg={showError('category')} />
      </div>

      {/* Message */}
      <div>
        <Label htmlFor="message" required hint={`${form.message.length}/${MAX_MESSAGE_LENGTH}`}>
          Message
        </Label>
        <textarea
          id="message" name="message" rows={5}
          value={form.message} onChange={handleChange} onBlur={handleBlur}
          placeholder="Tell us more about your issue..." required
          aria-invalid={!!showError('message')} aria-describedby={showError('message') ? 'error-message' : undefined}
          className={`${inputClasses(showError('message'))} resize-none leading-relaxed`}
        />
        <FieldError id="error-message" msg={showError('message')} />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
        >
          {submitting ? (
            <>
              <IconSpinner className="w-4 h-4 text-white" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Send Request</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

    </form>
  );
}
