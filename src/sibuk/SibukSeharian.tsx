import { Audio } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, Track, useCurrentFrame } from "remotion";
import { Hud } from "./components/Hud";
import { Grain } from "./components/Paper";
import { Cta } from "./scenes/Cta";
import { Daftar, PEN } from "./scenes/Daftar";
import { Hening } from "./scenes/Hening";
import { Hook, Pullback } from "./scenes/Hook";
import { ChatLagi, Email, Meeting, Puncak, Revisi } from "./scenes/Montage";
import { CEK, Cek, Pagi, PAGI } from "./scenes/Pagi";
import { clamp } from "./theme";
import { cue, GILIRAN_FROM, len, PAGI_END, SCENES as S, type SceneId, TOTAL_FRAMES, VOICED } from "./timeline";
import { VO } from "./voiceover";

// ------------------------------------------------------------------ audio
const VOICE = VOICED.map((id) => ({ id, clip: S[id].clip, from: S[id].from + S[id].vo, frames: VO[S[id].clip].frames, durationInFrames: VO[S[id].clip].frames + 4 }));

/** How much the music dips under Haruka's voice at a frame (0–1). */
const useDuck = () => {
  const frame = useCurrentFrame();
  return Math.max(0, ...VOICE.map((v) => interpolate(frame, [v.from - 6, v.from, v.from + v.frames, v.from + v.frames + 10], [0, 1, 1, 0], clamp)));
};

/** "Sebentar Dulu" (120 BPM): from the hook to the notification peak, where it stops dead. */
const MusicPagi: React.FC = () => {
  const duck = useDuck();
  return <Audio name="Sebentar Dulu (music)" src={staticFile("music/sibuk-pagi.wav")} volume={(1 - duck * 0.5) * 0.75} />;
};

/** "Giliran" (100 BPM): the to-do list and the CTA. */
const MusicGiliran: React.FC = () => {
  const duck = useDuck();
  return <Audio name="Giliran (music)" src={staticFile("music/sibuk-giliran.wav")} volume={(1 - duck * 0.45) * 0.7} />;
};

/** Sound effect lengths in frames. */
const SFX_FRAMES: Record<string, number> = {
  "sibuk/key-tap.mp3": 16,
  "sibuk/rewind.mp3": 26,
  "sibuk/phone-buzz.mp3": 32,
  "sibuk/call-ring.mp3": 32,
  "sibuk/email.mp3": 22,
  "sibuk/notif-pile.mp3": 91,
  "sibuk/pen-scratch.mp3": 46,
  "sibuk/pen-tick.mp3": 16,
  "sibuk/soft-tap.mp3": 16,
  "titipan/typing.mp3": 37,
  notify: 27,
  pop: 4,
  whoosh: 5,
  whip: 6,
};
const sfx = (name: string, file: string, from: number, volume: number, cut?: number) => ({ name, file: file.includes(".") ? file : `${file}.wav`, from, volume, durationInFrames: Math.min(cut ?? Infinity, SFX_FRAMES[file]) });
type Effect = ReturnType<typeof sfx>;
/** Global frame of a scene-relative frame. */
const g = (scene: SceneId, f: number) => S[scene].from + f;

const effects: Effect[] = [
  sfx("Cursor tick", "sibuk/key-tap.mp3", g("hook", 1), 0.5),
  sfx("Pull back", "whoosh", g("pullback", 0), 0.3),
  sfx("Rewind to 09.02", "sibuk/rewind.mp3", g("pagi", 0), 0.45),
  sfx("Typing the first sentence", "titipan/typing.mp3", g("pagi", PAGI.typeFrom), 0.3),
  sfx("Typing, more", "titipan/typing.mp3", g("pagi", PAGI.typeFrom + 24), 0.25, 30),
  sfx("Phone buzzes", "sibuk/phone-buzz.mp3", g("pagi", PAGI.buzz), 0.55),
  sfx("Bubble: Pagi!", "pop", g("pagi", PAGI.buzz + 12), 0.4),
  sfx("Dina's message", "notify", g("cek", CEK.message), 0.35),
  sfx("Oke, bentar ya (sent)", "whip", g("cek", CEK.sent), 0.25),
  sfx("Meeting call", "sibuk/call-ring.mp3", g("meeting", 0), 0.35, 30),
  sfx("Email lands", "sibuk/email.mp3", g("email", 0), 0.45),
  sfx("Revisi ping", "notify", g("revisi", 0), 0.35),
  sfx("Chat ping", "notify", g("chat", 0), 0.35),
  sfx("Halo?? pop", "pop", g("chat", 3), 0.4),
  sfx("Notifications pile up", "sibuk/notif-pile.mp3", g("puncak", 0), 0.5, len("puncak")),
  ...PEN.writes.map((f, i) => sfx(`Pen: task ${i + 1}`, "sibuk/pen-scratch.mp3", g("daftar", f), 0.4, 11)),
  ...PEN.ticks.map((f, i) => sfx(`Tick: task ${i + 1}`, "sibuk/pen-tick.mp3", g("daftar", f), 0.45, 8)),
  sfx("Pen: Bales chat bos", "sibuk/pen-scratch.mp3", g("daftar", PEN.last), 0.35),
  sfx("CTA tap", "sibuk/soft-tap.mp3", g("cta", cue("cta", "tulis") + 6), 0.5),
];

