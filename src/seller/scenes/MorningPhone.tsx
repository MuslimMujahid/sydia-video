import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, easeInOut, easeOut, fontFamily, textGradient } from "../../promo/theme";
import { CameraStage, type CamKey, Place } from "../../showcase/components/Camera";
import { type ChatMsg, type Compose, Phone, wa } from "../../showcase/components/Phone";
import { type Caption, CaptionView } from "../../showcase/scenes/DesktopAct";
import { clamp } from "../../showcase/ui";
import { Avatar, ChatList, ForwardSheet, LIST_TOP, LockStack, SHEET_FIRST, SHEET_ROW, SHEET_SEND, Taps } from "../components/PhoneScreens";
import { clockAt } from "../components/Scenery";
import { CUSTOMERS, ORDER_MSG, ROUNDS } from "../data";
import { at, BAR, INTRO, SECTIONS as S } from "../timeline";

// ------------------------------------------------------------------ script (phone-local frames)
/** MorningPhone runs in a Sequence from PHONE, so M and every other frame below are local to it. */
export const PHONE = at(S.wake);
const local = (bar: number) => at(bar) - PHONE;
const ENTER = INTRO.phone - PHONE; // the phone rises in once the alarm clock is off

export const M = {
  unlock: 222,
  tapRina: 400,
  cust: 410,
  press: 450, // long-press starts
  sel: 464,
  fwdTap: 490,
  sheet: 496,
  pick: 524,
  send: 548,
  sydia: 558,
  fwd1: 566,
  cmd1: 652,
  bot1: 694,
  exit: 1064,
};
const LOCK_NOTES = [
  { who: "tini" as const, at: 104 },
  { who: "dedi" as const, at: 120 },
  { who: "lia" as const, at: 136 },
];
const LIST_ARRIVALS = [
  { who: "tini" as const, at: -1, unread: 1, time: "05.41" },
  { who: "dedi" as const, at: -1, unread: 2, time: "05.48" },
  { who: "lia" as const, at: -1, unread: 1, time: "05.52" },
  { who: "yusuf" as const, at: 268, unread: 1, time: "06.01" },
  { who: "rina" as const, at: 316, unread: 2, time: "06.01" },
];
export const LIST_PINGS = LIST_ARRIVALS.filter((a) => a.at > 0).map((a) => a.at);
export const LOCK_PINGS = LOCK_NOTES.map((n) => n.at);

/** Round k of the quick forwards: the customer card flies in, Sari types, Sydia confirms. */
export const roundAt = (k: number) => local(S.more) + k * BAR;
export const R = { fwd: 16, type: 22, cmd: 36, typing: 38, bot: 50 };

const custMsgs: ChatMsg[] = [
  { kind: "chip", at: -1, label: "Hari ini" },
  { kind: "text", from: "bot", at: -1, time: "05.58", lines: ["Pagi, Kak Sari"] },
  { kind: "text", from: "bot", at: -1, time: "06.01", lines: ORDER_MSG.rina, sel: M.sel },
];

const sydiaMsgs: ChatMsg[] = [
  { kind: "chip", at: M.fwd1, label: "Hari ini" },
  { kind: "text", from: "me", at: M.fwd1, time: "06.05", lines: ORDER_MSG.rina, fwd: true },
  { kind: "text", from: "me", at: M.cmd1, time: "06.06", lines: ["Buat catatan pemesanan untuk", "hari ini dan masukkan pesanan ini"] },
  {
    kind: "text",
    from: "bot",
    at: M.bot1,
    time: "06.06",
    hl: [M.bot1 + 16],
    lines: ["Siap, Kak Sari! Catatan baru", "sudah dibuat: ==Pesanan 9 Nov 2026==", "", "1. Bu Rina — keripik pisang 3,", "    sambal roa 2 · Jl. Melati 12", "", "Teruskan saja pesanan berikutnya,", "nanti saya tambahkan."],
  },
  ...ROUNDS.flatMap((r, k): ChatMsg[] => {
    const f = roundAt(k);
    return [
      { kind: "text", from: "me", at: f + R.fwd, time: r.time, lines: ORDER_MSG[r.who], fwd: true },
      { kind: "text", from: "me", at: f + R.cmd, time: r.time, lines: [r.say] },
      { kind: "text", from: "bot", at: f + R.bot, time: r.time, lines: r.reply, hl: [f + R.bot + 8] },
    ];
  }),
];

