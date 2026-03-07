export interface Profile {
  handle: string;
  did: string;
  avatarUrl?: string;
  displayName?: string;
  pdsUrl?: string;
}

export type MinimalProfile = Omit<Profile, "pdsUrl">;

export interface Play {
  cid: string;
  artists: Artist[];
  track: Track;
  playedTime: number;
  albumArtUrl: string | null;

  isrc?: string;
  duration?: number;
  originUrl?: string;
  musicService?: string;
  client?: string;
}

export interface Track {
  name: string;
  trackMbid?: string;
  recordingMbid?: string;
  releaseName?: string;
  releaseMbid?: string;
}

export interface Artist {
  name: string;
  mbid?: string;
}

export interface Status {
  play: Play;
  time: number;
  expiry?: number;
}
