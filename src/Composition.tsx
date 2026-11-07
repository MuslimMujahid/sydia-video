import {
  AbsoluteFill,
  Composition,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const MyComposition = () => {
  return (
    <Composition
      id="SydiaIntro"
      component={MyComponent}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

export const MyComponent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(frame, [0, 20, 130, 149], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#101820",
        color: "#f6f7f9",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          opacity,
          textAlign: "center",
          transform: `translateY(${(1 - entrance) * 40}px)`,
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -5 }}>
          Sydia
        </div>
        <div style={{ marginTop: 24, fontSize: 36, color: "#9cddc8" }}>
          Your next story starts here.
        </div>
      </div>
    </AbsoluteFill>
  );
};
