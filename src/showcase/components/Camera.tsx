import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useFormat } from "../format";

/**
 * A keyframed 3D camera. The world origin sits at the centre of the frame;
 * `x`/`y` pick the point the camera looks at, `dolly` moves towards it
 * (positive = closer) and `rx`/`ry`/`rz` orbit around it, in degrees.
 */
export type CamKey = {
  readonly f: number;
  readonly x: number;
  readonly y: number;
  readonly dolly: number;
  readonly rx: number;
  readonly ry: number;
  readonly rz?: number;
  /** Easing into this key. Defaults to a smooth in-out. */
  readonly ease?: (t: number) => number;
};

export const camEase = Easing.bezier(0.65, 0, 0.35, 1);
export const camEaseOut = Easing.bezier(0.16, 1, 0.3, 1);

const sample = (keys: readonly CamKey[], frame: number, pick: (k: CamKey) => number) => {
  if (frame <= keys[0].f) return pick(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame <= b.f) {
      return interpolate(frame, [a.f, b.f], [pick(a), pick(b)], { easing: b.ease ?? camEase });
    }
  }
  return pick(keys[keys.length - 1]);
};

export const useCam = (keys: readonly CamKey[], frameOverride?: number) => {
  const current = useCurrentFrame();
  const frame = frameOverride ?? current;
  return {
    x: sample(keys, frame, (k) => k.x),
    y: sample(keys, frame, (k) => k.y),
    dolly: sample(keys, frame, (k) => k.dolly),
    rx: sample(keys, frame, (k) => k.rx),
    ry: sample(keys, frame, (k) => k.ry),
    rz: sample(keys, frame, (k) => k.rz ?? 0),
  };
};

/** Renders children in a 3D world seen through the keyframed camera. */
export const CameraStage: React.FC<{
  readonly keys: readonly CamKey[];
  readonly children: React.ReactNode;
  /** Gentle handheld drift, in degrees. */
  readonly drift?: number;
  readonly perspective?: number;
  readonly shake?: number;
}> = ({ keys, children, drift = 0.6, perspective = 2000, shake = 0 }) => {
  const frame = useCurrentFrame();
  const c = useCam(keys);
  const { w, h } = useFormat();
  const dx = Math.sin(frame / 47) * drift + Math.sin(frame / 13.3) * shake;
  const dy = Math.cos(frame / 59) * drift * 0.7 + Math.cos(frame / 11.1) * shake;
  return (
    <AbsoluteFill style={{ perspective, perspectiveOrigin: "50% 50%", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: w / 2,
          top: h / 2,
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `translateZ(${c.dolly}px) rotateX(${c.rx + dy}deg) rotateY(${c.ry + dx}deg) rotateZ(${c.rz}deg) translate3d(${-c.x}px, ${-c.y}px, 0px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Places a flat element in the world, centred on (x, y). */
export const Place: React.FC<{
  readonly x?: number;
  readonly y?: number;
  readonly z?: number;
  readonly rx?: number;
  readonly ry?: number;
  readonly rz?: number;
  readonly scale?: number;
  readonly opacity?: number;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}> = ({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, scale = 1, opacity = 1, children, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transformStyle: "preserve-3d",
      transform: `translate(-50%, -50%) translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`,
      opacity,
      ...style,
    }}
  >
    {children}
  </div>
);
