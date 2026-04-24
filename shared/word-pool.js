// ~200 common English words suitable for typing practice
const WORD_POOL = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
  'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
  'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
  'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
  'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  'any', 'these', 'give', 'day', 'most', 'us', 'great', 'between', 'need',
  'large', 'often', 'hand', 'high', 'place', 'hold', 'turn', 'here', 'why',
  'help', 'talk', 'again', 'point', 'play', 'small', 'number', 'off', 'always',
  'move', 'live', 'name', 'must', 'before', 'down', 'side', 'being', 'stand',
  'real', 'few', 'found', 'still', 'learn', 'plant', 'cover', 'food', 'sun',
  'four', 'between', 'state', 'keep', 'city', 'earth', 'near', 'add', 'away',
  'below', 'country', 'plant', 'last', 'school', 'father', 'keep', 'tree',
  'never', 'start', 'river', 'part', 'once', 'white', 'black', 'right',
  'too', 'mean', 'old', 'left', 'same', 'tell', 'boy', 'follow', 'came',
  'want', 'show', 'also', 'around', 'form', 'three', 'small', 'set', 'put',
  'end', 'does', 'another', 'well', 'large', 'home', 'read', 'hand', 'port',
  'spell', 'air', 'land', 'here', 'song', 'light', 'bring', 'think', 'both',
  'head', 'under', 'story', 'saw', 'left', 'late', 'run', 'while', 'press',
  'close', 'night', 'real', 'life', 'few', 'north', 'open', 'seem', 'together',
  'next', 'white', 'children', 'begin', 'got', 'walk', 'example', 'ease', 'paper',
  'group', 'always', 'music', 'those', 'both', 'mark', 'book', 'letter', 'until',
];

function generateRandomText(wordCount = 30) {
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
  }
  return words.join(' ');
}

// Generates a practice text heavily biased toward words containing the target characters.
// Uses raw hit count (not density) so words with multiple occurrences of target chars rank highest.
// 90% of slots come from a small focused pool (top 12 words) so the difference is obvious.
function generateTargetedText(targetChars = [], wordCount = 30) {
  if (!targetChars.length) return generateRandomText(wordCount);

  const charSet = new Set(targetChars.map((c) => c.toLowerCase()));

  // Deduplicate the word pool first so rare high-scoring words aren't diluted
  const uniquePool = [...new Set(WORD_POOL)];

  // Score by raw hit count — a word with 3 occurrences of a target char beats one with 1
  const scored = uniquePool
    .map((word) => {
      const hits = [...word].filter((c) => charSet.has(c)).length;
      return { word, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  if (!scored.length) return generateRandomText(wordCount);

  // Keep only the top 12 most relevant words so practice is tightly focused
  const targetPool = scored.slice(0, Math.min(12, scored.length)).map((x) => x.word);

  const targetCount = Math.round(wordCount * 0.9);
  const randomCount = wordCount - targetCount;

  const words = [];
  for (let i = 0; i < targetCount; i++) {
    // Avoid placing the same word twice in a row
    let word;
    let attempts = 0;
    do {
      word = targetPool[Math.floor(Math.random() * targetPool.length)];
      attempts++;
    } while (attempts < 5 && words.length > 0 && words[words.length - 1] === word);
    words.push(word);
  }
  for (let i = 0; i < randomCount; i++) {
    words.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
  }

  // Shuffle so the random filler words are spread throughout
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }

  return words.join(' ');
}

module.exports = { WORD_POOL, generateRandomText, generateTargetedText };
