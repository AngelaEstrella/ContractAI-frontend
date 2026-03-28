"use client";

import { useEffect, useState } from "react";

export const useLiveNow = (intervalMs: number = 1_000): Date => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [intervalMs]);

  return now;
};
