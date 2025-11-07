import { db } from "@/lib/db";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const LOCATION = "NEW YORK, USA";
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
      const prompt = `Find 10 completely different and diverse news articles from ${LOCATION} from today or the past few days. 

ABSOLUTELY CRITICAL - VARIETY IS MANDATORY:
- Each article MUST be about a COMPLETELY DIFFERENT topic - NO exceptions
- You MUST cover at least 8 different categories from this list: politics, crime, culture/arts, sports, economy/business, local events, social issues, health, education, environment, technology, entertainment, real estate, tourism, food/restaurants
- DO NOT include multiple articles about the same event, even if from different sources
- If you find multiple articles about the same topic (e.g., transport strikes), ONLY include ONE article from that topic
- Actively search for and prioritize articles about DIFFERENT subjects
- Examples of what we want: one article about a crime, one about a cultural event, one about sports, one about politics, one about a business development, one about a social issue, etc.
- If you cannot find 10 different topics, prioritize quality and variety over quantity
- Only include individual news articles, not generic news source pages
- Articles must be from today or very recent (within the last 3-7 days)
- Include articles in any language (Italian, English, etc.)
- Each article should be a specific news story, not a news index page

IMPORTANT: Before including an article, check if you've already included an article about a similar topic. If yes, skip it and find a different topic instead.

For each article, provide:
1. Title of the article
2. A brief excerpt/description (2-3 sentences)
3. The source website name
4. The full URL
5. Publication date if available
6. Category (must be different from other articles' categories)

Format your response as a JSON array with this structure:
[
  {
    "title": "Article title",
    "excerpt": "Brief description of the article",
    "source": "website.com",
    "url": "https://full-url.com/article",
    "date": "YYYY-MM-DD",
    "category": "politics" // Must be unique - each article should have a different category
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

      // Try to parse JSON from the response
      let jsonString = content.trim();

      // Remove markdown code blocks if present
      if (jsonString.startsWith("```")) {
        jsonString = jsonString
          .replace(/^```(?:json)?\n?/i, "")
          .replace(/\n?```$/i, "");
      }

      // Try to find JSON array in the response if it's not pure JSON
      const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }

      // Parse the JSON
      let newsItems: any[];
      try {
        newsItems = JSON.parse(jsonString);
      } catch {
        // If parsing fails, return raw content
        setData(content);
        return;
      }

      // Save news items to InstantDB
      if (Array.isArray(newsItems) && newsItems.length > 0) {
        // Filter for variety - ensure we don't have duplicate topics
        const uniqueItems: any[] = [];
        const seenCategories = new Set<string>();
        const seenTopics = new Set<string>();

        for (const item of newsItems) {
          const category = (item.category || "general").toLowerCase();
          const title = (item.title || "").toLowerCase();

          // Extract key words from title to detect similar topics
          const titleWords = title
            .split(/\s+/)
            .filter((word: string) => word.length > 4);
          const topicKey = titleWords.slice(0, 3).join(" ");

          // Skip if we've seen this category or a very similar topic
          if (seenCategories.has(category) || seenTopics.has(topicKey)) {
            continue;
          }

          // Skip if title is too similar to existing items (check for common words)
          const isDuplicate = uniqueItems.some((existing) => {
            const existingTitle = (existing.title || "").toLowerCase();
            const commonWords = titleWords.filter(
              (word: string) => existingTitle.includes(word) && word.length > 5
            );
            return commonWords.length >= 2; // If 2+ significant words match, likely same topic
          });

          if (!isDuplicate) {
            uniqueItems.push(item);
            seenCategories.add(category);
            seenTopics.add(topicKey);
          }
        }

        // Only save unique items
        if (uniqueItems.length > 0) {
          const transactions = uniqueItems.map((item) => {
            // Generate a proper UUID for each new item
            const id = uuidv4();
            return db.tx.newsItems[id].update({
              title: item.title || "No title",
              excerpt: item.excerpt || "No description available",
              source: item.source || "Unknown source",
              url: item.url || "",
              date: item.date || "",
              category: item.category || "general",
            });
          });

          // Execute all transactions
          transactions.forEach((tx) => db.transact(tx));
          console.log(
            `Saved ${uniqueItems.length} unique news items to InstantDB (filtered from ${newsItems.length} total)`
          );
        } else {
          console.log(
            "No unique news items to save after filtering for variety"
          );
        }
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
