import { i, init } from "@instantdb/react-native";

const APP_ID = process.env.EXPO_PUBLIC_INSTANTDB_APP_ID;

if (!APP_ID) {
  throw new Error(
    "EXPO_PUBLIC_INSTANTDB_APP_ID is not set in environment variables"
  );
}

const schema = i.schema({
  entities: {
    newsItems: i.entity({
      title: i.string(),
      excerpt: i.string(),
      source: i.string(),
      url: i.string(),
      date: i.string(),
      category: i.string(),
    }),
  },
});

export const db = init({ appId: APP_ID, schema });
