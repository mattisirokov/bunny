import { useState } from "react";

const API_KEY = process.env.EXPO_PUBLIC_PERPLEXITY_API_KEY;
const CHAT_URL = "https://api.perplexity.ai/chat/completions";

interface UseTranslateNewsItemReturn {
  isLoading: boolean;
  error: Error | null;
  summary: string | null;
  translateNewsItem: (url: string) => Promise<void>;
}

export const useTranslateNewsItem = (): UseTranslateNewsItemReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const translateNewsItem = async (url: string) => {
    if (!API_KEY) {
      setError(
        new Error("PERPLEXITY_API_KEY is not set in environment variables")
      );
      setIsLoading(false);
      return;
    }

    if (!url) {
      setError(new Error("URL is required"));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSummary(null);

      const prompt = `Read the article at this URL: ${url}

Provide a brief summary (2-3 sentences) of what this article is about. Focus on the main points and key information. Keep it concise and informative.

Return only the summary text, no additional formatting or explanations.`;

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
          max_tokens: 300,
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

      // Clean up the response (remove markdown code blocks if present)
      let cleanedSummary = content.trim();
      if (cleanedSummary.startsWith("```")) {
        cleanedSummary = cleanedSummary
          .replace(/^```(?:markdown|text)?\n?/i, "")
          .replace(/\n?```$/i, "");
      }

      setSummary(cleanedSummary);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to translate news item")
      );
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    summary,
    translateNewsItem,
  };
};
