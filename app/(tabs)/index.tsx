import { i, init } from "@instantdb/react-native";

const APP_ID = process.env.EXPO_PUBLIC_INSTANTDB_APP_ID;

if (!APP_ID) {
  throw new Error(
    "EXPO_PUBLIC_INSTANTDB_APP_ID is not set in environment variables"
  );
}

const schema = i.schema({
  entities: {},
});

init({ appId: APP_ID, schema });

function App() {
  return null;
}

export default App;
