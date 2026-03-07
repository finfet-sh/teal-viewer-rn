import { Stack } from "expo-router";

export default function FeedTabLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0f1117" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: "#0f1117" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title: "Feed" }} />
      <Stack.Screen name="play/[cid]" options={{ title: "Play" }} />
      <Stack.Screen name="profile/[identifier]" options={{ title: "Profile" }} />
    </Stack>
  );
}