const sydiaCompose: Compose[] = [
  { start: 586, send: M.cmd1, text: "Buat catatan pemesanan untuk hari ini dan masukkan pesanan ini" },
  ...ROUNDS.map((r, k) => ({ start: roundAt(k) + R.type, send: roundAt(k) + R.cmd, text: r.say })),
];
const sydiaTyping: (readonly [number, number])[] = [[M.cmd1 + 4, M.bot1], ...ROUNDS.map((_, k) => [roundAt(k) + R.typing, roundAt(k) + R.bot] as const)];

// ------------------------------------------------------------------ camera
// World coords: the phone is centred on the origin, so screen (sx, sy) sits at (sx - 222, sy - 467).
const KEYS: CamKey[] = [
  // picked up: face-on, slid right for the headline, then the notifications
  { f: 104, x: -440, y: 0, dolly: -10, rx: -3, ry: 4 },
  { f: 140, x: -440, y: 0, dolly: 10, rx: 0, ry: 3 },
  { f: 172, x: 0, y: 30, dolly: 540, rx: 0, ry: 0 },
  { f: 214, x: 0, y: 30, dolly: 560, rx: 0, ry: 0 },
  // WhatsApp: new chats land at the top of the list
  { f: 242, x: 0, y: -40, dolly: 520, rx: 0, ry: 0 },
  { f: 390, x: 0, y: -70, dolly: 560, rx: 0, ry: 0 },
  // Bu Rina's order → long-press → forward icon
  { f: 428, x: 0, y: -150, dolly: 640, rx: 0, ry: 0 },
  { f: 470, x: 20, y: -170, dolly: 650, rx: 0, ry: 0 },
  { f: 486, x: 110, y: -300, dolly: 700, rx: 0, ry: 0 },
  // forward sheet: pick Sydia, send
  { f: 508, x: 0, y: 0, dolly: 420, rx: 0, ry: 0 },
  { f: 530, x: 20, y: 60, dolly: 420, rx: 0, ry: 0 },
  { f: 550, x: 40, y: 140, dolly: 440, rx: 0, ry: 0 },
  // Sydia's chat: the forwarded order lands (headline on the left), she types the request
  { f: 570, x: -440, y: -60, dolly: 40, rx: 0, ry: 2 },
  { f: 600, x: -440, y: -60, dolly: 60, rx: 0, ry: 2 },
  { f: 622, x: 0, y: 330, dolly: 620, rx: 3, ry: 0 },
  { f: 656, x: 0, y: 330, dolly: 630, rx: 3, ry: 0 },
  { f: 698, x: 0, y: 140, dolly: 520, rx: 1, ry: 0 },
  { f: 770, x: 0, y: 130, dolly: 540, rx: 1, ry: 0 },
  // quick forwards: pulled back so the customer card, the phone and the tally share the frame
  { f: local(S.more) + 6, x: 0, y: 30, dolly: 40, rx: 0, ry: 0 },
  { f: M.exit, x: 0, y: 30, dolly: 70, rx: 0, ry: 0, ease: (t) => t },
  { f: local(S.afternoon) + 40, x: 0, y: 0, dolly: -240, rx: 0, ry: 0 },
];

export const morningCaptions: Caption[] = [
  { from: 104, to: 330, title: "Baru bangun,", accent: "pesanan numpuk.", pos: "l" },
  { from: 562, to: 780, title: "Teruskan", accent: "ke Sydia.", pos: "l" },
  { from: local(S.more) + 4, to: M.exit, title: "Cukup sekali instruksi.", accent: "Sisanya tambahkan saja." },
];

