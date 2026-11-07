# Sydia Video

A TypeScript + React project using [Remotion](https://www.remotion.dev/docs/).
Includes a five-second, 1920×1080 intro composition at 30 fps.

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
npm run build   # Bundle the project into dist/
npm run render  # Export out/sydia-intro.mp4
```

The first render downloads Chrome Headless Shell if needed. Generated output in
`out/` and `dist/` is ignored by Git.

See the [Remotion documentation](https://www.remotion.dev/docs/) for composition
and rendering options, and the [license](https://www.remotion.dev/license) for
usage terms.
