// Escapes text before it's interpolated into an innerHTML template string.
// Used everywhere user-typed input (search terms) or database content (quote
// text, book titles/authors/descriptions) gets rendered, so neither a visitor
// nor anything ever written to the database can inject markup/scripts.
const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}