// ------------------------------------------------------------------ side cards
/** Each follow-up order shows up as the customer's own bubble, then flies into Sydia's chat. */
const FlyCard: React.FC<{ readonly k: number }> = ({ k }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = roundAt(k);
  if (frame < f0 - 16 || frame > f0 + R.fwd + 4) return null;
  const r = ROUNDS[k];
  const c = CUSTOMERS[r.who];
  const inP = spring({ frame: frame - (f0 - 16), fps, config: { damping: 15, stiffness: 190, mass: 0.6 } });
  const fly = interpolate(frame, [f0 + 2, f0 + R.fwd], [0, 1], { ...clamp, easing: easeInOut });
  const x = interpolate(fly, [0, 1], [-500, 10]);
  const y = interpolate(fly, [0, 0.5, 1], [-60, 40, 300]);
  return (
    <Place x={x} y={y} z={fly * 40} scale={(0.9 + inP * 0.1) * (1 - fly * 0.35)} opacity={Math.min(1, inP) * (1 - interpolate(fly, [0.75, 1], [0, 1], clamp))}>
      <div style={{ width: 380, padding: "18px 20px 16px", borderRadius: 26, backgroundColor: "white", boxShadow: "0 30px 60px -24px rgba(23,20,25,0.45)", fontFamily, rotate: `${(1 - fly) * -3}deg` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar c={c} size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: wa.ink }}>{c.name}</div>
            <div style={{ fontSize: 14, color: wa.meta }}>WhatsApp · {r.time}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, backgroundColor: "#e7f8f2", color: wa.green, fontSize: 15, fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={wa.green} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 5 6 6-6 6" />
              <path d="M21 11H11a7 7 0 0 0-7 7v1" />
            </svg>
            Teruskan
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 21, lineHeight: "30px", color: wa.ink }}>
          {ORDER_MSG[r.who].map((l) => (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </Place>
  );
};

/** Sydia's running tally, ticking up with every receipt in the chat. */
const Tally: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const done = [M.bot1, ...ROUNDS.map((_, k) => roundAt(k) + R.bot)];
  const names = ["Bu Rina", ...ROUNDS.map((r) => CUSTOMERS[r.who].name)];
  const n = done.filter((f) => frame >= f).length;
  const inP = spring({ frame: frame - (local(S.more) - 10), fps, config: { damping: 16, stiffness: 160, mass: 0.7 } });
  const bump = done.reduce((acc, f) => Math.max(acc, interpolate(frame, [f, f + 4, f + 14], [0, 1, 0], clamp)), 0);
  const out = interpolate(frame, [M.exit - 4, M.exit + 10], [0, 1], { ...clamp, easing: easeInOut });
  if (frame < local(S.more) - 12) return null;
  return (
    <Place x={505} y={-10} opacity={Math.min(1, inP) * (1 - out)} scale={0.9 + inP * 0.1}>
      <div style={{ width: 330, padding: "26px 28px 24px", borderRadius: 32, backgroundColor: "rgba(255,255,255,0.94)", boxShadow: "0 30px 70px -28px rgba(23,20,25,0.45), 0 20px 60px -30px rgba(140,92,255,0.4)", fontFamily, color: colors.ink }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: colors.muted }}>Pesanan hari ini</div>
        <div style={{ fontSize: 124, fontWeight: 800, letterSpacing: "-0.06em", lineHeight: 1.05, backgroundImage: textGradient, WebkitBackgroundClip: "text", color: "transparent", scale: String(1 + bump * 0.12), transformOrigin: "0% 60%", width: "max-content", paddingRight: 8 }}>{n}</div>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {names.map((name, i) => {
            const p = interpolate(frame, [done[i], done[i] + 10], [0, 1], { ...clamp, easing: easeOut });
            return (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 20, fontWeight: 600, opacity: 0.25 + p * 0.75 }}>
                <div style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: p > 0 ? "#10b981" : "rgba(23,20,25,0.1)", display: "flex", alignItems: "center", justifyContent: "center", scale: String(0.6 + p * 0.4) }}>
                  {p > 0 ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  ) : null}
                </div>
                {name}
              </div>
            );
          })}
        </div>
      </div>
    </Place>
  );
};

