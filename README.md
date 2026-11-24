# Sydia Video

A TypeScript + React project using [Remotion](https://www.remotion.dev/docs/).
Includes `SydiaPromo`, a 32-second 1920×1080 promo at 30 fps, `SydiaShowcase`,
a 106-second feature showcase, and the original five-second `SydiaIntro`.

## SydiaPromo

The promo is cut to an original 150 BPM track (one beat = 12 frames, one bar =
48 frames). Every scene starts on a bar line and every transition lasts one beat.

- `src/promo/SydiaPromo.tsx` arranges the scenes, music and sound effects.
- `src/promo/scenes/` holds one component per scene.
- `scripts/make-music.py` synthesizes `public/music/sydia-anthem.wav` with
  NumPy and SciPy. If you change scene lengths, update its arrangement too, then
  run `npm run music`.

## SydiaShowcase

A 106-second 1920×1080 feature showcase at 30 fps on an original acoustic
track (100 BPM; bar numbers live in `src/showcase/timeline.ts`):

1. **Intro:** a chat composer types "Hai Sydia…", then the logo blooms.
2. **Desktop chat:** one continuous conversation drives every feature —
   a note opens in the side panel, a task chip opens the task list, an event
   is confirmed into the calendar and a dropped PDF is summarised. A 3D
   camera moves between the windows.
3. **Breather:** a soft half-time pull-back over everything built in chat,
   then the phone lands.
4. **WhatsApp day:** daily brief, free schedule, reminder time-lapse,
   sending a file and memory, from morning to evening.
5. **Voice note:** at night, a voice note is transcribed and logged as
   expenses.
6. **Outro:** a final-chorus montage cut on the beat (desktop on quarter notes, phone and voice on eighths), then the logo and the CTA: "Coba Sydia sekarang" → "Gratis 7 hari" → "Komen MAU di komentar untuk mendapatkan akses".

`SydiaShowcaseSquare` is the same cut at 1080×1080 for feed posts. Scenes are
laid out on a 1440×1440 canvas (the same area as 1920×1080) and scaled down;
`src/showcase/format.tsx` provides `useFormat()` / `useSq()` so a scene can pick
square-only positions or camera keys where the wide framing doesn't fit.

- `src/showcase/SydiaShowcase.tsx` arranges scenes, music and sound effects.
- `src/showcase/components/Camera.tsx` is the keyframed 3D camera.
- `src/showcase/components/DesktopApp.tsx` and `Phone.tsx` are the web and
  WhatsApp mock-ups.
- `scripts/make-showcase-music.py` synthesizes `public/music/sydia-showcase.wav`
  plus `public/sfx/notify.wav` and `public/sfx/pop.wav`. If you move sections,
  update its bar numbers too, then run `npm run music:showcase`.

## SydiaSeller

An 82-second 1080×1080 (1:1) scenario promo at 30 fps: a home seller's day with
Sydia, on an original 100 BPM acoustic track ("Pagi Cerah", bar numbers in
`src/seller/timeline.ts`) with an ElevenLabs voice-over.

1. **Night to dawn:** the window time-lapses from stars to sunrise, a rooster crows
   on the fence, then the twin-bell alarm clock rings at 06.00 and is tapped off.
2. **Wake:** only then does the phone come up, WhatsApp orders piling up on the lock screen.
3. **WhatsApp:** new customer chats land in the list; Sari forwards Bu Rina's
   order to Sydia and asks "Buat catatan pemesanan untuk hari ini dan masukkan
   pesanan ini". Four more forwards follow ("tambah ini", "ini juga"…) while a
   tally counts the orders.
4. **Afternoon:** the sky turns golden, the laptop opens on Sydia web; "Buka
   catatan pemesanan hari ini" → reply chip → the table note opens in the side
   panel → "Buka di Catatan" → the notes workspace, where each day's order note
   sits in the "Catatan Pemesanan" folder. Back in the chat, "Buatkan laporan
   pesanan seminggu terakhir" → a summary reply → the weekly report (summary and
   per-day table) opens in the side panel.
5. **Closing:** the same closing screen as SydiaShowcase (logo, tagline, CTA).

- `src/seller/SydiaSeller.tsx` arranges the scenes, music (ducked under the
  voice-over), voice-over and sound effects.
- `src/seller/scenes/` holds the night intro, the morning phone act and the afternoon laptop act;
  `src/seller/components/` the room backdrop, phone screens, laptop and order notes.
- `scripts/make-seller-music.py` synthesizes `public/music/sydia-seller.wav`
  (`npm run music:seller`).
- `scripts/make-seller-voiceover.mjs` regenerates the voice-over clips in
  `public/voiceover/seller/` (voice "Cahaya", `eleven_v4`); it
  needs `ELEVENLABS_API_KEY` (`npm run voiceover:seller`, or pass clip ids to
  redo only some). If a clip's length changes, update `VOICE` in the timeline
  and `VO_LEN` in `SydiaSeller.tsx`.
- `scripts/make-seller-sfx.mjs` regenerates the intro sound effects (crickets,
  rooster, alarm clock) with ElevenLabs' sound-generation API (`npm run sfx:seller`).
  Results vary per run, so re-check `INTRO` in the timeline against the new clips.

## TitipanTelur

A ~94-second 1080×1080 (1:1) TOFU explainer at 30 fps, narrated by Haruka: "Kenapa kejadian
memalukan 5 tahun lalu masih ingat, tapi Ibu nitip beli telur malah lupa?". It follows the Penpot
storyboard of the same name (9 scenes) on an original 112.5 BPM acoustic track ("Titip Senyum",
bar numbers in `src/titipan/timeline.ts`).

