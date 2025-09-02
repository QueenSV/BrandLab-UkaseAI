# BrandLab • Powered by UkaseAI

Deploy steps:
1) npm install
2) cd functions && npm install && cd ..
3) Place logos:
   - public/assets/brandlab-logo.png
   - public/assets/ukaseai-logo.png
   - functions/assets/brandlab-logo.png
   - functions/assets/ukaseai-logo.png
4) Set secrets:
   - firebase functions:config:set ai.key="YOUR_GEMINI_API_KEY"
   - firebase functions:config:set email.provider="sendgrid" email.sendgrid_api_key="YOUR_SENDGRID_KEY" email.from="BrandLab <no-reply@yourdomain>"
   - firebase functions:config:set brand.unsubscribe_url="https://yourdomain/unsubscribe" brand.address="Your Company, Tokyo, Japan"
5) npm run build
6) firebase deploy

Endpoints:
- POST /api/ai/text { prompt }
- POST /api/ai/image { prompt }
- POST /api/tts { text }
- POST /api/email/send { campaign, recipients, dryRun? }

Branding is automatic (watermarks + metadata) on images, text, and email content.
