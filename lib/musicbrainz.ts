import { Track } from "./types";

export async function fetchCoverArtUri(track: Track): Promise<string | null> {
  if (!track.releaseMbid) return null;

  let resp = await fetch(`https://coverartarchive.org/release/${track.releaseMbid}`, {
    headers: { Accept: "application/json" },
  });

  console.log(resp);

  if (!resp.ok) return null;
  const result = await resp.json();

  console.log(result);

  const images = result.images;
  if (!(images && images instanceof Array)) return null;
  if (images.length == 0) return null;

  console.log(images);

  for (const img of images) {
    if (img.image) return img.image.replace("http://", "https://");
  }
  return null;
}
