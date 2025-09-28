import { useState, useEffect, useRef, useCallback } from 'react';

export const useSmoothJobNavigation = (jobs) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [velocity, setVelocity] = useState(0);
  
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastTouchY = useRef(0);
  const lastTouchTime = useRef(0);
  const animationRef = useRef(null);
  const containerRef = useRef(null);

  // Configuración para el scroll suave
  const SWIPE_THRESHOLD = 50; // Distancia mínima para cambiar de job
  const VELOCITY_THRESHOLD = 0.5; // Velocidad mínima para scroll automático
  const SNAP_DURATION = 300; // Duración de la animación de snap
  const MAX_DRAG_DISTANCE = window.innerHeight * 0.3; // Máximo 30% de la pantalla

  // Función para calcular la velocidad
  const calculateVelocity = useCallback((currentY, currentTime) => {
    if (lastTouchY.current && lastTouchTime.current) {
      const deltaY = currentY - lastTouchY.current;
      const deltaTime = currentTime - lastTouchTime.current;
      return deltaTime > 0 ? deltaY / deltaTime : 0;
    }
    return 0;
  }, []);

  // Función para animar el snap
  const animateSnap = useCallback((targetOffset, duration = SNAP_DURATION) => {
    const startOffset = dragOffset;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentOffset = startOffset + (targetOffset - startOffset) * easeOut;
      
      setDragOffset(currentOffset);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDragOffset(targetOffset);
        setIsDragging(false);
      }
    };
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
  }, [dragOffset]);

  // Función para cambiar de job
  const changeJob = useCallback((newIndex) => {
    if (newIndex >= 0 && newIndex < jobs.length && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      animateSnap(0);
    } else {
      // Si no se puede cambiar, volver a la posición original
      animateSnap(0);
    }
  }, [currentIndex, jobs.length, animateSnap]);

  // Manejo del touch start
  const handleTouchStart = useCallback((e) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    lastTouchY.current = touch.clientY;
    lastTouchTime.current = Date.now();
    
    setIsDragging(true);
    setVelocity(0);
  }, []);

  // Manejo del touch move
  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault(); // Prevenir scroll nativo
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const currentTime = Date.now();
    
    // Calcular offset desde el inicio
    const rawOffset = currentY - touchStartY.current;
    
    // Aplicar resistencia en los extremos
    let constrainedOffset = rawOffset;
    
    if (currentIndex === 0 && rawOffset > 0) {
      // Resistencia al intentar ir hacia arriba en el primer job
      constrainedOffset = rawOffset * 0.3;
    } else if (currentIndex === jobs.length - 1 && rawOffset < 0) {
      // Resistencia al intentar ir hacia abajo en el último job
      constrainedOffset = rawOffset * 0.3;
    }
    
    // Limitar el drag máximo
    constrainedOffset = Math.max(-MAX_DRAG_DISTANCE, Math.min(MAX_DRAG_DISTANCE, constrainedOffset));
    
    setDragOffset(constrainedOffset);
    
    // Calcular velocidad
    const newVelocity = calculateVelocity(currentY, currentTime);
    setVelocity(newVelocity);
    
    lastTouchY.current = currentY;
    lastTouchTime.current = currentTime;
  }, [isDragging, currentIndex, jobs.length, calculateVelocity]);

  // Manejo del touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    const touchDuration = Date.now() - touchStartTime.current;
    const distance = Math.abs(dragOffset);
    const isQuickSwipe = touchDuration < 300 && Math.abs(velocity) > VELOCITY_THRESHOLD;
    const isLongSwipe = distance > SWIPE_THRESHOLD;
    
    let newIndex = currentIndex;
    
    if (isQuickSwipe || isLongSwipe) {
      if (dragOffset < 0 && currentIndex < jobs.length - 1) {
        // Swipe hacia arriba - siguiente job
        newIndex = currentIndex + 1;
      } else if (dragOffset > 0 && currentIndex > 0) {
        // Swipe hacia abajo - job anterior
        newIndex = currentIndex - 1;
      }
    }
    
    changeJob(newIndex);
    
    // Reset valores
    touchStartY.current = 0;
    lastTouchY.current = 0;
    lastTouchTime.current = 0;
    setVelocity(0);
  }, [isDragging, dragOffset, velocity, currentIndex, jobs.length, changeJob]);

  // Manejo del wheel (scroll de mouse)
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    if (isDragging) return;
    
    const delta = e.deltaY;
    let newIndex = currentIndex;
    
    if (delta > 0 && currentIndex < jobs.length - 1) {
      newIndex = currentIndex + 1;
    } else if (delta < 0 && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      setDragOffset(0);
    }
  }, [currentIndex, jobs.length, isDragging]);

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isDragging) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < jobs.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setDragOffset(0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
          setDragOffset(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, jobs.length, isDragging]);

  // Cleanup de animaciones
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Funciones de navegación programática
  const goToNext = useCallback(() => {
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDragOffset(0);
    }
  }, [currentIndex, jobs.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setDragOffset(0);
    }
  }, [currentIndex]);

  const goToIndex = useCallback((index) => {
    if (index >= 0 && index < jobs.length) {
      setCurrentIndex(index);
      setDragOffset(0);
    }
  }, [jobs.length]);

  return {
    currentIndex,
    setCurrentIndex: goToIndex,
    isDragging,
    dragOffset,
    velocity,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    goToNext,
    goToPrev,
    goToIndex
  };
};
