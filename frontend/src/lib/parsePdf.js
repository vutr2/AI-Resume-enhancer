// Extract plain text from a PDF buffer using unpdf (serverless-safe pdfjs build,
// no browser APIs like DOMMatrix or @napi-rs/canvas required)
export async function extractPdfText(buffer) {
  const { extractText } = await import('unpdf');
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
  return text || '';
}
