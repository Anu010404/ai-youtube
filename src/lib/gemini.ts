import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const CHAPTER_SEPARATOR = "---CHAPTER-SEPARATOR---";

// --- Client Initialization ---
// By initializing the client here, we prevent re-creating it on every function call.
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

interface Chapter {
  title: string;
  // you can add other chapter properties here if needed for the prompt
}

interface BatchProcessingOptions {
  /** The initial number of chapters to process in a single batch. Defaults to 4. */
  initialBatchSize?: number;
  /** The Gemini model instance to use. If not provided, a default 'gemini-pro' model will be created. */
  model?: GenerativeModel;
}

/**
 * Generates a prompt for a batch of chapters.
 * @param chapters The batch of chapters.
 * @returns A formatted prompt string.
 */
function createBatchPrompt(chapters: Chapter[]): string {
  const chapterTitles = chapters
    .map((chapter, index) => `${index + 1}. "${chapter.title}"`)
    .join("\n");

  return `
You are an AI assistant tasked with generating content for course chapters.
I will provide a list of chapter titles. For each title, you must generate a concise summary or script.

IMPORTANT: You must provide a response for each and every chapter title provided.
Separate the content for each chapter with the exact separator: "${CHAPTER_SEPARATOR}"

Here are the chapter titles:
${chapterTitles}
`;
}

/**
 * Processes chapters in batches to generate content using the Gemini API,
 * with dynamic batch size adjustment and retries on quota errors.
 *
 * @param chapters An array of chapter objects to process.
 * @param options Configuration options for batch processing.
 * @returns A promise that resolves to an array of generated content strings, one for each chapter.
 */
export async function generateContentForChaptersInBatch(
  chapters: Chapter[],
  options: BatchProcessingOptions = {}
): Promise<string[]> {
  // Use the provided model or create a default one.
  const model =
    options.model ??
    genAI.getGenerativeModel({
      model: "gemini-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        // ... other safety settings
      ],
    });

  const allGeneratedContent: string[] = [];
  let currentBatchSize = options.initialBatchSize ?? 4;
  let i = 0;

  while (i < chapters.length) {
    const batch = chapters.slice(i, i + currentBatchSize);
    const prompt = createBatchPrompt(batch);

    try {
      console.log(`Processing batch of ${batch.length} chapters starting from index ${i}...`);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const generatedForBatch = responseText.split(CHAPTER_SEPARATOR).map(s => s.trim());

      if (generatedForBatch.length !== batch.length) {
        console.warn(`Batch response mismatch. Expected ${batch.length}, got ${generatedForBatch.length}. Reducing batch size and retrying.`);
        // If a batch of 1 fails, something is wrong with that specific item.
        // We should log an error and skip it to prevent an infinite loop.
        if (batch.length === 1) {
            console.error(`Failed to process single chapter: "${batch[0].title}". Skipping.`);
            allGeneratedContent.push(""); // Add a placeholder for the failed chapter.
            i++; // Move to the next chapter.
            continue;
        }
        currentBatchSize = Math.max(1, Math.floor(currentBatchSize / 2));
        // Do not advance `i`, so the smaller batch is retried.
        continue;
      }

      allGeneratedContent.push(...generatedForBatch);
      i += batch.length; // Move to the next batch
      // Optional: If successful, you could consider slightly increasing the batch size again if you want it to be fully dynamic.

    } catch (error: any) {
      // Check for quota-related errors (e.g., 429 Too Many Requests)
      if (error.status === 429 || (error.message && error.message.includes("quota"))) {
        console.warn(`Quota limit hit. Reducing batch size from ${currentBatchSize} to ${Math.max(1, Math.floor(currentBatchSize / 2))}. Retrying...`);
        currentBatchSize = Math.max(1, Math.floor(currentBatchSize / 2)); // Reduce batch size

        if (currentBatchSize < 1) { // Safeguard, should not be reached with Math.max(1, ...)
            throw new Error("Batch size reduced to zero. Aborting to prevent infinite loop.");
        }
        // Do not increment `i`, so the same batch is retried with a smaller size
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
      } else {
        // For other errors, log it and skip the batch to prevent getting stuck
        console.error(`An unexpected error occurred for batch starting at index ${i}:`, error);
        // Push empty strings or error placeholders for the failed batch
        allGeneratedContent.push(...new Array(batch.length).fill(""));
        i += batch.length; // Move to the next batch to avoid an infinite loop
      }
    }
  }

  return allGeneratedContent;
}