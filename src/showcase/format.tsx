import type React from "react";
import { createContext, useContext } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

/**
 * The canvas the showcase is laid out on. Scenes are authored in these units; the stage
 * scales it to the composition size. The square cut uses a 1440×1440 canvas (the same area
 * as 1920×1080), scaled down to 1080×1080, so world sizes and type stay comparable.
 */
export type Format = { readonly w: number; readonly h: number; readonly square: boolean };

export const WIDE: Format = { w: 1920, h: 1080, square: false };
export const SQUARE: Format = { w: 1440, h: 1440, square: true };

const FormatContext = createContext<Format>(WIDE);

export const useFormat = () => useContext(FormatContext);

/** Picks the wide or square value for the current format. */
export const useSq = () => {
  const { square } = useFormat();
  return <T,>(wide: T, sq: T): T => (square ? sq : wide);
};

/** Lays children out on the format's canvas and scales it to fill the composition. */
export const FormatStage: React.FC<{ readonly format: Format; readonly children: React.ReactNode }> = ({ format, children }) => {
  const { width } = useVideoConfig();
  return (
    <FormatContext.Provider value={format}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: format.w, height: format.h, scale: String(width / format.w), transformOrigin: "0 0" }}>{children}</div>
      </AbsoluteFill>
    </FormatContext.Provider>
  );
};
