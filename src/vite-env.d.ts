// Minimal local replacements for the parts of `vite/client` this app relies on.
// We intentionally do NOT reference `vite/client` via tsconfig "types" because
// Vercel's serverless build compiles the Vite entrypoints too, and
// `Cannot find type definition file for 'vite/client'` (TS2688) fails the deploy.
// These ambient declarations cover the side-effect style/asset imports used in
// the React app (e.g. `import './index.css'`).

declare module '*.css' {
  const css: string;
  export default css;
}

declare module '*.scss' {
  const scss: string;
  export default scss;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
