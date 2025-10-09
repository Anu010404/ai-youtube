export const getUnsplashImage = async (query: string) => {
  const imageResponseRaw = await fetch(
    `https://api.unsplash.com/search/photos?per_page=1&query=${query}&client_id=${process.env.UNSPLASH_API_KEY}`,
    {
      signal: AbortSignal.timeout(20000), // Add a 20-second timeout
    }
  );
  const imageResponse = await imageResponseRaw.json();
  if (!imageResponse.results || imageResponse.results.length === 0) {
    // Return a fallback image if no results are found
    return "https://images.unsplash.com/photo-1593642532400-2682810df593?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80";
  }
  return imageResponse.results[0].urls.small_s3;
};