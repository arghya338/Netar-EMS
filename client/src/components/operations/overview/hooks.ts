import { useEffect, useState } from 'react';

export function useFlowHistory(up: number | null, down: number | null) {
  const [samples, setSamples] = useState<Array<{ time: number; total: number }>>([]);

  useEffect(() => {
    if (up === null && down === null) return;

    const point = Math.max(0, up ?? 0) + Math.max(0, down ?? 0);
    setSamples((current) => {
      const previous = current[current.length - 1];
      if (previous && previous.total === point) {
        return [...current.slice(-17), { ...previous, time: Date.now() }];
      }
      return [...current.slice(-17), { time: Date.now(), total: point }];
    });
  }, [up, down]);

  return samples
    .map((sample, index) => {
      const previous = samples[index - 1];
      if (!previous) return null;

      const elapsedSeconds = Math.max(1, (sample.time - previous.time) / 1000);
      return Math.max(0, sample.total - previous.total) / elapsedSeconds;
    })
    .filter((value): value is number => value !== null);
}
