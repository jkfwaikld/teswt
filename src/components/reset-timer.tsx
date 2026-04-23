"use client"

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function ResetTimer() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      
      // Convert current time to IST
      // IST is UTC + 5:30
      const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (5.5 * 3600000));
      
      const tomorrowIST = new Date(istTime);
      tomorrowIST.setHours(24, 0, 0, 0);
      
      const diff = tomorrowIST.getTime() - istTime.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/10 shadow-sm transition-all duration-300">
      <Clock className="w-4 h-4 text-primary animate-pulse" />
      <span className="text-sm font-medium tabular-nums text-primary/80">
        Reset in: <span className="font-bold text-primary">{timeLeft}</span> (IST)
      </span>
    </div>
  );
}