import { Audio } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, Track, useCurrentFrame } from "remotion";
import { Grain } from "../sibuk/components/Paper";
import { Clock } from "./components/Clock";
import { BARS, Hasil, ISTILAH, Istilah, Kenapa, Metode, Riset, RISET } from "./scenes/Explain";
import { Chat, Freeze, FREEZE, Hook, HOOK, MasihYakin, MulaiSerius, Panik, S2A, S2C } from "./scenes/Opening";
import { Penutup, PENUTUP, Tips1, TIPS1, Tips2, Tips3, TIPS3 } from "./scenes/Tips";
import { clamp } from "./theme";
import { cue, len, PENJELASAN_FROM, SCENES as S, type SceneId, TOTAL_FRAMES, VOICED, YAKIN_END } from "./timeline";
import { VO } from "./voiceover";

// ------------------------------------------------------------------ audio
const VOICE = VOICED.map((id) => {
  const s = S[id] as { from: number; vo: number; clip: keyof typeof VO };
  return { id, clip: s.clip, from: s.from + s.vo, frames: VO[s.clip].frames, durationInFrames: VO[s.clip].frames + 4 };
});

/** How much the music dips under Haruka's voice at a frame (0–1). */
const useDuck = () => {
  const frame = useCurrentFrame();
  return Math.max(0, ...VOICE.map((v) => interpolate(frame, [v.from - 6, v.from, v.from + v.frames, v.from + v.frames + 10], [0, 1, 1, 0], clamp)));
};

/** "Yakin" (120 BPM): S1–S2c, stops dead at the cut to "Udah, Har?". */
const MusicYakin: React.FC = () => {
  const duck = useDuck();
  return <Audio name="Yakin (music)" src={staticFile("music/fallacy-yakin.wav")} volume={(1 - duck * 0.5) * 0.75} />;
};

/** "Penjelasan" (100 BPM): S4 to the end; rises for the close. */
const MusicPenjelasan: React.FC = () => {
  const duck = useDuck();
  return <Audio name="Penjelasan (music)" src={staticFile("music/fallacy-penjelasan.wav")} volume={(1 - duck * 0.55) * 0.7} />;
};

/** Sound effect lengths in frames. */
const SFX_FRAMES: Record<string, number> = {
  "fallacy/paper-slap.mp3": 16,
  "fallacy/paper-rip.mp3": 22,
  "fallacy/tape-stick.mp3": 16,
  "fallacy/page-drop.mp3": 19,
  "fallacy/scrub.mp3": 43,
  "fallacy/keys-fast.mp3": 62,
  "fallacy/marker.mp3": 19,
  "fallacy/send.mp3": 16,
  "titipan/typing.mp3": 37,
  "sibuk/pen-tick.mp3": 16,
  "sibuk/pen-scratch.mp3": 46,
  notify: 27,
  pop: 4,
  whip: 6,
  ding: 42,
};
const sfx = (name: string, file: string, from: number, volume: number, cut?: number) => ({ name, file: file.includes(".") ? file : `${file}.wav`, from, volume, durationInFrames: Math.min(cut ?? Infinity, SFX_FRAMES[file]) });
type Effect = ReturnType<typeof sfx>;
/** Global frame of a scene-relative frame. */
const g = (scene: SceneId, f: number) => S[scene].from + f;
const slap = (name: string, scene: SceneId, f: number, volume = 0.45) => sfx(name, "fallacy/paper-slap.mp3", g(scene, f), volume);

