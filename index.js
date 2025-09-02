const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const { addWatermarkServer } = require('./utils/watermark');
const { embedImageMetadata, appendTextMetadata } = require('./utils/metadata');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '5mb' }));

// Load config from Firebase Functions environment
const cfg = () => {
  const c = functions.config();
  return {
    aiKey: c.ai && c.ai.key,
    email: {
      provider: c.email && c.email.provider,
      sendgridApiKey: c.email && c.email.sendgrid_api_key,
      from: c.email && c.email.from
    }
  };
};

// --- AI TEXT ---
app.post('/ai/text', async (req, res) => {
  try {
    const { prompt, responseMimeType, responseSchema } = req.body || {};
    if (!prompt) return res.status(400).json({ ok: false, error: 'prompt is required' });

    const { aiKey } = cfg();
    if (!aiKey) return res.status(500).json({ ok: false, error: 'AI key not configured' });

    const model = 'gemini-2.5-flash-preview-05-20';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiKey}`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      ...(responseMimeType || responseSchema
        ? { generationConfig: { responseMimeType, responseSchema } }
        : {})
    };

    const { data } = await axios.post(url, payload, { timeout: 30000 });
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Branding: append invisible metadata
    text = appendTextMetadata(text);

    return res.json({ ok: true, data: { text } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// --- AI IMAGE ---
app.post('/ai/image', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ ok: false, error: 'prompt is required' });

    const { aiKey } = cfg();
    if (!aiKey) return res.status(500).json({ ok: false, error: 'AI key not configured' });

    const model = 'imagen-3.0-generate-002';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${aiKey}`;
    const payload = { instances: { prompt }, parameters: { sampleCount: 1 } };

    const { data } = await axios.post(url, payload, { timeout: 60000 });
    const base64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!base64) throw new Error('No image data returned');

    let imgBuffer = Buffer.from(base64, 'base64');

    // Branding: visible watermark + invisible metadata
    imgBuffer = await addWatermarkServer(imgBuffer);
    imgBuffer = embedImageMetadata(imgBuffer);

    return res.json({
      ok: true,
      data: { image: `data:image/png;base64,${imgBuffer.toString('base64')}` }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// --- EMAIL SEND ---
app.post('/email/send', async (req, res) => {
  try {
    const { campaign, recipients, dryRun } = req.body || {};
    if (!campaign || !Array.isArray(recipients)) {
      return res.status(400).json({ ok: false, error: 'campaign and recipients are required' });
    }

    const conf = cfg();
    if (conf.email.provider !== 'sendgrid' || !conf.email.sendgridApiKey) {
      return res.status(501).json({ ok: false, error: 'Email provider not configured' });
    }

    sgMail.setApiKey(conf.email.sendgridApiKey);

    const queued = [];
    const failed = [];

    if (dryRun) {
      return res.json({ ok: true, data: { queued: recipients.length, failed } });
    }

    for (const r of recipients) {
      try {
        const vars = {
          first_name: r.first_name || '',
          last_name: r.last_name || '',
          company: r.company || '',
          unsubscribe_url: '{unsubscribe_url}'
        };
        const subject = mergeTokens(campaign.subject, vars);
        const htmlBody = appendTextMetadata(mergeTokens(campaign.body, vars));

        await sgMail.send({ to: r.email, from: conf.email.from, subject, html: htmlBody });
        queued.push(r.email);
      } catch (e) {
        failed.push({ email: r.email, reason: e.message });
      }
    }

    return res.json({ ok: true, data: { queued: queued.length, failed } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Helper for token replacement
function mergeTokens(template, vars) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] != null ? String(vars[k]) : ''
  );
}

exports.api = functions.https.onRequest(app);
