export const get2FMusicBaseUrl = (): string => {
  if (typeof window === 'undefined' || !window.location) {
    return '';
  }
  const origin = window.location.origin;
  const pathname = window.location.pathname; // 例如 /app/2fmusic/folia/index.html
  const basePath = pathname.replace(/\/folia(\/(index\.html)?)?$/, '');
  return `${origin}${basePath}`;
};
