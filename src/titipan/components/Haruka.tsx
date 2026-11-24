import type React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { type Pose, POSES } from "../poses";
import { clamp, easeIn, OUT } from "../theme";

export type PoseStep = { pose: Pose; at: number };

type Props = {
  /** Pose changes, in scene frames. The first one is the pose she enters with. */
  steps: PoseStep[];
  /** Where her head sits on screen: the centre of her head (x) and the crown of her hair (top). */
  x: number;
  top: number;
  /** Screen pixels per source pixel. One value per scene so every pose keeps the same size. */
  scale: number;
  /** Frame she springs in on, and the frame she starts sinking out on (defaults to the scene's last OUT frames). */
  enter: number;
  exit: number;
  /** Direction she comes in from, in px (she leaves the same way). */
  from?: [number, number];
  /** A short shake on entry, for shock. */
  jolt?: boolean;
};

/**
 * Haruka, the narrator. Her head stays pinned at (x, top) while the pose changes on Haruka's
 * words; each change lands with a small squash-and-hop so the eye catches the new gesture.
 */
export const Haruka: React.FC<Props> = ({ steps, x, top, scale, enter, exit, from = [0, 820], jolt = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = spring({ frame: frame - enter, fps, config: { damping: 15, stiffness: 120, mass: 0.8 } });
  const outP = interpolate(frame, [exit, exit + OUT], [0, 1], { ...clamp, easing: easeIn });
  const away = 1 - inP + outP;
  if (frame < enter || away >= 1) return null;

  let idx = 0;
  steps.forEach((s, i) => {
    if (frame >= s.at) idx = i;
  });
  const step = steps[idx];
  const p = POSES[step.pose];
  const k = scale * p.zoom;
  const since = frame - step.at;
  // the hop on a pose change: she pops up stretched, then lands with a slight squash (spring overshoot)
  const hop = 1 - (idx > 0 ? spring({ frame: since, fps, config: { damping: 9, stiffness: 240, mass: 0.5 } }) : 1);
  const shake = jolt ? Math.sin((frame - enter) * 1.9) * 7 * Math.exp(-(frame - enter) / 7) * (frame >= enter ? 1 : 0) : 0;
  const breathe = 1 + 0.005 * Math.sin(((frame - enter) / fps) * Math.PI * 0.8);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", translate: `${from[0] * away}px ${from[1] * away - hop * 16}px`, rotate: `${shake * 0.4}deg`, transformOrigin: `${x}px ${top + 640}px`, scale: `${1 - hop * 0.025} ${(1 + hop * 0.04) * breathe}` }}>
        <Img src={staticFile(`haruka/${p.file}`)} style={{ position: "absolute", left: x - p.cx * k, top: top - p.top * k, width: p.w * k, height: p.h * k }} />
      </div>
    </AbsoluteFill>
  );
};
