import { Play, Profile } from "@/lib/types";
import { Did } from "@atcute/lexicons";
import { createContext } from "react";

export type PlayEntry = { profile: Profile; play: Play };

export class PlayCache {
  cidMap: Map<string, PlayEntry>;
  didMap: Map<Did, Play[]>;

  constructor() {
    this.cidMap = new Map();
    this.didMap = new Map();
  }

  setCid(cid: string, entry: PlayEntry) {
    this.cidMap.set(cid, entry);
  }
  getCid(cid: string): PlayEntry | undefined {
    return this.cidMap.get(cid);
  }
  hasCid(cid: string) {
    return this.cidMap.has(cid);
  }

  setDid(did: Did, play: Play) {
    let arr = this.didMap.get(did);
    if (!arr) {
      arr = [];
      this.didMap.set(did, arr);
    }
    arr.unshift(play);
  }
  getDid(did: Did): Play[] | undefined {
    return this.didMap.get(did);
  }
}

export const PlayDataContext = createContext<PlayCache>(new PlayCache());
