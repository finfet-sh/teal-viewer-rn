import { ProfileCache, ProfileCacheContext } from "@/components/ProfileCache";
import { AlbumArtContext } from "@/components/AlbumArtContext";
import { PlayCache, PlayDataContext } from "@/components/PlayDataContext";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Platform, View } from "react-native";

import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function RootLayout() {
  const stack = (
    <NativeTabs>
      <NativeTabs.Trigger name="(feed)" disableScrollToTop>
        <Label>Feed</Label>
        <Icon sf={{ default: "house", selected: "house.fill" }} drawable="custom_home_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Label>Search</Label>
        <Icon
          sf={{ default: "magnifyingglass", selected: "magnifyingglass.circle" }}
          drawable="custom_search_drawable"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );

  return (
    <ThemeProvider value={DarkTheme}>
      <ProfileCacheContext.Provider value={new ProfileCache()}>
        <AlbumArtContext.Provider value={new Map()}>
          <PlayDataContext.Provider value={new PlayCache()}>
            {Platform.OS === "web" ? (
              <View style={{ flex: 1, alignItems: "center", backgroundColor: "#0f1117" }}>
                <View style={{ flex: 1, width: "100%", maxWidth: 600 }}>{stack}</View>
              </View>
            ) : (
              stack
            )}
          </PlayDataContext.Provider>
        </AlbumArtContext.Provider>
      </ProfileCacheContext.Provider>
    </ThemeProvider>
  );
}