// ------------------------------------------------------------------ phone
const SyncedPhone: React.FC = () => {
  const frame = useCurrentFrame();
  const time = clockAt(frame + PHONE);
  const unlockP = interpolate(frame, [M.unlock, M.unlock + 10], [0, 1], { ...clamp, easing: easeInOut });
  const custP = interpolate(frame, [M.cust, M.cust + 8], [0, 1], clamp);
  const sydP = interpolate(frame, [M.sydia, M.sydia + 8], [0, 1], clamp);
  const selectPress = interpolate(frame, [M.fwdTap - 2, M.fwdTap, M.fwdTap + 8], [0, 1, 0], clamp);
  const layer = (o: number, node: React.ReactNode) => (o > 0 ? <div style={{ position: "absolute", inset: 0, opacity: o }}>{node}</div> : null);
  return (
    <div style={{ position: "relative", width: 470, height: 960 }}>
      {layer(
        1 - custP,
        <Phone
          time={time}
          screen={<ChatList arrivals={LIST_ARRIVALS} tapped={{ key: "rina", at: M.tapRina }} />}
          overlay={<Taps taps={[{ at: M.tapRina, x: 210, y: LIST_TOP + 41 }]} />}
        />,
      )}
      {layer(
        1 - unlockP,
        <Phone time="06.00" lock={{ date: "Senin, 9 November", content: <LockStack notes={LOCK_NOTES} moreAt={156} /> }} overlay={<Taps taps={[{ at: M.unlock - 4, x: 222, y: 900 }]} />} />,
      )}
      {layer(
        custP * (1 - sydP),
        <Phone
          time={time}
          msgs={custMsgs}
          contact={{ name: "Bu Rina", avatar: <Avatar c={CUSTOMERS.rina} />, status: "terakhir dilihat 06.01" }}
          select={M.sel}
          selectPress={selectPress}
          overlay={
            <>
              <ForwardSheet at={M.sheet} pick={M.pick} send={M.send} until={M.sydia + 10} />
              <Taps
                taps={[
                  { at: M.press, x: 200, y: 346, hold: 14 },
                  { at: M.fwdTap, x: 410, y: 91 },
                  { at: M.pick, x: 160, y: SHEET_FIRST + SHEET_ROW / 2 },
                  { at: M.send, x: SHEET_SEND.x, y: SHEET_SEND.y },
                ]}
              />
            </>
          }
        />,
      )}
      {layer(sydP, <Phone time={time} msgs={sydiaMsgs} compose={sydiaCompose} typing={sydiaTyping} />)}
    </div>
  );
};

export const MorningPhone: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [ENTER, ENTER + 34], [0, 1], { ...clamp, easing: easeOut });
  const exit = interpolate(frame, [M.exit, M.exit + 34], [0, 1], { ...clamp, easing: easeInOut });
  if (frame < ENTER) return null;
  return (
    <AbsoluteFill>
      <CameraStage keys={KEYS} drift={0.4}>
        <Place y={(1 - enter) * 1300 + exit * 1500} rx={(1 - enter) * 24 - exit * 30} z={-exit * 200}>
          <SyncedPhone />
        </Place>
        {ROUNDS.map((_, k) => (
          <FlyCard key={k} k={k} />
        ))}
        <Tally />
      </CameraStage>
      {morningCaptions.map((c) => (
        <CaptionView key={c.title} c={c} />
      ))}
    </AbsoluteFill>
  );
};
