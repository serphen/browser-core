import config from './config';

import platform, { OS } from '../platform/platform';

export {
  isPlatformAtLeastInVersion,
  isCliqzAtLeastInVersion
} from '../platform/platform';

export function notImplemented() {
  throw new Error('Not implemented');
}

export const isFirefox = platform.isFirefox;
export const isMobile = platform.isMobile;
export const isChromium = platform.isChromium;
export const platformName = platform.platformName;
export const isCliqzBrowser = config.settings.channel === '40';

export function isWindows() {
  return OS && OS.indexOf('win') === 0;
}

export function isMac() {
  return OS && OS.indexOf('darwin') === 0;
}

export function isLinux() {
  return OS && OS.indexOf('linux') === 0;
}
