interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string;
  readonly VITE_APPWRITE_PROJECT_ID: string;
  readonly VITE_APPWRITE_FUNCTION_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css';

declare module '*.svg' {
  const source: string;
  export default source;
}
