import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Did, Handle } from "@atcute/lexicons";
import { ProfileCacheContext } from "@/components/ProfileCache";
import { buildProfile, searchActors } from "@/lib/translation";
import { MinimalProfile } from "@/lib/types";
import { buildActorResolver, rnFetch } from "@/lib/utils";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MinimalProfile[]>([]);
  const [loadingDid, setLoadingDid] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileCache = useContext(ProfileCacheContext);
  const router = useRouter();

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      const results = await searchActors(query.trim());
      setResults(results ?? []);
    }, 150);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  async function handleSelect(actor: MinimalProfile) {
    setLoadingDid(actor.did);
    try {
      const actorResolver = buildActorResolver();
      const profile = await buildProfile(
        actor.handle as Handle,
        actor.did as Did,
        rnFetch,
        actorResolver,
      );
      if (profile) {
        profileCache.setDid(actor.did as Did, profile);
        profileCache.setHandle(actor.handle as Handle, profile);
        router.push(`/search/profile/${actor.did}`);
      }
    } finally {
      setLoadingDid(null);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search users..."
          placeholderTextColor="#8b92a5"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.did}
          renderItem={({ item }) => (
            <Pressable
              style={styles.resultRow}
              onPress={() => handleSelect(item)}
              disabled={loadingDid === item.did}
            >
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
              <View style={styles.resultInfo}>
                {item.displayName ? (
                  <Text style={styles.displayName}>{item.displayName}</Text>
                ) : null}
                <Text style={styles.handle}>@{item.handle}</Text>
              </View>
              {loadingDid === item.did && <ActivityIndicator size="small" color="#8b92a5" />}
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{query.trim() ? "No results" : "Search for a user"}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1117",
  },
  searchBar: {
    padding: 12,
  },
  input: {
    backgroundColor: "#1c2030",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 16,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2f3e",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: "#2a2f3e",
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  handle: {
    color: "#8b92a5",
    fontSize: 14,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#8b92a5",
    fontSize: 15,
  },
});
