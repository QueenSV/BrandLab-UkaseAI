export const prompts = {
  brandNames: (idea) => `
Act as a branding expert. Generate 5 short, modern brand names for: "${idea}".
Return a JSON array of strings only.
`,
  logoConcepts: (idea, name) => `
Act as a branding expert. Create 3 logo concepts for "${idea}"${name ? ` with brand name "${name}"` : ''}.
Each concept must include:
- "logoDescription": a brief evocative description
- "slogan": a catchy slogan
Return a JSON array of objects with keys "logoDescription" and "slogan" only.
`,
  logoImagePrompt: (desc) => `
A high-quality, minimal, professional, vector-style icon representing: "${desc}".
No text or letters in the image. Simple, clean, centered.
`,
  imageFromPrompt: (p) => `${p}`,
  socialPost: (platform, topic) => `
Generate a ${platform}-ready post for: "${topic}".
- Tone appropriate to ${platform}
- Include relevant hashtags
Return ONLY the post content (no title).`,
  seoOutline: (topic, keywords) => `
Create a detailed SEO blog outline for "${topic}" using keywords: ${keywords || 'none'}.
Include intro, 3-4 sections with sub-headings, and conclusion.
Return markdown-like text (no headings like ##, just bold for titles).`,
  seoArticle: (topic, keywords) => `
Write a complete SEO blog post for "${topic}" using keywords: ${keywords || 'none'}.
Use bold for section titles (no # marks). Return only the content, no extra commentary.`,
  emailDrafts: (brief) => `
Act as an email copywriter.
From this brief: "${brief}"
Return JSON with:
{
  "subjects": ["...", "...", "...", "...", "..."],
  "bodies": [
    {"label":"Short","html":"<p>...</p>"},
    {"label":"Standard","html":"<p>...</p>"},
    {"label":"Long","html":"<p>...</p>"}
  ],
  "ctaIdeas": ["...", "...", "..."]
}
Keep HTML simple (p, a, strong, br).`
};
