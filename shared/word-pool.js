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

module.exports = { WORD_POOL, generateRandomText };
