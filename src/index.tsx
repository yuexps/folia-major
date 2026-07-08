if (typeof window !== 'undefined') {
    const fromFullPlayerOverlay = new URLSearchParams(window.location.search).get('from') === 'FullPlayerOverlay';
    if (fromFullPlayerOverlay) {
        const originalGetItem = Storage.prototype.getItem;
        const originalSetItem = Storage.prototype.setItem;
        const originalRemoveItem = Storage.prototype.removeItem;

        Storage.prototype.getItem = function (key: string) {
            return originalGetItem.call(this, `overlay_${key}`);
        };

        Storage.prototype.setItem = function (key: string, value: string) {
            originalSetItem.call(this, `overlay_${key}`, value);
        };

        Storage.prototype.removeItem = function (key: string) {
            originalRemoveItem.call(this, `overlay_${key}`);
        };
    }
}

import { Buffer } from 'buffer';
import { installGlobalVisualizerFrameRateLimiter } from './utils/frameRateLimiter';
// @ts-ignore
globalThis.Buffer = Buffer;
installGlobalVisualizerFrameRateLimiter();

void import('./bootstrap');
