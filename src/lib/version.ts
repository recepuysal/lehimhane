import packageJson from "../../package.json";

/** Uygulama sürümü — package.json ile senkron tutulur. */
export const APP_VERSION = packageJson.version;
export const APP_VERSION_LABEL = `v${packageJson.version}`;
