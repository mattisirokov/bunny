import { useGetLatestNews } from "@/hooks/useGetLatestNews";
import "@/lib/db"; // Initialize database
import { Button, StyleSheet, Text, View } from "react-native";

function App() {
  const { isLoading, error, data, fetchNews } = useGetLatestNews();

  const handleFetchNews = async () => {
    console.log("Fetching latest news...");
    await fetchNews();
  };

  // Log results when data is available
  if (data && !isLoading) {
    console.log("Latest news (raw output):");
    console.log(data);
  }

  if (error && !isLoading) {
    console.error("Error fetching news:", error);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Latest News</Text>
      <Button
        title={isLoading ? "Loading..." : "Fetch Latest News"}
        onPress={handleFetchNews}
        disabled={isLoading}
      />
      {isLoading && <Text style={styles.status}>Loading news...</Text>}
      {error && <Text style={styles.error}>Error: {error.message}</Text>}
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
});

export default App;