const effects: Effect[] = [
  // S1
  sfx("Marker rings 'meremehkan waktu'", "fallacy/marker.mp3", g("hook", cue("hook", "meremehkan") + 2), 0.35),
  // S1b
  sfx("Boss's chat", "notify", g("chat", HOOK.ask), 0.35),
  sfx("'10 menit' sent", "fallacy/send.mp3", g("chat", HOOK.reply), 0.4),
  // S2a–S2c
  sfx("Typing, relaxed", "titipan/typing.mp3", g("s2a", 4), 0.22),
  slap("Strip: catatan berantakan", "s2a", S2A.catatan),
  sfx("Typing, slower", "titipan/typing.mp3", g("s2b", 20), 0.18, 30),
  slap("Strip: review rekaman", "s2b", cue("s2b", "cek") + 2),
  sfx("Scrubbing the recording", "fallacy/scrub.mp3", g("s2b", cue("s2b", "cek") + 6), 0.28),
  sfx("Scrubbing, again", "fallacy/scrub.mp3", g("s2b", cue("s2b", "cek") + 6 + 43), 0.24, len("s2b") - cue("s2b", "cek") - 6 - 43),
  sfx("Typing, frantic", "fallacy/keys-fast.mp3", g("s2c", 0), 0.3, len("s2c")),
  slap("Strip: konfirmasi ke peserta", "s2c", S2C.peserta),
  sfx("Chat ping", "notify", g("s2c", cue("s2c", "konfirmasi") - 10), 0.22),
  // S3
  sfx("'Udah, Har?'", "notify", g("freeze", FREEZE.ask), 0.5),
  // S4
  slap("Strip: Namanya", "istilah", ISTILAH.label),
  sfx("PLANNING FALLACY printed", "whip", g("istilah", cue("istilah", "planning")), 0.3),
  sfx("Tape", "fallacy/tape-stick.mp3", g("istilah", ISTILAH.tape), 0.3),
  sfx("Underline", "fallacy/marker.mp3", g("istilah", ISTILAH.underline), 0.3),
  // S5
  sfx("Straight line drawn", "sibuk/pen-scratch.mp3", g("kenapa", cue("kenapa", "bayangkan") + 4), 0.25, 34),
  slap("Strip: catatan berantakan (road)", "kenapa", cue("kenapa", "hambatan") - 6 + 4, 0.4),
  slap("Strip: review rekaman (road)", "kenapa", cue("kenapa", "hambatan") - 6 + 28, 0.4),
  slap("Strip: konfirmasi (road)", "kenapa", cue("kenapa", "hambatan") - 6 + 54, 0.4),
  // S6a
  slap("Strip: Risetnya", "riset", RISET.label),
  sfx("Journal page lands", "fallacy/page-drop.mp3", g("riset", RISET.page + 4), 0.45),
  sfx("Tape, top left", "fallacy/tape-stick.mp3", g("riset", RISET.page + 10), 0.3),
  sfx("Tape, bottom right", "fallacy/tape-stick.mp3", g("riset", RISET.page + 14), 0.25),
  sfx("Year ringed", "fallacy/marker.mp3", g("riset", cue("riset", "tahun")), 0.3),
  // S6b
  slap("Strip: Metodenya", "metode", 0),
  slap("Estimasi 1", "metode", cue("metode", "realistis")),
  slap("Estimasi 2", "metode", cue("metode", "lancar")),
  slap("Estimasi 3", "metode", cue("metode", "kacau")),
  // S6c
  slap("Strip: Hasilnya", "hasil", 2),
  sfx("Bar: 27 hari", "fallacy/paper-rip.mp3", g("hasil", BARS.first), 0.3),
  sfx("Bar: 34 hari", "fallacy/paper-rip.mp3", g("hasil", BARS.first + BARS.gap), 0.32),
  sfx("Bar: 49 hari", "fallacy/paper-rip.mp3", g("hasil", BARS.first + 2 * BARS.gap), 0.34),
  sfx("Bar: 55 hari", "fallacy/paper-rip.mp3", g("hasil", cue("hasil", "lima")), 0.45),
  sfx("Punchline printed", "whip", g("hasil", cue("hasil", "bahkan")), 0.3),
  // S7a
  slap("Strip: Tips 1", "tips1", TIPS1.label),
  ...[0, 1, 2, 3, 4].map((i) => sfx(`Step ${i + 1}`, "sibuk/pen-tick.mp3", g("tips1", TIPS1.steps(i)), 0.35, 10)),
  slap("Strip: = ±45 menit", "tips1", cue("tips1", "jauh")),
  sfx("±45 menit ding", "ding", g("tips1", cue("tips1", "jauh") + 2), 0.2),
  // S7b
  slap("Strip: Tips 2", "tips2", 2),
  sfx("Last week's note", "pop", g("tips2", cue("tips2", "mom")), 0.4),
  sfx("→ 45 menit", "sibuk/pen-tick.mp3", g("tips2", cue("tips2", "berapa")), 0.35),
  // S7c
  slap("Strip: Tips 3", "tips3", 2),
  sfx("Heads-up sent", "fallacy/send.mp3", g("tips3", TIPS3.sent), 0.4),
  sfx("Boss replies", "notify", g("tips3", TIPS3.reply), 0.35),
  // S8
  sfx("CTA band tears up", "fallacy/paper-rip.mp3", g("penutup", PENUTUP.band), 0.4),
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
 * 9:16 TOFU Reel, "Cuma 10 Menit" (planning fallacy). Haruka promises a MoM in "10 menit", it takes 47;
 * then she explains the term with what we just watched, the 1994 study, and three tips. She acts it from
 * her real art (cross-faded between poses on her words) and narrates (ElevenLabs "Cahaya", eleven_v4).
 * Two original acoustic tracks: a cheerful 120 BPM one that stops dead at "Udah, Har?", and a 100 BPM
 * explainer bed that lifts for the tips and the close. Follows the Penpot storyboard
 * "Stroyboard - Planning fallacy". No Sydia mention (TOFU).
 */
export const CumaSepuluhMenit: React.FC = () => (
  <AbsoluteFill>
    <Sequence name="Paper grain">
      <Grain />
    </Sequence>
    <Track name="Scenes">
      <Sequence name="S1 · Hook + cover (13.00)" from={S.hook.from} durationInFrames={len("hook")}>
        <Hook />
      </Sequence>
      <Sequence name="S1b · Chat · Kira-kira berapa lama? (13.00)" from={S.chat.from} durationInFrames={len("chat")}>
        <Chat />
      </Sequence>
      <Sequence name="S2a · Menit ke-2 (masih yakin)" from={S.s2a.from} durationInFrames={len("s2a")}>
        <MasihYakin />
      </Sequence>
      <Sequence name="S2b · Menit ke-25 (mulai serius)" from={S.s2b.from} durationInFrames={len("s2b")}>
        <MulaiSerius />
      </Sequence>
      <Sequence name="S2c · Menit ke-47 (panik)" from={S.s2c.from} durationInFrames={len("s2c")}>
        <Panik />
      </Sequence>
      <Sequence name="S3 · Freeze · Udah, Har?" from={S.freeze.from} durationInFrames={len("freeze")}>
        <Freeze />
      </Sequence>
      <Sequence name="S4 · Istilah · Planning fallacy" from={S.istilah.from} durationInFrames={len("istilah")}>
        <Istilah />
      </Sequence>
      <Sequence name="S5 · Kenapa · dibayangkan vs terjadi" from={S.kenapa.from} durationInFrames={len("kenapa")}>
        <Kenapa />
      </Sequence>
      <Sequence name="S6a · Riset" from={S.riset.from} durationInFrames={len("riset")}>
        <Riset />
      </Sequence>
      <Sequence name="S6b · Metode · 37 mahasiswa" from={S.metode.from} durationInFrames={len("metode")}>
        <Metode />
      </Sequence>
      <Sequence name="S6c · Hasil · 55 hari" from={S.hasil.from} durationInFrames={len("hasil")}>
        <Hasil />
      </Sequence>
      <Sequence name="S7a · Tips 1 · pecah jadi langkah" from={S.tips1.from} durationInFrames={len("tips1")}>
        <Tips1 />
      </Sequence>
      <Sequence name="S7b · Tips 2 · patokan" from={S.tips2.from} durationInFrames={len("tips2")}>
        <Tips2 />
      </Sequence>
      <Sequence name="S7c · Tips 3 · bilang dari awal" from={S.tips3.from} durationInFrames={len("tips3")}>
        <Tips3 />
      </Sequence>
      <Sequence name="S8 · Penutup + CTA" from={S.penutup.from} durationInFrames={len("penutup")}>
        <Penutup />
      </Sequence>
    </Track>
    <Track name="Clock">
      <Sequence name="Clock (13.00 → 13.47)" from={S.chat.from} durationInFrames={PENJELASAN_FROM - S.chat.from}>
        <Clock />
      </Sequence>
    </Track>
    <Track name="Music">
      <Sequence name="Yakin" durationInFrames={YAKIN_END} layout="none">
        <MusicYakin />
      </Sequence>
      <Sequence name="Penjelasan" from={PENJELASAN_FROM} durationInFrames={TOTAL_FRAMES - PENJELASAN_FROM} layout="none">
        <MusicPenjelasan />
      </Sequence>
    </Track>
    {toLanes(VOICE).map((lane, i) => (
      <Track key={i} name={i === 0 ? "Voice-over (Haruka)" : `Voice-over ${i + 1}`}>
        {lane.map((v) => (
          <Sequence key={v.id} name={v.clip} from={v.from} durationInFrames={v.durationInFrames} layout="none">
            <Audio name={v.clip} src={staticFile(`voiceover/fallacy/${v.clip}.mp3`)} volume={0.9} />
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
