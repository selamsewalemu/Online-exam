import { useState, useEffect, useRef } from 'react';

const Timer = ({ durationMinutes, onTimeUp, onTick }) => {
  const totalSeconds = durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (onTick) onTick(next);
        if (next <= 0) {
          clearInterval(intervalRef.current);
          onTimeUp && onTimeUp();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [onTimeUp, onTick]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (n) => String(n).padStart(2, '0');

  const isWarning = secondsLeft <= 300 && secondsLeft > 60;   // last 5 min
  const isDanger = secondsLeft <= 60;                          // last 1 min

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm font-bold ${
        isDanger
          ? 'bg-red-100 text-red-700 animate-pulse'
          : isWarning
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-primary-100 text-primary-700'
      }`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        {hours > 0 ? `${pad(hours)}:` : ''}
        {pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
};

export default Timer;
