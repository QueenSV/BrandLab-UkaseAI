/**
 * Appends invisible metadata to text content.
 * For HTML: adds meta tag or HTML comment.
 * For plain text: appends comment-like signature.
 */
export function appendTextMetadata(content, type = 'html') {
  const signature = '© BrandLab Powered by UkaseAI';
  if (type === 'html') {
    return `${content}\n<!-- ${signature} -->`;
  }
  if (type === 'markdown') {
    return `${content}\n\n[//]: # (${signature})`;
  }
  return `${content}\n\n${signature}`;
}
