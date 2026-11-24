import { Audio } from "@remotion/media";
import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import type React from "react";
import { AbsoluteFill, interpolate, staticFile, Track, useCurrentFrame, useVideoConfig } from "remotion";
import { ChatScene } from "./scenes/ChatScene";
import { ExpenseScene } from "./scenes/ExpenseScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { HookScene } from "./scenes/HookScene";
import { IntegrationsScene } from "./scenes/IntegrationsScene";
import { LogoDropScene } from "./scenes/LogoDropScene";
import { OutroScene } from "./scenes/OutroScene";
import { colors } from "./theme";
import { auroraWipe, iris, zoomPunch } from "./transitions";

/**
 * 32 s promo cut to an original 150 BPM track (1 beat = 0.4 s, 1 bar = 1.6 s).
 * Every transition is one beat long and starts on a bar line, so each scene's
 * duration is its bar length plus one beat of overlap (except the last).
 */
const Music: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <Audio
      name="Sydia anthem"
      src={staticFile("music/sydia-anthem.wav")}
      volume={interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })}
    />
  );
};

export const SydiaPromo: React.FC = () => {
  const { fps } = useVideoConfig();
  const beat = 0.4 * fps;
  const bar = 4 * beat;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
      <TransitionSeries name="Scenes">
        <TransitionSeries.Sequence name="Hook" durationInFrames={2 * bar + beat}>
          <HookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomPunch()} timing={linearTiming({ durationInFrames: beat })} />
        <TransitionSeries.Sequence name="Logo drop" durationInFrames={2 * bar + beat}>
          <LogoDropScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={auroraWipe()} timing={linearTiming({ durationInFrames: beat })} />
        <TransitionSeries.Sequence name="Chat reminder" durationInFrames={4 * bar + beat}>
          <ChatScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ durationInFrames: beat, config: { damping: 200 } })}
        />
        <TransitionSeries.Sequence name="Expenses" durationInFrames={3 * bar + beat}>
          <ExpenseScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={iris()} timing={linearTiming({ durationInFrames: beat })} />
        <TransitionSeries.Sequence name="Features" durationInFrames={3 * bar + beat}>
          <FeaturesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={auroraWipe(true)} timing={linearTiming({ durationInFrames: beat })} />
        <TransitionSeries.Sequence name="Integrations" durationInFrames={2 * bar + beat}>
          <IntegrationsScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomPunch()} timing={linearTiming({ durationInFrames: beat })} />
        <TransitionSeries.Sequence name="Outro" durationInFrames={4 * bar}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Track name="Music">
        <Music />
      </Track>
      <Track name="Sound effects">
        <Audio name="Send click" src={staticFile("sfx/mouse-click.wav")} from={4 * bar + 6 * beat} volume={0.9} />
        <Audio name="Reminder ding" src={staticFile("sfx/ding.wav")} from={4 * bar + 11 * beat} volume={0.45} />
        <Audio name="Whoosh to expenses" src={staticFile("sfx/whoosh.wav")} from={8 * bar - 6} volume={0.8} />
        <Audio name="Row one" src={staticFile("sfx/switch.wav")} from={8 * bar + 3 * beat} volume={0.6} />
        <Audio name="Row two" src={staticFile("sfx/switch.wav")} from={8 * bar + 4 * beat} volume={0.6} />
        <Audio name="Whip to features" src={staticFile("sfx/whip.wav")} from={11 * bar - 4} volume={0.6} />
        <Audio name="Whoosh to integrations" src={staticFile("sfx/whoosh.wav")} from={14 * bar - 6} volume={0.8} />
      </Track>
    </AbsoluteFill>
  );
};
