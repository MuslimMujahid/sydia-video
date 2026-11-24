import type React from "react";

export const SCREEN_W = 1600;
export const SCREEN_H = 960;
const BEZ = 44;
export const LID_W = SCREEN_W + BEZ * 2;
export const LID_H = SCREEN_H + BEZ * 2;
const BASE_W = LID_W + 80;
const BASE_D = 1120;

/** The lid hinges this far above the base so it closes on top of it. */
const HINGE = 26;

const alu = "linear-gradient(160deg, #e9e6ea 0%, #cfcbd2 45%, #b9b4bd 100%)";

/**
 * A laptop in world space with its hinge at the origin. `lid` is the lid angle in degrees:
 * -90 lies shut on the base, 0 stands upright, positive tilts it back. `on` (0→1) lights the
 * screen. The screen's centre sits HINGE + LID_H / 2 above the base. View it with a negative
 * camera `rx` to look down on it.
 */
export const Laptop: React.FC<{ readonly lid: number; readonly on: number; readonly children: React.ReactNode }> = ({ lid, on, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformStyle: "preserve-3d" }}>
    <div style={{ position: "absolute", left: -BASE_W / 2, top: 0, width: BASE_W, height: BASE_D, transformOrigin: "50% 0%", transform: "rotateX(90deg)", borderRadius: "14px 14px 46px 46px", background: alu, boxShadow: "0 0 0 2px rgba(255,255,255,0.4) inset" }}>
      <div style={{ position: "absolute", left: 120, right: 120, top: 70, height: 560, borderRadius: 16, backgroundColor: "#2a272e", backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.07) 2px, transparent 2px), linear-gradient(0deg, rgba(255,255,255,0.07) 2px, transparent 2px)", backgroundSize: "102px 93px" }} />
      <div style={{ position: "absolute", left: "50%", top: 700, width: 640, height: 360, translate: "-50% 0", borderRadius: 22, background: "linear-gradient(160deg, #dedae0, #c4bfc7)", boxShadow: "inset 0 0 0 2px rgba(23,20,25,0.06)" }} />
    </div>
    <div style={{ position: "absolute", left: -LID_W / 2, top: -LID_H - HINGE, width: LID_W, height: LID_H, transformOrigin: "50% 100%", transform: `rotateX(${lid}deg)`, transformStyle: "preserve-3d" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 40, backgroundColor: "#121014", padding: BEZ, backfaceVisibility: "hidden", boxShadow: "inset 0 0 0 3px #3a363e" }}>
        <div style={{ position: "relative", width: SCREEN_W, height: SCREEN_H, borderRadius: 10, overflow: "hidden", backgroundColor: "#050307" }}>
          <div style={{ position: "absolute", inset: 0, opacity: on }}>{children}</div>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: alu, transform: "rotateY(180deg)", backfaceVisibility: "hidden" }} />
    </div>
  </div>
);
