import React, { useEffect, useState } from 'react';
import { postJSON } from '../utils/api.js';
import { prompts } from '../utils/prompts.js';
import { saveDraft, loadDraft } from '../utils/storage.js';

export default function ImageArt() {
  const [brief, setBrief] = useState(loadDraft('image.brief','A futuristic cyberpunk city with neon lights and flying cars, digital painting'));
  const [image, setImage] = useState(loadDraft('image.result',''));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(()=> {
    saveDraft('image.brief', brief);
    saveDraft('image.result', image);
  }, [brief, image]);

  async function generate() {
    if (!brief.trim()) return setMsg('Please enter a prompt.');
    setBusy(true); setMsg('Generating image...');
    try {
      const data = await postJSON('/api/ai/image', { prompt: prompts.imageFromPrompt(brief) });
      setImage(data.image);
      setMsg('Image generated and branded.');
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  function download() {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image;
    a.download = 'BrandLab_Image.png';
    a.click();
  }

  return (
    <div className="card">
      <h2>Image Art</h2>
      <textarea rows={3} value={brief} onChange={(e)=>setBrief(e.target.value)} />
      <div className="row" style={{marginTop:8}}>
        <button className="primary" onClick={generate} disabled={busy}>Generate Image</button>
        {image && <button className="secondary" onClick={download}>Download</button>}
      </div>
      {msg && <p className="muted" style={{marginTop:8}}>{msg}</p>}
      {image && <img className="preview" src={image} alt="Generated" style={{marginTop:12}}/>}
    </div>
  );
}
