import React, { useState } from 'react';
import LogoCreator from './components/LogoCreator.jsx';
import ImageArt from './components/ImageArt.jsx';
import SocialMedia from './components/SocialMedia.jsx';
import SEOContent from './components/SEOContent.jsx';
import EmailMarketing from './components/EmailMarketing.jsx';

export default function App() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="container">
      <aside className="sidebar">
        <h1>BrandLab • UkaseAI</h1>
        <div className="nav">
          {['dashboard','logo','image','social','seo','email'].map(k => (
            <button key={k} onClick={() => setTab(k)} className={tab===k?'active':''}>
              {k === 'dashboard' ? 'Dashboard' :
               k === 'logo' ? 'Logo Creator' :
               k === 'image' ? 'Image Art' :
               k === 'social' ? 'Social Media' :
               k === 'seo' ? 'SEO Content' : 'Email Marketing'}
            </button>
          ))}
        </div>
        <div className="card">
          <div className="badge">© BrandLab Powered by UkaseAI</div>
          <p className="muted" style={{marginTop:8}}>Branding is automatically embedded into all outputs.</p>
        </div>
      </aside>
      <main className="main">
        {tab === 'dashboard' && (
          <div className="card">
            <h2>Welcome</h2>
            <p>Use the sidebar to access Logo, Image Art, Social Media, SEO Content, and Email Marketing.</p>
            <p className="muted">All AI outputs include a visible watermark (images) and invisible metadata (text/emails).</p>
          </div>
        )}
        {tab === 'logo' && <LogoCreator />}
        {tab === 'image' && <ImageArt />}
        {tab === 'social' && <SocialMedia />}
        {tab === 'seo' && <SEOContent />}
        {tab === 'email' && <EmailMarketing />}
      </main>
    </div>
  );
}
