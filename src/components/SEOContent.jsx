import React, { useEffect, useState } from 'react';
import { postJSON } from '../utils/api.js';
import { prompts } from '../utils/prompts.js';
import { saveDraft, loadDraft } from '../utils/storage.js';

export default function SEOContent() {
  const [topic, setTopic] = useState(loadDraft('seo.topic', 'The future of remote work'));
  const [keywords, setKeywords] = useState(loadDraft('seo.keywords', 'remote work trends, future of work, productivity'));
  const [outline, setOutline] = useState(loadDraft('seo.outline', ''));
  const [article, setArticle] = useState(loadDraft('seo.article', ''));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    saveDraft('seo.topic', topic);
    saveDraft('seo.keywords', keywords);
    saveDraft('seo.outline', outline);
    saveDraft('seo.article', article);
  }, [topic, keywords, outline, article]);

  async function generateOutline() {
    if (!topic.trim()) return setMsg('Please enter a topic.');
    setBusy(true);
    setMsg('Generating SEO outline...');
    try {
      const data = await postJSON('/api/ai/text', { prompt: prompts.seoOutline(topic, keywords) });
      setOutline(data.text);
      setMsg('Outline generated (metadata embedded server-side).');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function generateArticle() {
    if (!topic.trim()) return setMsg('Please enter a topic.');
    setBusy(true);
    setMsg('Writing SEO article...');
    try {
      const data = await postJSON('/api/ai/text', { prompt: prompts.seoArticle(topic, keywords) });
      setArticle(data.text);
      setMsg('Article generated (metadata embedded server-side).');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  function copy(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setMsg('Copied to clipboard.');
  }

  function download(text, filename) {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <h2>SEO Content</h2>
      <div className="row">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Blog topic" />
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords (comma-separated)" />
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="primary" onClick={generateOutline} disabled={busy}>Generate Outline</button>
        <button className="secondary" onClick={generateArticle} disabled={busy}>Generate Full Article</button>
      </div>
      {msg && <p className="muted" style={{ marginTop: 8 }}>{msg}</p>}

      {outline && (
        <div className="card" style={{ marginTop: 12 }}>
          <h4>Outline</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{outline}</pre>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="secondary" onClick={() => copy(outline)}>Copy</button>
            <button className="secondary" onClick={() => download(outline, 'seo_outline.md')}>Download</button>
          </div>
        </div>
      )}

      {article && (
        <div className="card" style={{ marginTop: 12 }}>
          <h4>Article</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{article}</pre>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="secondary" onClick={() => copy(article)}>Copy</button>
            <button className="secondary" onClick={() => download(article, 'seo_article.md')}>Download</button>
          </div>
        </div>
      )}
    </div>
  );
}
