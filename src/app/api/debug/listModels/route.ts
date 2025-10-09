import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * This is a temporary debug route to list available Google AI models.
 * You can access it at http://localhost:3000/api/debug/listModels
 */
export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_API_KEY as string;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to list models: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const data = await response.json();
    // We only care about models that support 'generateContent'
    const modelInfo = data.models.filter((m: any) => m.supportedGenerationMethods.includes('generateContent'));

    console.log("--- Available Google AI Models ---");
    console.log(JSON.stringify(modelInfo, null, 2));

    return NextResponse.json({ models: modelInfo });
  } catch (error: any) {
    console.error("--- Error listing models ---", error);
    return new NextResponse(`Error listing models: ${error.message}`, { status: 500 });
  }
}
