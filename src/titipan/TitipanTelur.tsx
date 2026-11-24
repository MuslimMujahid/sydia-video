import { Audio } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, Track, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "./components/Stage";
import { Cta } from "./scenes/Cta";
import { Egg } from "./scenes/Egg";
import { Hook } from "./scenes/Hook";
import { Busy, Reminder } from "./scenes/Road";
import { Spotlight } from "./scenes/Spotlight";
import { Modes, Summary } from "./scenes/Split";
import { Timeline } from "./scenes/Timeline";
import { clamp } from "./theme";
import { cue, len, SCENES as S, type SceneId, voEnd } from "./timeline";
import { VO } from "./voiceover";

// ------------------------------------------------------------------ audio
const VOICE = (Object.keys(S) as SceneId[]).map((id) => ({ id, clip: S[id].clip, from: S[id].from + S[id].vo, frames: VO[S[id].clip].frames }));

/** "Titip Senyum" dips under Haruka's voice and fades at the very end. */
const Music: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const duck = Math.max(0, ...VOICE.map((v) => interpolate(frame, [v.from - 8, v.from, v.from + v.frames, v.from + v.frames + 10], [0, 1, 1, 0], clamp)));
  const fade = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], clamp);
  return <Audio name="Titip Senyum (music)" src={staticFile("music/titipan-telur.wav")} volume={(1 - duck * 0.55) * 0.8 * fade} />;
};

/** Sound effect lengths in frames. */
const SFX_FRAMES: Record<string, number> = { "titipan/egg-crack.mp3": 31, "titipan/typing.mp3": 37, "titipan/soft-buzz.mp3": 25, "titipan/sparkle.mp3": 45, "titipan/reminder.mp3": 45, "titipan/pen-writing.mp3": 31, ding: 42, notify: 27, pop: 4, switch: 10, whip: 6, whoosh: 5 };
const sfx = (name: string, file: string, from: number, volume: number) => ({ name, file: file.includes(".") ? file : `${file}.wav`, from, volume, durationInFrames: SFX_FRAMES[file] });
type Effect = ReturnType<typeof sfx>;
/** Global frame of a scene-relative frame. */
const g = (scene: SceneId, f: number) => S[scene].from + f;

const effects: Effect[] = [
  sfx("Haruka bursts in", "whoosh", g("hook", cue("hook", "malahLupa")), 0.35),
  sfx("Bubble: Telurnya mana?", "pop", g("hook", cue("hook", "malahLupa") + 8), 0.45),
  sfx("Pin: 5 tahun lalu", "pop", g("timeline", cue("timeline", "masihJelas")), 0.45),
  sfx("Pin: tadi pagi", "pop", g("timeline", cue("timeline", "tadiPagi")), 0.35),
  sfx("Blur: udah kabur", "whoosh", g("timeline", cue("timeline", "udahKabur")), 0.3),
  sfx("Split: mode 1", "whip", g("modes", cue("modes", "dua") + 12), 0.18),
  sfx("Split: mode 2", "whip", g("modes", cue("modes", "mode") - 16), 0.18),
  sfx("Idea: lightbulb", "ding", g("modes", cue("modes", "mode")), 0.35),
  sfx("Spotlight on", "switch", g("spotlight", cue("spotlight", "fokus")), 0.55),
  sfx("Term typed", "titipan/typing.mp3", g("egg", cue("egg", "term")), 0.3),
  sfx("Egg cracks", "titipan/egg-crack.mp3", g("egg", cue("egg", "duaHal")), 0.5),
  sfx("APA ✓", "pop", g("egg", cue("egg", "apa")), 0.3),
  sfx("KAPAN ✗", "titipan/soft-buzz.mp3", g("egg", cue("egg", "bolong")), 0.25),
  sfx("Distraction: chat", "notify", g("road", cue("road", "chat")), 0.3),
  sfx("Distraction: deadline", "notify", g("road", cue("road", "deadline")), 0.3),
  sfx("Distraction: macet", "notify", g("road", cue("road", "macet")), 0.3),
  sfx("Shop flies past", "whoosh", g("road", cue("road", "aktivitas") + 6), 0.4),
  sfx("Reminder at the shop", "titipan/reminder.mp3", g("reminder", cue("reminder", "pengingat")), 0.4),
  sfx("List item written", "titipan/pen-writing.mp3", g("reminder", cue("reminder", "daftar") + 4), 0.4),
  sfx("List item ticked", "ding", g("reminder", cue("reminder", "daftar") + 26), 0.2),
  sfx("Egg hops on", "pop", g("reminder", cue("reminder", "daftar") + 28), 0.35),
  sfx("Summary: left", "whip", g("summary", cue("summary", "kiri")), 0.25),
  sfx("Summary: right", "whip", g("summary", cue("summary", "kanan")), 0.25),
  sfx("Thumbs up sparkle", "titipan/sparkle.mp3", g("cta", cue("cta", "komentar")), 0.3),
];

