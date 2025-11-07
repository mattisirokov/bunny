import { useGetLatestNews } from "@/hooks/useGetLatestNews";
import { useTranslateNewsItem } from "@/hooks/useTranslateNewsItem";
import "@/lib/db"; // Initialize database
import { Button, StyleSheet, Text, View } from "react-native";

const LINK =
  "https://www.palermotoday.it/sport/calcio/juve-stabia-palermo-probabili-formazioni-7-novembre.html";

function App() {
  const { isLoading, error, data, fetchNews } = useGetLatestNews();
  const {
    isLoading: isTranslating,
    error: translateError,
    summary,
    translateNewsItem,
  } = useTranslateNewsItem();

  const handleFetchNews = async () => {
    console.log("Fetching latest news...");
    await fetchNews();
  };

  // Log results when data is available
  if (data && !isLoading) {
    console.log("Latest news (raw output):");
    console.log(data);
  }

  const handleTranslateNewsItem = async () => {
    console.log("Translating news item...");
    await translateNewsItem(LINK);
  };

  // Log summary when available
  if (summary && !isTranslating) {
    console.log("Article summary:", summary);
  }

  if (error && !isLoading) {
    console.error("Error fetching news:", error);
  }

  if (translateError && !isTranslating) {
    console.error("Error translating news:", translateError);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Latest News</Text>
      <Button
        title={isLoading ? "Loading..." : "Fetch Latest News"}
        onPress={handleFetchNews}
        disabled={isLoading}
      />
      <View style={styles.buttonSpacing} />
      <Button
        title={isTranslating ? "Translating..." : "Translate News Item"}
        onPress={handleTranslateNewsItem}
        disabled={isTranslating}
      />
      {isLoading && <Text style={styles.status}>Loading news...</Text>}
      {isTranslating && (
        <Text style={styles.status}>Translating article...</Text>
      )}
      {error && <Text style={styles.error}>Error: {error.message}</Text>}
      {translateError && (
        <Text style={styles.error}>
          Translation Error: {translateError.message}
        </Text>
      )}
      {summary && !isTranslating && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Article Summary:</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  status: {
    marginTop: 10,
    color: "#666",
  },
  error: {
    marginTop: 10,
    color: "red",
  },
  buttonSpacing: {
    height: 10,
  },
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    maxWidth: "90%",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default App;
