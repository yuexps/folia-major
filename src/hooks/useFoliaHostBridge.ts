import { useCallback, useMemo, useRef } from 'react';
import type { SongResult } from '../types';

export interface FoliaHostBridgeParams {
    fromFullPlayerOverlay: boolean;
    stageSource: string | null;
    originalPlaySong: (song: any, queue: any[], isFmCall?: boolean) => void;
    originalNextTrack: (options?: any) => void;
    originalPrevTrack: () => void;
    originalShuffleQueue: () => void;
    originalRemoveQueueSong: (index: number) => void;
    originalMoveQueueSongToEnd: (index: number) => void;
    originalMoveQueueSongToNext: (index: number) => void;
}

export function useFoliaHostBridge({
    fromFullPlayerOverlay,
    stageSource,
    originalPlaySong,
    originalNextTrack,
    originalPrevTrack,
    originalShuffleQueue,
    originalRemoveQueueSong,
    originalMoveQueueSongToEnd,
    originalMoveQueueSongToNext,
}: FoliaHostBridgeParams) {
    const lastSeekTimeRef = useRef<number>(0);

    const recordLocalSeek = useCallback(() => {
        lastSeekTimeRef.current = performance.now();
    }, []);

    const shouldIgnoreProgressSync = useCallback(() => {
        return performance.now() - lastSeekTimeRef.current < 1000;
    }, []);

    const postToHost = useCallback((type: string, data?: any) => {
        const message = { type, data };
        if (fromFullPlayerOverlay) {
            window.parent.postMessage(message, '*');
        }
        if (window.opener) {
            try {
                window.opener.postMessage(message, '*');
            } catch (e) {}
        }
        try {
            const bc = new BroadcastChannel('2fmusic-folia-sync-channel');
            bc.postMessage(message);
            bc.close();
        } catch (e) {}
    }, [fromFullPlayerOverlay]);


    const wrappedCallbacks = useMemo(() => {
        if (!fromFullPlayerOverlay) {
            return {
                playSong: async (song: any, queue: any[], isFmCall?: boolean) => {
                    await originalPlaySong(song, queue, isFmCall);
                },
                handleNextTrack: originalNextTrack,
                handlePrevTrack: originalPrevTrack,
                shuffleQueue: originalShuffleQueue,
                removeQueueSong: originalRemoveQueueSong,
                moveQueueSongToEnd: originalMoveQueueSongToEnd,
                moveQueueSongToNext: originalMoveQueueSongToNext,
            };
        }

        return {
            playSong: async (song: SongResult, queue: SongResult[], isFmCall = false) => {
                if (stageSource === 'now-playing') {
                    const hostSong = {
                        id: String(song.id),
                        title: song.name || '',
                        artist: song.ar?.map(a => a.name).join(', ') || song.artists?.map(a => a.name).join(', ') || '未知艺术家',
                        album: song.al?.name || song.album?.name || '',
                        album_art: song.al?.picUrl || song.album?.picUrl || '',
                        duration: Math.floor((song.dt || song.duration || 0) / 1000),
                        filename: (song as any).filename || '',
                        path: (song as any).path || '',
                        sourceType: (song as any).sourceType || 'cloud',
                        isNetease: (song as any).isNetease ?? false,
                        neteaseId: (song as any).neteaseId ?? null
                    };
                    postToHost('folia-play-song-external', { song: hostSong });
                    return;
                }
                await originalPlaySong(song, queue, isFmCall);
            },
            handleNextTrack: (options?: any) => {
                postToHost('folia-next');
            },
            handlePrevTrack: () => {
                postToHost('folia-prev');
            },
            shuffleQueue: () => {
                if (stageSource === 'now-playing') {
                    postToHost('folia-shuffle-queue');
                    return;
                }
                return originalShuffleQueue();
            },
            removeQueueSong: (index: number) => {
                if (stageSource === 'now-playing') {
                    postToHost('folia-remove-song', { index });
                    return;
                }
                return originalRemoveQueueSong(index);
            },
            moveQueueSongToEnd: (index: number) => {
                if (stageSource === 'now-playing') {
                    postToHost('folia-move-song-to-end', { index });
                    return;
                }
                return originalMoveQueueSongToEnd(index);
            },
            moveQueueSongToNext: (index: number) => {
                if (stageSource === 'now-playing') {
                    postToHost('folia-move-song-to-next', { index });
                    return;
                }
                return originalMoveQueueSongToNext(index);
            },
        };
    }, [
        fromFullPlayerOverlay,
        stageSource,
        originalPlaySong,
        originalNextTrack,
        originalPrevTrack,
        originalShuffleQueue,
        originalRemoveQueueSong,
        originalMoveQueueSongToEnd,
        originalMoveQueueSongToNext,
        postToHost,
    ]);

    return {
        wrappedCallbacks,
        recordLocalSeek,
        shouldIgnoreProgressSync,
        postToHost,
    };
}
