import { fetchCoverArtUri } from "@/lib/musicbrainz";
import { Play, Profile } from "@/lib/types";
import { Image } from "expo-image";
import { useRouter, useSegments } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AlbumArtContext } from "./AlbumArtContext";
import Marquee from "./Marquee";

interface Props {
  play: Play;
  profile: Profile;
}

const DEFAULT_ALBUM_ART = require("@/assets/images/default-album-art.png");

function prettyPlayedTime(playedTime: number): string {
  // playedTime is unix epoch in milliseconds
  const diffSec = (Date.now() - playedTime) / 1000;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function usePlayedTime(playedTime: number): string | null {
  const [, tick] = useState(0);

  useEffect(() => {
    if (playedTime <= 0) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [playedTime]);

  return playedTime > 0 ? prettyPlayedTime(playedTime) : null;
}

export default function PlayCard({ play, profile }: Props) {
  const router = useRouter();
  const segments = useSegments();
  const playBasePath = segments[0] === "search" ? "/search/play" : "/play";
  const artistLine =
    play.artists.map((a) => a.name).join(", ") +
    (play.track.releaseName ? " - " + play.track.releaseName : "");

  const playedTime = usePlayedTime(play.playedTime);

  const albumArtCache = useContext(AlbumArtContext);
  const [albumArt, setAlbumArt] = useState(DEFAULT_ALBUM_ART);

  useEffect(() => {
    if (!play.track.releaseMbid) {
      console.log("No releaseMbid for " + play.track.name);
      return;
    }

    const cachedArt = albumArtCache.get(play.track.releaseMbid);
    if (cachedArt === null) {
      // Explicit null means we tried before but found nothing
      return;
    } else if (cachedArt !== undefined) {
      setAlbumArt(cachedArt);
      return;
    }

    async function getCoverArt() {
      const ret = await fetchCoverArtUri(play.track);
      if (!ret) {
        console.log("No album art for " + play.track.name);

        // Set to null to prevent fetching this again.
        albumArtCache.set(play.track.releaseMbid as string, null);
        return;
      }
      albumArtCache.set(play.track.releaseMbid as string, ret);
      setAlbumArt(ret);
    }

    getCoverArt();
  }, []);

  return (
    <Pressable
      onPress={() => router.push(`${playBasePath}/${play.cid}`)}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <View style={styles.card}>
        <Image
          source={albumArt}
          style={styles.albumArt}
          contentFit="cover"
          onError={() => setAlbumArt(DEFAULT_ALBUM_ART)}
        />
        <View style={styles.info}>
          <Marquee>
            <Text style={styles.trackName}>{play.track.name}</Text>
          </Marquee>
          <Marquee>
            <Text style={styles.artistLine}>{artistLine}</Text>
          </Marquee>
          <View style={styles.meta}>
            {profile.avatarUrl && (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} contentFit="cover" />
            )}
            <Text style={styles.handle}>@{profile.handle}</Text>
            {playedTime && <Text style={styles.playedTime}>{playedTime}</Text>}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1f2e",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: "#2a2f3e",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  trackName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  artistLine: {
    color: "#8b92a5",
    fontSize: 13,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  avatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2a2f3e",
    alignSelf: "center",
  },
  handle: {
    color: "#8b92a5",
    fontSize: 13,
  },
  playedTime: {
    color: "#6b7280",
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
