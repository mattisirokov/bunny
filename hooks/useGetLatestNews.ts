import { useState } from "react";

const LOCATION = "PALERMO";
const API_KEY = process.env.EXPO_PUBLIC_PERPLEXITY_API_KEY;
const CHAT_URL = "https://api.perplexity.ai/chat/completions";

interface UseGetLatestNewsReturn {
  isLoading: boolean;
  error: Error | null;
  data: string | null;
  fetchNews: () => Promise<void>;
}

export const useGetLatestNews = (): UseGetLatestNewsReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<string | null>(null);

  const fetchNews = async () => {
    if (!API_KEY) {
      setError(
        new Error("PERPLEXITY_API_KEY is not set in environment variables")
      );
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Craft a prompt that asks for recent, individual news articles with variety
      const prompt = `Find 10 diverse and recent news articles from ${LOCATION} (Palermo, Italy) from today or the past few days. 

CRITICAL REQUIREMENTS:
- Each article must be about a DIFFERENT topic/subject - ensure maximum variety
- Cover different categories: politics, crime, culture, sports, economy, local events, social issues, etc.
- Do NOT include multiple articles about the same story or event
- Only include individual news articles, not generic news source pages
- Articles must be from today or very recent (within the last 3-7 days)
- Include articles in any language (Italian, English, etc.)
- Each article should be a specific news story, not a news index page
- Prioritize unique stories that are different from each other

For each article, provide:
1. Title of the article
2. A brief excerpt/description (2-3 sentences)
3. The source website name
4. The full URL
5. Publication date if available

Format your response as a JSON array with this structure:
[
  {
    "title": "Article title",
    "excerpt": "Brief description of the article",
    "source": "website.com",
    "url": "https://full-url.com/article",
    "date": "YYYY-MM-DD"
    "category": "politics", "crime", "culture", "sports", "economy", "local events", "social issues", etc.
  }
]

Only return the JSON array, no additional text.`;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from API");
      }

      // Return the raw content as-is
      setData(content);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch news"));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    data,
    fetchNews,
  };
};
