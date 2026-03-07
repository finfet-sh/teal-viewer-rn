import { ActorIdentifier, Did, Handle, is } from "@atcute/lexicons";
import { FmTealAlphaFeedPlay, FmTealAlphaActorStatus } from "./lexicon";
import { Artist, MinimalProfile, Play, Profile, Status } from "./types";
import { Client, simpleFetchHandler } from "@atcute/client";
import type {} from "@atcute/bluesky";
import { ActorResolver } from "@atcute/identity-resolver";

export function tealfmPlayToPlay(cid: string, tealPlay: FmTealAlphaFeedPlay.Main): Play {
  const artists: Artist[] = (tealPlay.artists ?? []).map((a) => {
    return { name: a.artistName, mbid: a.artistMbId };
  });
  const playedTime = tealPlay.playedTime ? Date.parse(tealPlay.playedTime) : 0;

  return {
    cid: cid,
    artists: artists,
    track: {
      name: tealPlay.trackName,
      trackMbid: tealPlay.trackMbId,
      recordingMbid: tealPlay.recordingMbId,
      releaseMbid: tealPlay.releaseMbId,
      releaseName: tealPlay.releaseName,
    },
    playedTime: playedTime,
    albumArtUrl: null,
    isrc: tealPlay.isrc,
    duration: tealPlay.duration,
    originUrl: tealPlay.originUrl,
    musicService: tealPlay.musicServiceBaseDomain,
    client: tealPlay.submissionClientAgent,
  };
}

export async function buildProfile(
  handle: Handle,
  did: Did,
  fetch?: typeof globalThis.fetch,
  actorResolver?: ActorResolver,
): Promise<Profile | null> {
  let client = new Client({
    handler: simpleFetchHandler({ service: "https://public.api.bsky.app", fetch }),
  });

  let resp = await client.get("app.bsky.actor.getProfile", {
    params: { actor: did },
  });
  if (!resp.ok) return null;

  let pdsUrl: string | undefined;
  if (actorResolver) {
    let actor = await actorResolver.resolve(did);
    if (actor) {
      pdsUrl = actor.pds;
    }
  }

  return {
    displayName: resp.data.displayName,
    handle: handle,
    did: did,
    avatarUrl: resp.data.avatar,
    pdsUrl,
  };
}

export async function getStatus(
  profile: Profile,
  fetch?: typeof globalThis.fetch,
): Promise<Status | null> {
  if (!profile.pdsUrl) return null;

  let client = new Client({
    handler: simpleFetchHandler({ service: profile.pdsUrl, fetch }),
  });

  const resp = await client.get("com.atproto.repo.getRecord", {
    params: {
      rkey: "self",
      collection: "fm.teal.alpha.actor.status",
      repo: profile.did as ActorIdentifier,
    },
  });

  if (!resp.ok) return null;
  if (!resp.data.cid) return null;
  const status = resp.data.value;
  if (!is(FmTealAlphaActorStatus.mainSchema, status)) return null;

  return {
    play: tealfmPlayToPlay(resp.data.cid, status.item as unknown as FmTealAlphaFeedPlay.Main),
    time: Date.parse(status.time),
    expiry: status.expiry ? Date.parse(status.expiry) : undefined,
  };
}

export async function searchActors(query: string): Promise<MinimalProfile[] | null> {
  let client = new Client({
    handler: simpleFetchHandler({ service: "https://public.api.bsky.app", fetch }),
  });

  let resp = await client.get("app.bsky.actor.searchActorsTypeahead", {
    params: { q: query },
  });
  if (!resp.ok) return null;
  if (resp.data.actors.length == 0) return null;
  return resp.data.actors.map((e) => {
    return {
      did: e.did,
      handle: e.handle,
      displayName: e.displayName,
      avatarUrl: e.avatar,
    };
  });
}
