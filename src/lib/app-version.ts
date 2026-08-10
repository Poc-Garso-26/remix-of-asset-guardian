/**
 * Versão da aplicação (SemVer — https://semver.org/lang/pt-BR/).
 * Fonte única da verdade: campo "version" do package.json, injetado em tempo
 * de build como `import.meta.env.VITE_APP_VERSION` (ver vite.config.ts).
 */
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? "0.0.0";

/** Rótulo completo, ex.: "GestãoTI v1.0.0". */
export const APP_VERSION_LABEL = `GestãoTI v${APP_VERSION}`;

/** Rótulo curto, ex.: "v1.0.0". */
export const APP_VERSION_SHORT = `v${APP_VERSION}`;
