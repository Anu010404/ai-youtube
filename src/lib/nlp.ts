import nlp from "compromise";

// Define stopwords as a constant Set at the module level.
// This improves performance by creating the Set only once, not on every function call.
const CUSTOM_STOPWORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
  "he", "him", "his", "she", "her", "it", "its", "they", "them", "their",
  "what", "which", "who", "whom", "this", "that", "these", "those",
  "am", "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and",
  "but", "if", "or", "because", "as", "until", "while", "of", "at", "by",
  "for", "with", "about", "against", "between", "into", "through", "during",
  "before", "after", "above", "below", "to", "from", "up", "down", "in",
  "out", "on", "off", "over", "under", "again", "further", "then", "once",
  "here", "there", "when", "where", "why", "how", "all", "any", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "s", "t",
  "can", "will", "just", "don", "should", "now", "want", "learn", "like",
  "course", "knowledge", "practical", "project", "projects", "thing",
  "things", "user", "users", "video", "videos", "chapter", "chapters",
  "unit", "units", "topic", "topics", "concept", "concepts"
]);

/**
 * Extracts unique, relevant keywords from a given title and description.
 * It focuses on topics and key nouns, normalizes them, and filters out common stopwords.
 * @param title The course title.
 * @param description The course description.
 * @returns An array of up to 10 unique keywords.
 */
export function extractKeywords(title: string, description: string): string[] {
  const combinedText = `${title}. ${description}`;
  const doc = nlp(combinedText);

  // Extract nouns, including proper nouns and acronyms. Normalize to singular form.
  const keyTerms = doc.match('#Noun+').nouns().toSingular().out('array');

  const allKeywords = keyTerms
    .map(keyword => keyword.toLowerCase().trim())
    // Filter out stopwords, short words, and any purely numeric "keywords"
    .filter(keyword => 
        keyword.length > 2 && 
        !CUSTOM_STOPWORDS.has(keyword) && 
        isNaN(Number(keyword))
    );

  // Filter for unique keywords and take the top 10
  const uniqueKeywords = [...new Set(allKeywords)];
  return uniqueKeywords.slice(0, 10);
}