1. **Hook:** the question builds phrase by phrase; on "malah lupa?!" the music tape-stops and
   Haruka bursts in, shocked: "Telurnya mana?".
2. **Timeline:** five years ago lands sharp ("momen memalukan"), this morning blurs ("beli telur").
3. **Two modes:** the screen splits: remembering what happened vs remembering to do something later.
4. **Emotion:** a spotlight on a dark stage; the unlit details surface faintly and fade.
5. **Prospective memory:** an egg cracks into APA ✓ and KAPAN ✗.
6. **Busy mind:** the commute home; distractions pop, the shop flies past, "Eh, telurnya!".
7. **Reminder:** the same road; the reminder rings at the shop, "beli telur" is written on the
   shopping list and ticked, and the egg rides home.
8. **Summary:** callback to the split screen.
9. **CTA:** "Kamu paling sering lupa titipan apa? Tulis di komentar ↓".

Haruka's pose changes on her words; `src/titipan/components/Haruka.tsx` pins her head in place
across poses using the crown/centre measured per image in `src/titipan/poses.ts` (images are copied
from `assets/Haruka` to `public/haruka`).

- `scripts/make-titipan-voiceover.mjs` generates the voice-over (`eleven_v4`, voice "Cahaya") with
  character timestamps and regenerates `src/titipan/voiceover.ts`: each clip's length and the frame
  of each cue phrase, which the scenes animate on (`npm run voiceover:titipan`, needs
  `ELEVENLABS_API_KEY`). If a clip gets longer, check the scene starts in `timeline.ts`.
- `scripts/make-titipan-sfx.mjs` generates the storyboard's effects (egg crack, typing, buzz,
  sparkle, spotlight hum, pen writing, reminder) and peak-normalises them (`npm run sfx:titipan`).
- `scripts/make-titipan-music.py` synthesizes `public/music/titipan-telur.wav`
  (`npm run music:titipan`); keep its bar numbers in sync with `timeline.ts`.

## SibukSeharian

A ~50-second 1080×1920 (9:16) TOFU short for Reels/TikTok at 30 fps, acted and narrated by Haruka:
"Pernah gak kalian merasa sibuk seharian tapi kerjaan gak selesai-selesai?". It follows the Penpot
storyboard "Storyboard - Sibuk seharian" (riso-zine look: paper grain, torn strips, blue ink with a
pink misprint). The clock and the "SEBENTAR ×n" counter stay pinned at the top across scenes.

1. **Hook (16.47):** Proposal.docx with one sentence and a blinking cursor; the marker rings it.
2. **Pull back:** the laptop shrinks into the corner, Haruka puzzled: "Proposalnya masih 1 kalimat."
3. **Pagi (09.02):** a tape rewind un-types the document; she types the sentence, the phone buzzes,
   she reaches for it. ×1, "Sebentar, balas ini dulu."
4. **Diminta cek:** Dina's "Bisa bantu cek sebentar?", "Oke, bentar ya". ×2.
5. **Montage:** Meeting / Email / Revisi / Chat lagi, a hard cut every two beats, tighter each time;
   then every request swarms her at once (×9) and everything cuts dead.
6. **Hening:** silence, wide shot, "9× sebentar. 0 kalimat baru."
7. **Daftar tugas:** the hand writes and ticks every new task; Proposal stays unticked.
8. **CTA:** "Hari ini kamu bilang ‘sebentar’ berapa kali? Tulis angkanya di komentar."

- `src/sibuk/timeline.ts` holds scene starts (beats of the music) and Haruka's cue frames;
  `src/sibuk/components/Haruka.tsx` cross-fades her poses with her head pinned.
- `scripts/make-sibuk-art.py` outlines and upscales the poses from `assets/Haruka` into
  `public/sibuk/haruka` and writes `src/sibuk/poses.ts` (`npm run art:sibuk`). The paper textures in
  `public/sibuk/paper` are exported from the Penpot storyboard.
- `scripts/make-sibuk-voiceover.mjs` generates the voice-over (`eleven_v4`, voice "Cahaya") and
  `src/sibuk/voiceover.ts` (`npm run voiceover:sibuk`, needs `ELEVENLABS_API_KEY`).
- `scripts/make-sibuk-sfx.mjs` generates the effects (`npm run sfx:sibuk`).
- `scripts/make-sibuk-music.py` synthesizes both original tracks, "Sebentar Dulu" (120 BPM, stops dead
  at the peak) and "Giliran" (100 BPM) (`npm run music:sibuk`); keep its beats in sync with the timeline.

## Getting started

Use a Node.js version supported by `package.json` (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the local Studio URL printed in the terminal and select `SydiaIntro`.
Edit `src/Composition.tsx` to change the animation, text, or video dimensions.
Register additional compositions in `src/Root.tsx`. Put media files in `public/`
and reference them using Remotion's `staticFile()` helper.

## Commands

```sh
npm run dev     # Open Remotion Studio
npm run lint    # ESLint and TypeScript checks
npm run build   # Bundle the project into build/
npm run render  # Export out/sydia-promo.mp4
npm run render:showcase  # Export out/sydia-showcase.mp4
npm run render:showcase-square  # Export out/sydia-showcase-square.mp4 (1:1)
npm run render:titipan   # Export out/titipan-telur.mp4 (1:1)
npm run render:sibuk     # Export out/sibuk-seharian.mp4 (9:16)
npm run music:showcase   # Regenerate the showcase soundtrack and UI sounds
npm run music   # Regenerate the promo soundtrack
```

The first render downloads Chrome Headless Shell if needed. Generated output in
`out/` and `build/` is ignored by Git.

See the [Remotion documentation](https://www.remotion.dev/docs/) for composition
and rendering options, and the [license](https://www.remotion.dev/license) for
usage terms.
