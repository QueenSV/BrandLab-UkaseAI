import React, { useEffect, useState } from 'react';
import { postJSON } from '../utils/api.js';
import { prompts } from '../utils/prompts.js';
import { saveDraft, loadDraft } from '../utils/storage.js';

const PLATFORM_OPTIONS = ['Instagram', 'Twitter', 'LinkedIn', 'Facebook', 'Reddit', 'Telegram'];

export default function SocialMedia() {
  const [platform, setPlatform] = useState(loadDraft('social.platform', 'Instagram'));
  const [topic, setTopic] = useState(loadDraft('social.topic', 'Announcing our new AI-powered BrandLab features'));
  const [post, setPost] = useState(loadDraft('social.post', ''));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    saveDraft('social.platform', platform);
    saveDraft('social.topic', topic);
    saveDraft('social.post', post);
  }, [platform, topic, post]);

  async function generate() {
    if (!topic.trim()) return setMsg('Please enter a topic.');
    setBusy(true);
    setMsg('Generating platform-tailored post...');
    try {
      const data = await postJSON('/api/ai/text', { prompt: prompts.socialPost(platform, topic) });
      setPost(data.text);
      setMsg('Post generated (metadata embedded server-side).');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    if (!post) return;
    navigator.clipboard.writeText(post);
    setMsg('Copied post to clipboard.');
  }

  function download() {
    if (!post) return;
    const blob = new Blob([post], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform}_post.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <h2>Social Media Generator</h2>
      <div className="row">
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (e.g., Launching our new feature...)"
        />
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="primary" onClick={generate} disabled={busy}>Generate</button>
        {post && <button className="secondary" onClick={copy}>Copy</button>}
        {post && <button className="secondary" onClick={download}>Download</button>}
      </div>
      {msg && <p className="muted" style={{ marginTop: 8 }}>{msg}</p>}
      {post && (
        <div className="card" style={{ marginTop: 12 }}>
          <h4>Generated Post</h4>
          <div style={{ whiteSpace: 'pre-wrap' }}>{post}</div>
        </div>
      )}
    </div>
  );
}
