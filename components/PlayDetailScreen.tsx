import { PlayDataContext } from "@/components/PlayDataContext";
import { AlbumArtContext } from "@/components/AlbumArtContext";
import { fetchCoverArtUri } from "@/lib/musicbrainz";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { MenuView, NativeActionEvent } from "@react-native-menu/menu";

const DEFAULT_ALBUM_ART = require("@/assets/images/default-album-art.png");

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPlayedTime(playedTime: number): string {
  if (playedTime <= 0) return "";
  return new Date(playedTime).toLocaleString();
}

export default function PlayDetailScreen() {
  const router = useRouter();
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const playData = useContext(PlayDataContext);
  const albumArtCache = useContext(AlbumArtContext);

  const entry = playData.getCid(cid);
  const [albumArt, setAlbumArt] = useState(DEFAULT_ALBUM_ART);

  useEffect(() => {
    if (!entry) return;
    const { play } = entry;
    if (!play.track.releaseMbid) return;

    const cached = albumArtCache.get(play.track.releaseMbid);
    if (cached) {
      setAlbumArt(cached);
      return;
    }

    fetchCoverArtUri(play.track).then((uri) => {
      if (!uri) return;
      albumArtCache.set(play.track.releaseMbid as string, uri);
      setAlbumArt(uri);
    });
  }, [cid]);

  if (!entry) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Play not found.</Text>
      </View>
    );
  }

  const { play, profile } = entry;

  const handleProfileMenu = async ({ nativeEvent }: NativeActionEvent) => {
    let value: string;
    switch (nativeEvent.event) {
      case "copy-handle":
        value = profile.handle;
        await Clipboard.setStringAsync(value);
        return;
      case "copy-name":
        value = profile.displayName ?? "";
        await Clipboard.setStringAsync(value);
        return;
      case "view-profile":
        router.push(`/profile/${profile.handle}`);
        return;
      default:
        return;
    }
  };

  const artistNames = play.artists.map((a) => a.name).join(", ");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.albumArtShadow}>
        <Image
          source={albumArt}
          style={styles.albumArt}
          contentFit="cover"
          onError={() => setAlbumArt(DEFAULT_ALBUM_ART)}
        />
      </View>

      <View style={styles.trackSection}>
        <Text style={styles.trackName}>{play.track.name}</Text>
        <Text style={styles.artistName}>{artistNames}</Text>
        {play.track.releaseName && <Text style={styles.releaseName}>{play.track.releaseName}</Text>}
      </View>

      <MenuView
        style={styles.profileRow}
        onPressAction={handleProfileMenu}
        actions={[
          {
            id: "view-profile",
            title: "View Profile",
            image: "person.crop.circle",
            imageColor: "#ffffff",
          },
          {
            id: "copy-handle",
            title: "Copy Handle",
            image: "doc.on.clipboard",
            imageColor: "#ffffff",
          },
          ...(profile.displayName
            ? [
                {
                  id: "copy-name",
                  title: "Copy Name",
                  image: "doc.on.clipboard",
                  imageColor: "#ffffff",
                },
              ]
            : []),
        ]}
      >
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
        <View>
          {profile.displayName && <Text style={styles.displayName}>{profile.displayName}</Text>}
          <Text style={styles.handle}>@{profile.handle}</Text>
        </View>
      </MenuView>

      <View style={styles.detailsSection}>
        {play.playedTime > 0 && (
          <DetailRow label="Played" value={formatPlayedTime(play.playedTime)} />
        )}
        {play.duration !== undefined && (
          <DetailRow label="Duration" value={formatDuration(play.duration)} />
        )}
        <DetailRow label="Service" value={play.musicService ?? "None"} />
        <DetailRow label="Client" value={play.client ?? "None"} />
        <DetailRow label="ISRC" value={play.isrc ?? "None"} />
        <DetailRow label="Origin URL" value={play.originUrl ?? "None"} />
        <DetailRow label="Release MBID" value={play.track.releaseMbid ?? "None"} />
        <DetailRow label="Track MBID" value={play.track.trackMbid ?? "None"} />
        <DetailRow label="Recording MBID" value={play.track.recordingMbid ?? "None"} />
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <MenuView
        style={styles.detailValueWrapper}
        onPressAction={() => Clipboard.setStringAsync(value)}
        actions={[{ id: "copy", title: "Copy", image: "doc.on.clipboard", imageColor: "#ffffff" }]}
      >
        <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </Text>
      </MenuView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1117",
  },
  content: {
    padding: 20,
    gap: 24,
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
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1a1f2e",
    borderRadius: 12,
    padding: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2a2f3e",
  },
  avatarPlaceholder: {
    backgroundColor: "#2a2f3e",
  },
  displayName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  handle: {
    color: "#8b92a5",
    fontSize: 13,
  },
  detailsSection: {
    backgroundColor: "#1a1f2e",
    borderRadius: 12,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2f3e",
  },
  detailLabel: {
    color: "#8b92a5",
    fontSize: 14,
  },
  detailValueWrapper: {
    flexShrink: 1,
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 14,
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },
});
