import { useState, useEffect, useRef } from 'react';

export const useJobNavigation = (jobs) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const touchStartTime = useRef(0);

  // useEffect para navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < jobs.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, jobs.length]);

  const handleTouchStart = (e) => {
    touchStartY.current = e.targetTouches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;
    
    const distance = touchStartY.current - touchEndY.current;
    const touchDuration = Date.now() - touchStartTime.current;
    const isUpSwipe = distance > 80; // Aumentamos la distancia mínima
    const isDownSwipe = distance < -80;
    const isLongEnoughSwipe = touchDuration > 100; // Mínimo 100ms para ser considerado swipe

    if (isLongEnoughSwipe && isUpSwipe && currentIndex < jobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isLongEnoughSwipe && isDownSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    
    // Reset values
    touchStartY.current = 0;
    touchEndY.current = 0;
    touchStartTime.current = 0;
  };

  const handleWheel = (e) => {
    if (e.deltaY > 0 && currentIndex < jobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return {
    currentIndex,
    setCurrentIndex,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    goToNext,
    goToPrev
  };
};
