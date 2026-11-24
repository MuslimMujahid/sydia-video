import type React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { type Pose, POSES } from "../poses";
import { clamp } from "../theme";

export type PoseStep = { pose: Pose; at: number };

type Props = {
  /** Pose changes, in scene frames. The first one is the pose she enters with. */
  steps: PoseStep[];
  /** The first pose's box in the storyboard frame (left, top, width); later poses keep her head where it is. */
  box: { x: number; y: number; w: number };
  /** The pose `box` was measured on, when it isn't the first one (e.g. the storyboard shows her final gesture). */
  anchor?: Pose;
  /** Frame she enters on, and the direction (px) she comes in from. */
  enter?: number;
  from?: [number, number];
  /** Slow push-in toward her face over the scene (1 = none), for the montage's tightening framing. */
  push?: [number, number, number];
  /** Frames a pose change cross-fades over. */
  fade?: number;
  /** Shake amplitude in px (panic). */
  shake?: number;
};

/**
 * Haruka, animated from her real art (assets/Haruka via scripts/make-sibuk-art.py). Her head stays
 * pinned while one pose cross-fades into the next on her words, with a small hop so the eye catches
 * the new gesture.
 */
export const Haruka: React.FC<Props> = ({ steps, box, anchor, enter = 0, from = [0, 900], push, fade = 4, shake = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < enter) return null;

  const p0 = POSES[anchor ?? steps[0].pose];
  const s0 = box.w / p0.w;
  const headX = box.x + p0.cx * s0;
  const headTop = box.y + p0.top * s0;
  const headPx = p0.headW * s0;

  const inP = spring({ frame: frame - enter, fps, config: { damping: 15, stiffness: 130, mass: 0.8 } });
  let idx = 0;
  steps.forEach((s, i) => {
    if (frame >= s.at) idx = i;
  });
  const since = frame - steps[idx].at;
  const hop = idx > 0 ? 1 - spring({ frame: since, fps, config: { damping: 9, stiffness: 240, mass: 0.5 } }) : 0;
  const zoom = push ? interpolate(frame, [push[0], push[1]], [1, push[2]], clamp) : 1;
  const jitter = shake ? [Math.sin(frame * 2.3) * shake, Math.cos(frame * 3.1) * shake * 0.6] : [0, 0];

  const layer = (pose: Pose, opacity: number) => {
    const p = POSES[pose];
    const s = headPx / p.headW;
    return <Img key={pose} src={staticFile(`sibuk/haruka/${pose}.png`)} style={{ position: "absolute", left: headX - p.cx * s, top: headTop - p.top * s, width: p.w * s, height: p.h * s, opacity }} />;
  };
  const t = idx > 0 ? interpolate(since, [0, fade], [0, 1], clamp) : 1;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, translate: `${from[0] * (1 - inP) + jitter[0]}px ${from[1] * (1 - inP) - hop * 14 + jitter[1]}px`, scale: `${zoom * (1 - hop * 0.02)} ${zoom * (1 + hop * 0.03)}`, transformOrigin: `${headX}px ${headTop + headPx * 0.6}px` }}>
        {idx > 0 && t < 1 ? layer(steps[idx - 1].pose, 1 - t * t) : null}
        {layer(steps[idx].pose, t)}
      </div>
    </AbsoluteFill>
  );
};
