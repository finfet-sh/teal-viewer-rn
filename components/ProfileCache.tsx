import { Profile } from "@/lib/types";
import { Did, Handle } from "@atcute/lexicons";
import { createContext } from "react";

// This is bad since we just store the same data twice
// Something better would be nice
export class ProfileCache {
  didMap: Map<Did, Profile>;
  handleMap: Map<Handle, Profile>;

  constructor() {
    this.didMap = new Map();
    this.handleMap = new Map();
  }

  setHandle(handle: Handle, profile: Profile) {
    this.handleMap.set(handle, profile);
  }
  getHandle(handle: Handle): Profile | undefined {
    return this.handleMap.get(handle);
  }

  setDid(did: Did, profile: Profile) {
    this.didMap.set(did, profile);
  }
  getDid(did: Did): Profile | undefined {
    return this.didMap.get(did);
  }
}

export const ProfileCacheContext = createContext<ProfileCache>(new ProfileCache());
