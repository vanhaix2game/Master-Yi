const EMOJI_PATTERN = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu;
const QUOTES_PATTERN = /[\u2018\u2019\u201C\u201D\u201E\u201F\u2039\u203A]/g;
const DASH_PATTERN = /[\u2013\u2014\u2015]/g;
const MULTI_WHITESPACE = /[ \t]+/g;
const MULTI_NEWLINE = /\n{3,}/g;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

export function normalizeUnicode(input: string): string {
  return input
    .normalize('NFC')
    .replace(ZERO_WIDTH, '')
    .replace(EMOJI_PATTERN, (m) => emojiToText(m))
    .replace(QUOTES_PATTERN, "'")
    .replace(DASH_PATTERN, '—')
    .replace(MULTI_WHITESPACE, ' ')
    .replace(MULTI_NEWLINE, '\n\n')
    .trim();
}

const emojiMap: Record<string, string> = {
  '🐛': '[bug]',
  '🚀': '[deploy]',
  '✅': '[done]',
  '❌': '[fail]',
  '⚠️': '[warn]',
  '🔧': '[fix]',
  '📝': '[doc]',
  '🎮': '[game]',
  '🖥️': '[ui]',
  '🔒': '[security]',
  '⚡': '[perf]',
  '🧪': '[test]',
  '📦': '[package]',
  '🔄': '[refresh]',
  '✨': '[new]',
  '🔥': '[critical]',
  '💻': '[code]',
  '📄': '[file]',
  '🔍': '[search]',
  '🎯': '[target]',
};

function emojiToText(emoji: string): string {
  return emojiMap[emoji] || '';
}

export function isCJK(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4E00 && code <= 0x9FFF) ||
    (code >= 0x3040 && code <= 0x309F) ||
    (code >= 0x30A0 && code <= 0x30FF) ||
    (code >= 0xAC00 && code <= 0xD7AF) ||
    (code >= 0x3400 && code <= 0x4DBF) ||
    (code >= 0x2E80 && code <= 0x2EFF) ||
    (code >= 0x31F0 && code <= 0x31FF)
  );
}

export function detectLanguage(input: string): string {
  let cjkCount = 0;
  let latinCount = 0;
  let vietnameseCount = 0;

  const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

  for (const ch of input) {
    if (isCJK(ch)) cjkCount++;
    else if (/[a-zA-Z]/.test(ch)) {
      latinCount++;
      if (vietnameseChars.test(ch)) vietnameseCount++;
    }
  }

  const total = cjkCount + latinCount || 1;

  if (cjkCount > latinCount && cjkCount > total * 0.3) return 'mixed-asian';
  if (vietnameseCount > latinCount * 0.15) return 'vietnamese';
  if (cjkCount > 0 && cjkCount < total * 0.1) return 'mixed';
  return 'english';
}
