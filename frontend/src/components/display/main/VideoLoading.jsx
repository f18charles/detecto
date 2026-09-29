import { useEffect, useState } from 'react';

function formatDuration(ms) {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return '—';
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function progressBar(fraction, width = 26) {
  const clamped = Math.min(1, Math.max(0, fraction || 0));
  const filled = Math.round(clamped * width);
  return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}]`;
}

function VideoLoading({ data }) {
  const filename = data?.filename ?? 'video';
  const progress = data?.progress ?? 0;
  const processed = data?.processed ?? 0;
  const total = data?.total ?? 0;
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : `${d}.`));
    }, 400);
    return () => clearInterval(id);
  }, []);

  const text = [
    '> VIDEO PREPROCESS',
    '------------------------------------',
    `FILE      : ${filename}`,
    `SAMPLES   : ${String(processed).padStart(4, ' ')} / ${total || '????'}`,
    `PROGRESS  : ${progressBar(progress)} ${Math.round(progress * 100)}%`,
    `ETA       : ${formatDuration(data?.etaMs)}`,
    '',
    `ANALYZING${dots}`,
    '',
    'ESC       : cancel and go back',
  ].join('\n');

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center w-full h-full mx-auto z-10 select-none overflow-auto">
      <pre className="term cursor text-left text-xs leading-tight font-mono my-auto">{text}</pre>
    </div>
  );
}

export default VideoLoading;
