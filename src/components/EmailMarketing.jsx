import React, { useEffect, useMemo, useState } from 'react';
import { postJSON } from '../utils/api.js';
import { prompts } from '../utils/prompts.js';
import { saveDraft, loadDraft } from '../utils/storage.js';
import { appendTextMetadata } from '../utils/metadata.js';

export default function EmailMarketing() {
  const [brief, setBrief] = useState(loadDraft('email.brief', 'Invite prospects to try BrandLab beta. Target: startup founders. Tone: friendly, concise, value-focused.'));
  const [suggestions, setSuggestions] = useState(loadDraft('email.suggestions', null)); // {subjects:[], bodies:[{label,html}], ctaIdeas:[]}
  const [subject, setSubject] = useState(loadDraft('email.subject', 'An invite just for you, {first_name}'));
  const [body, setBody] = useState(loadDraft('email.body', '<p>Hi {first_name},</p><p>We built BrandLab to help you ...</p><p><a href="https://yourdomain">Try it</a></p>'));
  const [recipientsText, setRecipientsText] = useState(loadDraft('email.recipientsText', 'alice@example.com,Alice,Kimura,Acme\nbob@example.com,Bob,,Acme'));
  const [recipients, setRecipients] = useState(loadDraft('email.recipients', []));
  const [status, setStatus] = useState(loadDraft('email.status', null)); // { queued, failed: [] }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    saveDraft('email.brief', brief);
    saveDraft('email.suggestions', suggestions);
    saveDraft('email.subject', subject);
    saveDraft('email.body', body);
    saveDraft('email.recipientsText', recipientsText);
    saveDraft('email.recipients', recipients);
    saveDraft('email.status', status);
  }, [brief, suggestions, subject, body, recipientsText, recipients, status]);

  const parsedRecipients = useMemo(() => {
    const out = parseRecipients(recipientsText);
    return out;
  }, [recipientsText]);

  async function getAISuggestions() {
    if (!brief.trim()) return setMsg('Please describe your campaign brief.');
    setBusy(true);
    setMsg('Generating subjects and body variants...');
    try {
      const data = await postJSON('/api/ai/text', {
        prompt: prompts.emailDrafts(brief),
        responseMimeType: 'application/json'
      });
      const parsed = safeJSON(data.text, null);
      if (!parsed || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.bodies)) {
        throw new Error('Unexpected AI response. Please try again.');
      }
      setSuggestions(parsed);
      setMsg('Suggestions ready — pick a subject and a body.');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  function useSuggestion(subj, bodyHtml) {
    if (subj) setSubject(subj);
    if (bodyHtml) setBody(bodyHtml);
  }

  function importRecipients() {
    setRecipients(parsedRecipients.valid);
    setMsg(`Imported ${parsedRecipients.valid.length} recipients. ${parsedRecipients.invalid.length > 0 ? parsedRecipients.invalid.length + ' invalid skipped.' : ''}`);
  }

  async function testSend() {
    const to = recipients[0] || parsedRecipients.valid[0];
    if (!to) return setMsg('Please import at least one valid recipient first.');
    setBusy(true);
    setMsg('Queuing test email (dry run)...');
    try {
      const campaign = {
        subject: subject,
        body: appendTextMetadata(body)
      };
      const data = await postJSON('/api/email/send', {
        campaign,
        recipients: [to],
        dryRun: true
      });
      setStatus(data);
      setMsg('Test queued (dry run). Switch off dryRun in code to send real email.');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function bulkSend() {
    if (recipients.length === 0) return setMsg('Please import recipients first.');
    setBusy(true);
    setMsg(`Queuing ${recipients.length} emails...`);
    try {
      const campaign = {
        subject: subject,
        body: appendTextMetadata(body)
      };
      const data = await postJSON('/api/email/send', {
        campaign,
        recipients,
        // Set dryRun: false to send real emails after you configure SendGrid
        dryRun: false
      });
      setStatus(data);
      setMsg(`Queued ${data.queued}, Failed ${data.failed.length}`);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  function previewPersonalization(sampleIndex = 0) {
    const list = recipients.length ? recipients : parsedRecipients.valid;
    if (list.length === 0) return { subject: subject, html: body };
    const vars = tokensFor(list[Math.min(sampleIndex, list.length - 1)]);
    return {
      subject: mergeTokens(subject, vars),
      html: mergeTokens(body, vars)
    };
  }

  function exportStatusCSV() {
    if (!status) return;
    const lines = ['email,status,reason'];
    const successes = (status.queuedEmails || []).map((e) => `${e},sent,`);
    const failed = (status.failed || []).map((f) => `${f.email},failed,${(f.reason || '').replace(/,/g, ';')}`);
    const all = [...successes, ...failed];
    const blob = new Blob([lines.concat(all).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email_send_status.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const sample = previewPersonalization(0);

  return (
    <>
      <div className="card">
        <h2>Email Marketing</h2>
        <p className="muted">Use AI to draft, personalize with tokens, import recipients, preview, and send.</p>

        <h3 style={{ marginTop: 8 }}>1) Campaign brief</h3>
        <textarea rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Goal, audience, tone, CTA..." />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="primary" onClick={getAISuggestions} disabled={busy}>Suggest Subjects & Bodies (AI)</button>
        </div>

        {suggestions && (
          <div className="card" style={{ marginTop: 12 }}>
            <h4>AI Suggestions</h4>
            <div className="grid" style={{ marginTop: 8 }}>
              <div className="card">
                <strong>Subjects</strong>
                <ul style={{ paddingLeft: 16 }}>
                  {suggestions.subjects.map((s, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ flex: 1 }}>{s}</span>
                        <button className="secondary" onClick={() => useSuggestion(s, null)}>Use</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <strong>Body Variants</strong>
                <ul style={{ paddingLeft: 16 }}>
                  {suggestions.bodies.map((b, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <span><span className="badge">{b.label}</span></span>
                        <button className="secondary" onClick={() => useSuggestion(null, b.html)}>Use</button>
                      </div>
                      <div className="muted" dangerouslySetInnerHTML={{ __html: b.html }} style={{ marginTop: 6 }} />
                    </li>
                  ))}
                </ul>
              </div>
              {!!(suggestions.ctaIdeas?.length) && (
                <div className="card">
                  <strong>CTA ideas</strong>
                  <ul style={{ paddingLeft: 16 }}>
                    {suggestions.ctaIdeas.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <h3 style={{ marginTop: 16 }}>2) Finalize subject & body</h3>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (supports tokens like {first_name}, {company})" />
        <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="HTML body (supports tokens like {first_name}, {company}, {unsubscribe_url})" />

        <h3 style={{ marginTop: 16 }}>3) Recipients</h3>
        <p className="muted">Paste CSV (email,first_name,last_name,company) or one email per line. Example: alice@example.com,Alice,Kimura,Acme</p>
        <textarea rows={6} value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)} />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="secondary" onClick={importRecipients}>Import</button>
          <div style={{ alignSelf: 'center' }} className="muted">
            Valid: {parsedRecipients.valid.length}, Invalid: {parsedRecipients.invalid.length}
          </div>
        </div>

        <h3 style={{ marginTop: 16 }}>4) Preview personalization</h3>
        <div className="card">
          <strong>Subject preview</strong>
          <div style={{ marginTop: 4 }}>{sample.subject}</div>
          <strong style={{ display: 'block', marginTop: 8 }}>Body preview</strong>
          <div className="card" style={{ marginTop: 6 }} dangerouslySetInnerHTML={{ __html: sample.html }} />
        </div>

        <h3 style={{ marginTop: 16 }}>5) Send</h3>
        <div className="row">
          <button className="secondary" onClick={testSend} disabled={busy}>Queue Test (dry run)</button>
          <button className="primary" onClick={bulkSend} disabled={busy || recipients.length === 0}>Send Bulk</button>
        </div>

        {status && (
          <div className="card" style={{ marginTop: 12 }}>
            <h4>Send status</h4>
            <p className="muted">Queued: {status.queued}, Failed: {status.failed?.length || 0}</p>
            {(status.failed?.length || 0) > 0 && (
              <ul style={{ paddingLeft: 16 }}>
                {status.failed.map((f, i) => (
                  <li key={i}>{f.email}: {f.reason}</li>
                ))}
              </ul>
            )}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="secondary" onClick={exportStatusCSV}>Export CSV</button>
            </div>
          </div>
        )}

        {msg && <p className="muted" style={{ marginTop: 12 }}>{msg}</p>}
      </div>
    </>
  );
}

// Helpers

function safeJSON(text, fallback) {
  try { return JSON.parse(text); } catch { return fallback; }
}

function parseRecipients(raw) {
  const lines = (raw || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const valid = [];
  const invalid = [];
  for (const line of lines) {
    const parts = line.split(',').map((s) => s.trim());
    let email = parts[0] || '';
    let first_name = parts[1] || '';
    let last_name = parts[2] || '';
    let company = parts[3] || '';
    if (!isValidEmail(email)) {
      invalid.push({ line, reason: 'Invalid email' });
      continue;
    }
    valid.push({ email, first_name, last_name, company });
  }
  // de-dup by email
  const uniqMap = new Map();
  for (const r of valid) {
    if (!uniqMap.has(r.email)) uniqMap.set(r.email, r);
  }
  return { valid: Array.from(uniqMap.values()), invalid };
}

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function tokensFor(rec) {
  return {
    first_name: rec.first_name || '',
    last_name: rec.last_name || '',
    company: rec.company || '',
    unsubscribe_url: '{unsubscribe_url}'
  };
}

function mergeTokens(template, vars) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));
}
