import { createContext } from "react";

export const AlbumArtContext = createContext<Map<string, string | null>>(new Map());