/** Splits items into lanes with no overlaps (Studio doesn't allow overlapping items on one <Track>). */
const toLanes = <T extends { from: number; durationInFrames: number }>(items: T[]) => {
  const lanes: T[][] = [];
  for (const e of [...items].sort((a, b) => a.from - b.from)) {
    const lane = lanes.find((l) => l[l.length - 1].from + l[l.length - 1].durationInFrames <= e.from);
    if (lane) lane.push(e);
    else lanes.push([e]);
  }
  return lanes;
};

/**
 * 9:16 TOFU short, ~50 s, "Sebentar ×9": a whole day of answering whatever comes in while the proposal
 * stays at one sentence. Haruka acts it (her real art, cross-faded between poses) and narrates
 * (ElevenLabs "Cahaya", eleven_v4). Two original acoustic tracks: a bright 120 BPM groove that stops
 * dead at the notification peak, and a gentle 100 BPM resolve for the to-do list and the CTA.
 * Follows the Penpot storyboard "Storyboard - Sibuk seharian".
 */
export const SibukSeharian: React.FC = () => (
  <AbsoluteFill>
    <Sequence name="Paper grain">
      <Grain />
    </Sequence>
    <Track name="Scenes">
      <Sequence name="S1 · Hook (16.47)" from={S.hook.from} durationInFrames={len("hook")}>
        <Hook />
      </Sequence>
      <Sequence name="S2 · Tarik mundur" from={S.pullback.from} durationInFrames={len("pullback")}>
        <Pullback />
      </Sequence>
      <Sequence name="S3 · Pagi · chat pertama (×1)" from={S.pagi.from} durationInFrames={len("pagi")}>
        <Pagi />
      </Sequence>
      <Sequence name="S4 · Diminta cek (×2)" from={S.cek.from} durationInFrames={len("cek")}>
        <Cek />
      </Sequence>
      <Sequence name="S5a · Meeting (×3)" from={S.meeting.from} durationInFrames={len("meeting")}>
        <Meeting />
      </Sequence>
      <Sequence name="S5b · Email (×5)" from={S.email.from} durationInFrames={len("email")}>
        <Email />
      </Sequence>
      <Sequence name="S5c · Revisi (×7)" from={S.revisi.from} durationInFrames={len("revisi")}>
        <Revisi />
      </Sequence>
      <Sequence name="S5d · Chat lagi (×8)" from={S.chat.from} durationInFrames={len("chat")}>
        <ChatLagi />
      </Sequence>
      <Sequence name="S5e · Puncak (×9)" from={S.puncak.from} durationInFrames={len("puncak")}>
        <Puncak />
      </Sequence>
      <Sequence name="S6 · Hening" from={S.hening.from} durationInFrames={len("hening")}>
        <Hening />
      </Sequence>
      <Sequence name="S7 · Daftar tugas" from={S.daftar.from} durationInFrames={len("daftar")}>
        <Daftar />
      </Sequence>
      <Sequence name="S8 · Penutup + CTA" from={S.cta.from} durationInFrames={len("cta")}>
        <Cta />
      </Sequence>
    </Track>
    <Track name="Clock + counter">
      <Sequence name="Clock + counter">
        <Hud />
      </Sequence>
    </Track>
    <Track name="Music">
      <Sequence name="Sebentar Dulu" durationInFrames={PAGI_END} layout="none">
        <MusicPagi />
      </Sequence>
      <Sequence name="Giliran" from={GILIRAN_FROM} durationInFrames={TOTAL_FRAMES - GILIRAN_FROM} layout="none">
        <MusicGiliran />
      </Sequence>
    </Track>
    {toLanes(VOICE).map((lane, i) => (
      <Track key={i} name={i === 0 ? "Voice-over (Haruka)" : `Voice-over ${i + 1}`}>
        {lane.map((v) => (
          <Sequence key={v.id} name={v.clip} from={v.from} durationInFrames={v.durationInFrames} layout="none">
            <Audio name={v.clip} src={staticFile(`voiceover/sibuk/${v.clip}.mp3`)} volume={0.9} />
          </Sequence>
        ))}
      </Track>
    ))}
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