const toLanes = (items: Effect[]) => {
  const lanes: Effect[][] = [];
  for (const e of [...items].sort((a, b) => a.from - b.from)) {
    const lane = lanes.find((l) => l[l.length - 1].from + l[l.length - 1].durationInFrames <= e.from);
    if (lane) lane.push(e);
    else lanes.push([e]);
  }
  return lanes;
};

/** The spotlight's hum, from the click until the stage clears. */
const HUM_FROM = g("spotlight", cue("spotlight", "fokus"));
const HUM_LEN = S.egg.from - HUM_FROM;

/**
 * 1:1 TOFU explainer, ~94 s, narrated by Haruka (ElevenLabs "Cahaya", eleven_v4) on an original
 * 112.5 BPM acoustic track: why an embarrassing moment from five years ago sticks while the egg
 * errand from this morning slips, and how a reminder at the right spot fixes it. Follows the Penpot
 * storyboard "Kenapa kejadian memalukan 5 tahun lalu masih ingat, tapi Ibu nitip beli telur malah lupa?".
 */
export const TitipanTelur: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <Track name="Scenes">
      <Sequence name="S1 · Hook" from={S.hook.from} durationInFrames={len("hook")}>
        <Hook />
      </Sequence>
      <Sequence name="S2 · Timeline" from={S.timeline.from} durationInFrames={len("timeline")}>
        <Timeline />
      </Sequence>
      <Sequence name="S3 · Dua mode" from={S.modes.from} durationInFrames={len("modes")}>
        <Modes />
      </Sequence>
      <Sequence name="S4 · Emosi (spotlight)" from={S.spotlight.from} durationInFrames={len("spotlight")}>
        <Spotlight />
      </Sequence>
      <Sequence name="S5 · Prospective memory (egg)" from={S.egg.from} durationInFrames={len("egg")}>
        <Egg />
      </Sequence>
      <Sequence name="S6 · Pikiran sibuk (road)" from={S.road.from} durationInFrames={len("road")}>
        <Busy />
      </Sequence>
      <Sequence name="S7 · Pasang pengingat (road)" from={S.reminder.from} durationInFrames={len("reminder")}>
        <Reminder />
      </Sequence>
      <Sequence name="S8 · Intinya (split)" from={S.summary.from} durationInFrames={len("summary")}>
        <Summary />
      </Sequence>
      <Sequence name="S9 · CTA" from={S.cta.from} durationInFrames={len("cta")}>
        <Cta />
      </Sequence>
    </Track>
    <Track name="Music">
      <Music />
    </Track>
    <Track name="Voice-over (Haruka)">
      {VOICE.map((v) => (
        <Sequence key={v.id} name={v.clip} from={v.from} durationInFrames={voEnd(v.id) - S[v.id].vo + 4} layout="none">
          <Audio name={v.clip} src={staticFile(`voiceover/titipan/${v.clip}.mp3`)} volume={0.85} />
        </Sequence>
      ))}
    </Track>
    <Track name="Ambience">
      <Sequence name="Spotlight hum" from={HUM_FROM} durationInFrames={HUM_LEN} layout="none">
        <Audio name="Spotlight hum" src={staticFile("sfx/titipan/spotlight-hum.mp3")} loop volume={(f) => interpolate(f, [0, 10, HUM_LEN - 14, HUM_LEN], [0, 0.1, 0.1, 0], clamp)} />
      </Sequence>
    </Track>
    {toLanes(effects).map((lane, i) => (
      <Track key={i} name={i === 0 ? "Sound effects" : `Sound effects ${i + 1}`}>
        {lane.map((e) => (
          <Sequence key={e.name} name={e.name} from={e.from} durationInFrames={e.durationInFrames} layout="none">
            <Audio name={e.name} src={staticFile(`sfx/${e.file}`)} volume={e.volume} />
          </Sequence>
        ))}
      </Track>
    ))}
  </AbsoluteFill>
);
