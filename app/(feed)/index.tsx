import React, { useContext, useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

import "partysocket/event-target-polyfill";
import "../../polyfills/crypto";

import { JetstreamSubscription } from "@atcute/jetstream";

import { FmTealAlphaFeedPlay } from "@/lib/lexicon";
import { is } from "@atcute/lexicons";
import { ProfileCacheContext } from "@/components/ProfileCache";
import { PlayDataContext } from "@/components/PlayDataContext";
import { buildProfile, tealfmPlayToPlay } from "@/lib/translation";
import { Play, Profile } from "@/lib/types";
import PlayCard from "@/components/PlayCard";
import { buildActorResolver, rnFetch } from "@/lib/utils";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [subscription, setSubscription] = useState<JetstreamSubscription | undefined>(undefined);
  const [data, setData] = useState<Array<{ profile: Profile; play: Play }>>([]);
  const cache = useContext(ProfileCacheContext);
  const playData = useContext(PlayDataContext);

  useEffect(() => {
    const sub = new JetstreamSubscription({
      url: "wss://jetstream2.us-east.bsky.network",
      wantedCollections: ["fm.teal.alpha.feed.play"],
    });
    setSubscription(sub);

    let isCancelled = false;

    async function consume() {
      const actorResolver = buildActorResolver();

      try {
        for await (const event of sub) {
          if (isCancelled) break;
          if (event.kind !== "commit") continue;
          if (event.commit.operation !== "create") continue;

          const record = event.commit.record;
          if (!is(FmTealAlphaFeedPlay.mainSchema, record)) continue;

          if (playData.hasCid(event.commit.cid)) continue;

          console.log(event);

          // If the playedTime is >500 seconds old, ignore the record
          const playedTime = Date.parse(record.playedTime ?? "0");
          if (Date.now() - playedTime > 500000) continue;

          let did = event.did;
          let profile: Profile | null | undefined = cache.getDid(did);
          if (!profile) {
            try {
              let actor = await actorResolver.resolve(did);
              profile = await buildProfile(actor.handle, did, rnFetch, actorResolver);
              if (!profile) {
                throw Error("Could not build profile for " + did);
              }

              cache.setDid(actor.did, profile);
              cache.setHandle(actor.handle, profile);
            } catch (e: any) {
              profile = {
                handle: "handle.invalid",
                did: did,
              };
            }
          }

          let play = tealfmPlayToPlay(event.commit.cid, record);

          playData.setCid(play.cid, { profile, play });
          playData.setDid(did, play);

          setData((prevData) => {
            let newData = [{ profile, play }, ...prevData];

            return newData.sort((a, b) => {
              if (a.play.playedTime > b.play.playedTime) return -1;
              if (a.play.playedTime < b.play.playedTime) return 1;
              return 0;
            });
          });
        }
      } catch (e) {
        throw e;
      }
    }

    consume();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f1117" }}>
      {data.length > 0 ? (
        <FlatList
          data={data}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          renderItem={({ item }) => <PlayCard play={item.play} profile={item.profile} />}
          keyExtractor={(item) => item.play.cid}
          windowSize={5}
          getItemLayout={(_, index) => ({
            length: 80,
            offset: (80 + 8) * index,
            index,
          })}
        />
      ) : subscription ? (
        <Text style={{ color: "#8b92a5", padding: 20 }}>Waiting for plays...</Text>
      ) : (
        <Text style={{ color: "#8b92a5", padding: 20 }}>Disconnected</Text>
      )}
    </SafeAreaView>
  );
}
