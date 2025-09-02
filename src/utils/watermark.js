/**
 * Adds a visible watermark (text + logos) to an image using Canvas.
 * @param {string} imageUrl - Base64 or URL of the image.
 * @param {Object} options - Optional settings.
 * @returns {Promise<string>} - Base64 PNG with watermark.
 */
export async function addWatermark(imageUrl, options = {}) {
  const {
    text = '© BrandLab Powered by UkaseAI',
    font = 'bold 20px sans-serif',
    color = 'rgba(255,255,255,0.25)',
    padding = 20,
    logoAppUrl = '/assets/brandlab-logo.png',   // App logo path
    logoCompanyUrl = '/assets/ukaseai-logo.png' // Company logo path
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      // Load logos
      const appLogo = await loadLogo(logoAppUrl);
      const companyLogo = await loadLogo(logoCompanyUrl);

      const logoSize = Math.floor(canvas.width * 0.08);
      const logoY = canvas.height - logoSize - padding;

      // Draw logos side by side
      ctx.globalAlpha = 0.8;
      ctx.drawImage(appLogo, padding, logoY, logoSize, logoSize);
      ctx.drawImage(companyLogo, padding + logoSize + 10, logoY, logoSize, logoSize);
      ctx.globalAlpha = 1;

      // Draw text
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, canvas.width - padding, canvas.height - padding);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = reject;
  });
}

function loadLogo(url) {
  return new Promise((resolve, reject) => {
    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.src = url;
    logo.onload = () => resolve(logo);
    logo.onerror = reject;
  });
}
