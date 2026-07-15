// Recovery words: generation, normalization, hashing.
//
// The list is exactly 256 words (one random byte maps to one word), curated
// to be simple, concrete, and calm — nothing violent, medical, legal, or
// frightening; no near-homophones. Six words = 48 bits, which with server-side
// bcrypt and a 5-attempts-per-hour limit is far beyond guessable.
//
// The phrase never leaves the device: only its SHA-256 hex goes to the server.

// prettier-ignore
export const RECOVERY_WORDS: readonly string[] = [
  "apple", "bread", "honey", "lemon", "olive", "peach", "plum", "grape", "melon", "berry", "mango", "corn", "rice", "bean", "soup", "tea",
  "table", "chair", "lamp", "door", "window", "garden", "kitchen", "pillow", "blanket", "candle", "basket", "bottle", "spoon", "plate", "cup", "bowl",
  "tree", "leaf", "branch", "root", "seed", "flower", "petal", "grass", "moss", "fern", "pine", "oak", "maple", "cedar", "willow", "ivy",
  "river", "lake", "ocean", "wave", "shore", "sand", "pebble", "stone", "cliff", "hill", "valley", "meadow", "field", "forest", "island", "harbor",
  "rain", "cloud", "mist", "snow", "frost", "breeze", "wind", "sky", "sun", "moon", "star", "dawn", "dusk", "sunset", "rainbow", "season",
  "bird", "robin", "sparrow", "owl", "dove", "swan", "duck", "goose", "heron", "finch", "wren", "crane", "gull", "lark", "jay", "crow",
  "horse", "pony", "sheep", "lamb", "goat", "cow", "calf", "deer", "fawn", "rabbit", "squirrel", "otter", "beaver", "badger", "mole", "fox",
  "music", "song", "piano", "violin", "flute", "drum", "bell", "chime", "melody", "rhythm", "chorus", "tune", "harp", "cello", "banjo", "note",
  "paper", "pencil", "crayon", "ink", "letter", "stamp", "ribbon", "thread", "yarn", "button", "fabric", "wool", "cotton", "silk", "linen", "quilt",
  "green", "blue", "yellow", "orange", "purple", "pink", "brown", "gray", "silver", "gold", "amber", "coral", "teal", "ivory", "cream", "violet",
  "morning", "evening", "spring", "summer", "autumn", "winter", "harvest", "picnic", "holiday", "birthday", "journey", "voyage", "travel", "path", "trail", "bridge",
  "circle", "square", "corner", "spiral", "ripple", "pattern", "puzzle", "mosaic", "marble", "crystal", "prism", "mirror", "shadow", "echo", "glow", "light",
  "boat", "sail", "anchor", "canoe", "paddle", "ferry", "train", "wagon", "bicycle", "engine", "wheel", "compass", "map", "globe", "lantern", "tunnel",
  "clock", "drawer", "shelf", "cabin", "cottage", "porch", "fence", "gate", "barn", "mill", "tower", "castle", "palace", "museum", "library", "market",
  "sugar", "salt", "vanilla", "ginger", "pepper", "basil", "mint", "sage", "thyme", "clover", "lilac", "daisy", "tulip", "rose", "lily", "poppy",
  "pocket", "jacket", "mitten", "scarf", "sweater", "sandal", "slipper", "apron", "canvas", "easel", "brush", "palette", "sketch", "mural", "statue", "fountain",
];

export const PHRASE_LENGTH = 6;

/** Six random words, drawn with the platform CSPRNG. */
export function generatePhrase(): string {
  const bytes = new Uint8Array(PHRASE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => RECOVERY_WORDS[b]).join(" ");
}

/** Forgiving normalization: case, stray spaces, and line breaks don't matter. */
export function normalizePhrase(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

/** SHA-256 hex of the normalized phrase — the only thing the server ever sees. */
export async function hashPhrase(input: string): Promise<string> {
  const data = new TextEncoder().encode(normalizePhrase(input));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
