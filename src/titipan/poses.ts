// Haruka's poses (public/haruka). `top` is the y of her hair's crown and `cx` her head's centre, in source pixels,
// so <Haruka> can pin her head in place while the pose changes. `headW` is the hair's width a little below the crown;
// `zoom` scales an image drawn at a different pixel size (the hi-res `peace` and `oopsHand` originals) to match the crops around it.
export const POSES = {
  shocked: { file: "holding-phone-shocked-with-sweat-drop.png", w: 318, h: 397, top: 26, cx: 161, headW: 178, zoom: 1 },
  facepalm: { file: "holding-phone-facepalming-embarrassed.png", w: 317, h: 509, top: 14, cx: 150, headW: 192, zoom: 1 },
  thinkingPhone: { file: "holding-phone-finger-to-chin-thinking.png", w: 316, h: 506, top: 31, cx: 136, headW: 196, zoom: 1 },
  exasperated: { file: "holding-phone-facepalming-exasperated.png", w: 336, h: 498, top: 14, cx: 162, headW: 188, zoom: 1 },
  reassuring: { file: "palms-together-eyes-closed-smiling.png", w: 358, h: 512, top: 18, cx: 166, headW: 200, zoom: 1 },
  lightbulb: { file: "index-finger-raised-winking-with-lightbulb.png", w: 383, h: 510, top: 16, cx: 221, headW: 197, zoom: 1 },
  explaining: { file: "gesturing-sideways-explaining.png", w: 434, h: 512, top: 16, cx: 175, headW: 198, zoom: 1 },
  presenting: { file: "both-palms-presenting-smiling.png", w: 424, h: 510, top: 16, cx: 168, headW: 195, zoom: 1 },
  caveat: { file: "index-finger-raised-open-palm-smiling-02.png", w: 398, h: 504, top: 15, cx: 191, headW: 200, zoom: 1 },
  puzzled: { file: "hand-on-chin-puzzled-with-question-mark.png", w: 352, h: 521, top: 15, cx: 162, headW: 199, zoom: 1 },
  clipboard: { file: "index-finger-raised-with-clipboard-smiling.png", w: 369, h: 511, top: 11, cx: 167, headW: 190, zoom: 1 },
  peace: { file: "peace-sign-open-palm-smiling.png", w: 1086, h: 1448, top: 16, cx: 502, headW: 528, zoom: 0.36 },
  tapping: { file: "holding-phone-tapping-screen-curious.png", w: 321, h: 403, top: 17, cx: 182, headW: 181, zoom: 1 },
  tappingAngry: { file: "holding-phone-tapping-screen-angry.png", w: 330, h: 390, top: 14, cx: 166, headW: 169, zoom: 1 },
  scratching: { file: "holding-phone-scratching-head-frustrated.png", w: 356, h: 496, top: 18, cx: 178, headW: 196, zoom: 1 },
  annoyed: { file: "holding-phone-frowning-annoyed.png", w: 323, h: 474, top: 14, cx: 156, headW: 178, zoom: 1 },
  oops: { file: "holding-phone-hand-over-mouth-surprised-02.png", w: 319, h: 492, top: 13, cx: 162, headW: 181, zoom: 1 },
  temple: { file: "finger-to-temple-laughing-with-lightbulb.png", w: 366, h: 507, top: 22, cx: 163, headW: 194, zoom: 1 },
  showPhone: { file: "showing-phone-screen-pointing-smiling.png", w: 294, h: 488, top: 13, cx: 134, headW: 185, zoom: 1 },
  starEyes: { file: "holding-phone-fist-raised-excited-with-star-eyes.png", w: 280, h: 481, top: 13, cx: 132, headW: 183, zoom: 1 },
  pointYou: { file: "pointing-to-open-palm-smiling.png", w: 1199, h: 1312, top: 12, cx: 462, headW: 463, zoom: 1 },
  thumbsUp: { file: "thumbs-up-winking.png", w: 1199, h: 1312, top: 11, cx: 623, headW: 504, zoom: 1 },
  oopsHand: { file: "hand-over-mouth-surprised.png", w: 1122, h: 1402, top: 14, cx: 558, headW: 512, zoom: 0.371 },
} as const;

export type Pose = keyof typeof POSES;
