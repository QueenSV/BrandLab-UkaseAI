import React, { useEffect, useState } from 'react';
import { postJSON } from '../utils/api.js';
import { prompts } from '../utils/prompts.js';
import { saveDraft, loadDraft } from '../utils/storage.js';

export default function LogoCreator() {
  const [idea, setIdea] = useState(loadDraft('logo.idea','A sustainable coffee brand for young professionals'));
  const [names, setNames] = useState(loadDraft('logo.names', []));
  const [chosenName, setChosenName] = useState(loadDraft('logo.chosenName',''));
  const [concepts, setConcepts] = useState(loadDraft('logo.concepts', []));
  const [chosenConcept, setChosenConcept] = useState(loadDraft('logo.chosenConcept', null));
  const [image, setImage] = useState(loadDraft('logo.image',''));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    saveDraft('logo.idea', idea);
    saveDraft('logo.names', names);
    saveDraft('logo.chosenName', chosenName);
    saveDraft('logo.concepts', concepts);
    saveDraft('logo.chosenConcept', chosenConcept);
    saveDraft('logo.image', image);
  }, [idea, names, chosenName, concepts, chosenConcept, image]);

  const parseJSON = (txt, fallback) => {
    try { return JSON.parse(txt); } catch { return fallback; }
  };

  async function suggestNames() {
    if (!idea.trim()) return setMsg('Please enter a business idea.');
    setBusy(true); setMsg('Generating brand names...');
    try {
      const data = await postJSON('/api/ai/text', { prompt: prompts.brandNames(idea), responseMimeType: 'application/json' });
      const arr = parseJSON(data.text, []);
      setNames(arr);
      setChosenName('');
      setConcepts([]); setChosenConcept(null); setImage('');
      setMsg(`Got ${arr.length} names. Pick one or proceed.`);
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  async function generateConcepts() {
    const subject = chosenName || idea;
    if (!subject.trim()) return setMsg('Enter idea or choose a name.');
    setBusy(true); setMsg('Generating logo concepts...');
    try {
      const data = await postJSON('/api/ai/text', { prompt: prompts.logoConcepts(idea, chosenName), responseMimeType:'application/json' });
      const arr = parseJSON(data.text, []);
      setConcepts(arr);
      setChosenConcept(null);
      setImage('');
      setMsg(`Got ${arr.length} concepts. Choose one to create the logo.`);
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  async function createLogo(concept) {
    setBusy(true); setMsg('Creating logo image...');
    try {
      const data = await postJSON('/api/ai/image', { prompt: prompts.logoImagePrompt(concept.logoDescription) });
      setImage(data.image);
      setChosenConcept(concept);
      setMsg('Logo generated and branded.');
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  function download() {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image;
    a.download = `${chosenName || 'BrandLab_Logo'}.png`;
    a.click();
  }

  return (
    <>
      <div className="card">
        <h2>Logo & Slogan Creator</h2>
        <div className="row">
          <input value={idea} onChange={(e)=>setIdea(e.target.value)} placeholder="Business idea (e.g., sustainable coffee brand)" />
        </div>
        <div className="row" style={{marginTop:12}}>
          <button className="primary" onClick={suggestNames} disabled={busy}>Suggest Brand Names</button>
          <button className="secondary" onClick={generateConcepts} disabled={busy}>Generate Logo Concepts</button>
        </div>
        {msg && <p className="muted" style={{marginTop:8}}>{msg}</p>}
      </div>

      {names?.length > 0 && (
        <div className="card">
          <h3>Suggested Names</h3>
          <div className="grid">
            {names.map((n,i)=>(
              <div key={i} className="card">
                <strong>{n}</strong>
                <div className="row" style={{marginTop:8}}>
                  <button className="primary" onClick={()=> setChosenName(n)}>Select</button>
                </div>
              </div>
            ))}
          </div>
          {chosenName && <p className="muted" style={{marginTop:8}}>Selected: <strong>{chosenName}</strong></p>}
        </div>
      )}

      {concepts?.length > 0 && (
        <div className="card">
          <h3>Branding Concepts {chosenName ? `for "${chosenName}"` : ''}</h3>
          <div className="grid">
            {concepts.map((c,i)=>(
              <div key={i} className="card">
                <strong>{c.slogan}</strong>
                <p className="muted">{c.logoDescription}</p>
                <div className="row" style={{marginTop:8}}>
                  <button className="primary" onClick={()=> createLogo(c)} disabled={busy}>Create this Logo</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {image && (
        <div className="card">
          <h3>Your Logo</h3>
          <img className="preview" src={image} alt="Logo" />
          {chosenName && <h4 style={{marginTop:8}}>{chosenName}</h4>}
          {chosenConcept?.slogan && <p className="muted">{chosenConcept.slogan}</p>}
          <div className="row" style={{marginTop:8}}>
            <button className="primary" onClick={download}>Download PNG</button>
          </div>
        </div>
      )}
    </>
  );
}
