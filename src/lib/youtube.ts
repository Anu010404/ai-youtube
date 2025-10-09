import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_TRANSCRIPT_LENGTH = 5000; // Roughly 5000 characters, adjust as needed for token limits

export type YouTubeSearchResult = {
  id: string;
  title: string;
  description: string;
};

type YouTubeSearchItem = {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
  };
};

type YouTubeVideoStatsItem = {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
  };
  statistics: {
    viewCount: string;
    likeCount?: string; // likeCount can be disabled
  };
};

/**
 * Searches YouTube for videos based on a query.
 * @param searchQuery The search term.
 * @returns A promise that resolves to an array of video search results or null if an error occurs.
 */
export async function searchYouTube(searchQuery: string): Promise<YouTubeSearchResult[] | null> {
    searchQuery = encodeURIComponent(searchQuery);
    console.count("youtube search");
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_API_KEY}&q=${searchQuery}&videoDuration=medium&videoEmbeddable=true&type=video&part=snippet&maxResults=10`
    );
    const json = await response.json();
    if (!json.items) {
      console.error("YouTube API did not return any items. Response:", JSON.stringify(json, null, 2));
      return null;
    }
    return json.items.map((item: YouTubeSearchItem) => {
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        // The search result doesn't contain stats, so we'll fetch them in getRankedVideos
      };
    });
}

/**
 * Fetches the transcript for a given YouTube video ID.
 * @param videoId The ID of the YouTube video.
 * @returns A promise that resolves to the transcript text or null if not available.
 */
export async function getTranscript(videoId: string): Promise<string | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
      country: "EN",
    });
    return transcript.map((t) => t.text).join(" ");
  } catch (error) {
    console.error(`Could not get transcript for video ${videoId}:`, error);
    return null;
  }
}

/**
 * Generates a concise summary from a given text transcript.
 * @param transcript The full text transcript.
 * @returns A promise that resolves to a summary string.
 */
export async function generateSummary(transcript: string): Promise<string> {
  if (!transcript || transcript.trim().length < 100) {
    console.log("Transcript is too short to summarize.");
    return "Could not generate a summary from the provided text.";
  }
  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    console.log("Transcript is too long for summary generation, truncating.");
    transcript = transcript.substring(0, MAX_TRANSCRIPT_LENGTH);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
    const prompt = `Based on the following video transcript, provide a concise, easy-to-read summary.
    Focus on the main points and key takeaways. Present the summary as a few clear paragraphs. Do not mention sponsors or unrelated topics.

    Transcript:\n"${transcript}"`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Failed to generate summary using Gemini:", error);
    return "An error occurred while generating the summary.";
  }
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_API_KEY as string
);

/**
 * Defines the structure for a single multiple-choice question.
 */
export type Question = {
  question: string;
  answer: string;
  options: string[];
};

/**
 * Generates multiple-choice questions based on a given context (transcript or chapter titles) using the Gemini API.
 * Requests a structured JSON output for reliable parsing.
 * @param context The text context (e.g., concatenated transcripts or chapter titles).
 * @param questionCount The number of questions to generate.
 * @returns A promise that resolves to an array of Question objects or an empty array on failure.
 */
export async function generateQuizQuestions(context: string, questionCount: number): Promise<Question[]> {
  if (!context || context.trim().length < 50) {
    console.log("Transcript is too short to generate questions.");
    return [];
  }
  if (context.length > MAX_TRANSCRIPT_LENGTH) {
    console.log("Transcript is too long for question generation, truncating.");
    context = context.substring(0, MAX_TRANSCRIPT_LENGTH);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-latest", generationConfig: { responseMimeType: "application/json" } });
    
    const prompt = `You are a helpful AI that creates educational material.
    Based on the following context, generate exactly ${questionCount} multiple-choice questions to test a user's understanding of the key concepts.
    
    Provide your response as a valid JSON object. The object must contain a single key "questions" which is an array.
    Each element in the array must be an object with three keys: "question", "options", and "answer".
    - "question": A string for the question text.
    - "options": An array of exactly 4 strings representing the choices.
    - "answer": A string that must exactly match one of the values in the "options" array.
    
    Context:
    "${context}"`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsedJson = JSON.parse(responseText);

    if (parsedJson.questions && Array.isArray(parsedJson.questions)) {
        return parsedJson.questions as Question[];
    } else {
        console.error("Failed to parse questions from Gemini response:", responseText);
        return [];
    }
  } catch (error) {
    console.error("Failed to generate questions using Gemini:", error);
    return [];
  }
}

/**
 * Searches YouTube, ranks videos based on a tiered model, and returns the single best video.
 * @param searchQuery The search term.
 * @returns A promise that resolves to the best video object or null if none are found.
 */
export async function getRankedVideos(searchQuery: string) {
  const videos = await searchYouTube(searchQuery);
  if (!videos) {
    return null;
  }

  // --- Constants for Ranking (TUNE THESE VALUES) ---
  const MIN_VIEW_COUNT = 10000;
  const MIN_LIKE_TO_VIEW_RATIO = 0.02;
  // const TOP_N_CANDIDATES_FOR_SENTIMENT = 5; // We will remove sentiment analysis to avoid rate limiting

  const WEIGHT_RATIO = 0.4;
  const WEIGHT_VIEWS = 0.25;
  const WEIGHT_RECENCY = 0.1;
  // const WEIGHT_SENTIMENT = 0.25;

  // --- Step 1: Fetch Video Statistics in the same search call if possible, or a separate one ---
  const videoIds = videos.map((video) => video.id).join(",");
  const statsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?key=${process.env.YOUTUBE_API_KEY}&id=${videoIds}&part=statistics,snippet`,
  );
  const statsJson = await statsResponse.json();
  if (!statsJson.items) {
    return null;
  }

  let initialRankedVideos = statsJson.items
    .map((item: YouTubeVideoStatsItem) => {
      const viewCount = parseInt(item.statistics.viewCount, 10) || 0;
      // Gracefully handle cases where likes are disabled
      const likeCount = parseInt(item.statistics.likeCount || '0', 10);
      const publishedAt = new Date(item.snippet.publishedAt);

      // Tier 1: Basic Thresholds
      if (viewCount < MIN_VIEW_COUNT || (likeCount > 0 && viewCount > 0 && likeCount / viewCount < MIN_LIKE_TO_VIEW_RATIO)) {
        return null;
      }

      // Tier 2: Scoring Model
      const likeToViewRatio = likeCount / viewCount;
      const daysSincePublished = (new Date().getTime() - publishedAt.getTime()) / (1000 * 3600 * 24);
      const recencyMultiplier = Math.max(0, 1 - daysSincePublished / 365); // Full weight for new, 0 for >1yr old

      const score =
        (likeToViewRatio * WEIGHT_RATIO) +
        (Math.log(viewCount) * WEIGHT_VIEWS) +
        (recencyMultiplier * WEIGHT_RECENCY);

      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        score: score,
        sentimentScore: 0, // Default sentiment score
      };
    })
    .filter((v: any): v is NonNullable<typeof v> => v !== null);

  initialRankedVideos.sort((a, b) => b.score - a.score);

  // --- Step 2: Return the top-ranked video without sentiment analysis ---
  // The list is already sorted by score.

  return initialRankedVideos;
}
