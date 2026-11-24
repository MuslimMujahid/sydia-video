import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { easeInOut, easeOut } from "./theme";

type NoProps = Record<string, never>;

/** Exiting scene blasts towards the camera, entering scene lands with a white flash. */
const ZoomPunch: React.FC<TransitionPresentationComponentProps<NoProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill
        style={{
          scale: interpolate(p, [0, 1], [1, 1.9], { easing: easeInOut }),
          opacity: interpolate(p, [0, 0.55], [1, 0], {
            extrapolateRight: "clamp",
          }),
          filter: `blur(${interpolate(p, [0, 1], [0, 18])}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          scale: interpolate(p, [0, 1], [0.7, 1], { easing: easeOut }),
          opacity: interpolate(p, [0, 0.35], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          backgroundColor: "white",
          opacity: interpolate(p, [0, 0.3, 1], [0, 0.9, 0], {
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};

export const zoomPunch = (): TransitionPresentation<NoProps> => ({
  component: ZoomPunch,
  props: {},
});

type WipeProps = { readonly reverse: boolean };

/** A skewed aurora band sweeps across the frame and reveals the next scene behind it. */
const AuroraWipe: React.FC<TransitionPresentationComponentProps<WipeProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const p = easeInOut(presentationProgress);
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill
        style={{
          translate: `${(passedProps.reverse ? 1 : -1) * p * 12}% 0`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
  // Edge travels from -30% to 130% so the skewed band fully clears the frame.
  const edge = -30 + p * 160;
  const top = passedProps.reverse ? 100 - edge - 20 : edge + 20;
  const bottom = passedProps.reverse ? 100 - edge : edge;
  const clip = passedProps.reverse
    ? `polygon(${top}% 0%, 100% 0%, 100% 100%, ${bottom}% 100%)`
    : `polygon(0% 0%, ${top}% 0%, ${bottom}% 100%, 0% 100%)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: clip }}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: passedProps.reverse
            ? `polygon(${top - 9}% 0%, ${top}% 0%, ${bottom}% 100%, ${bottom - 9}% 100%)`
            : `polygon(${top}% 0%, ${top + 9}% 0%, ${bottom + 9}% 100%, ${bottom}% 100%)`,
          background:
            "linear-gradient(135deg, #ffb27a 0%, #f06694 45%, #8c5cff 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const auroraWipe = (reverse = false): TransitionPresentation<WipeProps> => ({
  component: AuroraWipe,
  props: { reverse },
});

type IrisProps = { readonly shrink: boolean };

/** Circular iris opens from the centre with an aurora ring on its rim. */
const Iris: React.FC<TransitionPresentationComponentProps<IrisProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const p = easeInOut(presentationProgress);
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill style={{ scale: passedProps.shrink ? interpolate(p, [0, 1], [1, 0.9]) : 1.0 + p * 0.08 }}>
        {children}
      </AbsoluteFill>
    );
  }
  const r = p * 120;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: `circle(${r + 3}% at 50% 50%)`,
          background:
            "linear-gradient(135deg, #ffb27a 0%, #f06694 45%, #8c5cff 100%)",
        }}
      />
      <AbsoluteFill style={{ clipPath: `circle(${r}% at 50% 50%)` }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Pass `shrink: false` when the outgoing scene is dark, so no border shows. */
export const iris = (shrink = true): TransitionPresentation<IrisProps> => ({
  component: Iris,
  props: { shrink },
});
