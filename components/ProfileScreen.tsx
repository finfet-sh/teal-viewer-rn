import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import { Profile, Status } from "@/lib/types";
import { Did, isDid, isHandle } from "@atcute/lexicons/syntax";
import { ProfileCacheContext } from "@/components/ProfileCache";
import { PlayDataContext } from "@/components/PlayDataContext";
import PlayCard from "@/components/PlayCard";
import { getStatus } from "@/lib/translation";
import { rnFetch } from "@/lib/utils";
import { AlbumArtContext } from "@/components/AlbumArtContext";
import { fetchCoverArtUri } from "@/lib/musicbrainz";

const TABS = ["Recent", "Stats", "Now Playing"] as const;

const DEFAULT_ALBUM_ART = require("@/assets/images/default-album-art.png");

export default function ProfileScreen() {
  const { identifier } = useLocalSearchParams<{ identifier: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const profileCache = useContext(ProfileCacheContext);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (isHandle(identifier)) {
      let p = profileCache.getHandle(identifier);
      if (!p) {
        setFailed(true);
        return;
      }
      setProfile(p);
    }
    if (isDid(identifier)) {
      let p = profileCache.getDid(identifier);
      if (!p) {
        setFailed(true);
        return;
      }
      setProfile(p);
    }
  }, []);

  const scrollToTab = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  if (failed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to find profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Profile Header ── */}
      <View style={styles.profileHeader}>
        {profile && profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
        <View style={styles.profileInfo}>
          {profile && profile.displayName && (
            <Text style={styles.displayName}>{profile.displayName}</Text>
          )}
          <Text style={styles.handle}>@{profile && profile.handle}</Text>
        </View>
      </View>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <Pressable key={tab} style={styles.tabItem} onPress={() => scrollToTab(i)}>
            <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>{tab}</Text>
            {activeTab === i && <View style={styles.tabIndicator} />}
          </Pressable>
        ))}
      </View>

      {/* ── Paged Content ── */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
      >
        <View key="recent">
          {profile && <RecentPlaysTab did={profile.did} profile={profile} />}
        </View>
        <View key="stats">
          <StatsTab />
        </View>
        <View key="nowplaying">{profile && <NowPlayingTab profile={profile} />}</View>
      </PagerView>
    </View>
  );
}

interface RecentPlaysProps {
  did: string | null;
  profile: Profile;
}

function RecentPlaysTab({ did, profile }: RecentPlaysProps) {
  const playCache = useContext(PlayDataContext);
  const [plays, setPlays] = useState(playCache.getDid(did as Did));
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    setRefreshing(true);
    setPlays(playCache.getDid(did as Did));
    setRefreshing(false);
  }

  return (
    <FlatList
      data={plays}
      contentContainerStyle={{ padding: 12, gap: 8 }}
      renderItem={({ item }) => <PlayCard play={item} profile={profile} />}
      keyExtractor={(item) => item.cid}
      ListEmptyComponent={<Text style={styles.emptyText}>No recent plays</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    />
  );
}

function StatsTab() {
  // TODO: stats data source
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text style={styles.emptyText}>Stats coming soon</Text>
    </ScrollView>
  );
}

interface NowPlayingProps {
  profile: Profile;
}

function NowPlayingTab({ profile }: NowPlayingProps) {
  const [status, setStatus] = useState<Status | null>(null);
  const albumArtCache = useContext(AlbumArtContext);
  const [albumArt, setAlbumArt] = useState(DEFAULT_ALBUM_ART);
  const [refreshing, setRefreshing] = useState(false);

  async function get() {
    const st = await getStatus(profile, rnFetch);
    console.log(st);
    if (st) setStatus(st);
  }

  async function getCoverArt() {
    if (!status) return;
    if (!status.play.track.releaseMbid) return;

    const cachedArt = albumArtCache.get(status.play.track.releaseMbid);
    if (cachedArt) {
      setAlbumArt(cachedArt);
      return;
    }

    async function inner() {
      if (!status) return;

      const ret = await fetchCoverArtUri(status.play.track);
      if (!ret) return;
      albumArtCache.set(status.play.track.releaseMbid as string, ret);
      setAlbumArt(ret);
    }

    inner();
  }

  useEffect(() => {
    if (status) return;
    get();
  });

  useEffect(() => {
    if (!status) return;
    if (!status.play.track.releaseMbid) return;
    getCoverArt();
  }, [status]);

  async function refresh() {
    setRefreshing(true);
    console.log("refreshing");
    await get();
    await getCoverArt();
    setRefreshing(false);
  }

  if (!status) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={styles.emptyText}>Nothing playing</Text>
      </View>
    );
  }

  const artistNames = status.play.artists.map((a) => a.name).join(", ");

  return (
    <ScrollView
      contentContainerStyle={styles.nowPlayingContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <View style={styles.albumArtShadow}>
        <Image
          source={albumArt}
          style={styles.albumArt}
          contentFit="cover"
          onError={() => setAlbumArt(DEFAULT_ALBUM_ART)}
        />
      </View>
      <View style={styles.trackSection}>
        <Text style={styles.trackName}>{status.play.track.name}</Text>
        <Text style={styles.artistName}>{artistNames}</Text>
        {status.play.track.releaseName && (
          <Text style={styles.releaseName}>{status.play.track.releaseName}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1117",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f1117",
  },
  errorText: {
    color: "#8b92a5",
    fontSize: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    paddingBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2a2f3e",
  },
  avatarPlaceholder: {
    backgroundColor: "#2a2f3e",
  },
  profileInfo: {
    gap: 4,
  },
  displayName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
  },
  handle: {
    color: "#8b92a5",
    fontSize: 15,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2f3e",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  tabLabel: {
    color: "#8b92a5",
    fontSize: 15,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#ffffff",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    width: "60%",
    backgroundColor: "#3b82f6",
    borderRadius: 1,
  },
  pager: {
    flex: 1,
  },
  emptyText: {
    color: "#8b92a5",
    fontSize: 15,
    textAlign: "center",
    padding: 20,
  },
  nowPlayingContent: {
    padding: 20,
    gap: 24,
  },
  albumArtShadow: {
    width: "100%",
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  albumArt: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#2a2f3e",
  },
  trackSection: {
    gap: 4,
  },
  trackName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
  },
  artistName: {
    color: "#c0c6d4",
    fontSize: 16,
  },
  releaseName: {
    color: "#8b92a5",
    fontSize: 14,
  },
});
