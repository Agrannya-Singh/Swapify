import { useRef, useCallback, useState } from 'react';

interface UseSwipeProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 100 }: UseSwipeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragRotation, setDragRotation] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleStart = useCallback((clientX: number) => {
    setIsDragging(true);
    startX.current = clientX;
    currentX.current = clientX;
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;

    currentX.current = clientX;
    const deltaX = currentX.current - startX.current;
    const rotation = deltaX * 0.1;
    
    setDragOffset(deltaX);
    setDragRotation(rotation);
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;

    const deltaX = currentX.current - startX.current;
    setIsDragging(false);
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }
    
    setDragOffset(0);
    setDragRotation(0);
  }, [isDragging, threshold, onSwipeLeft, onSwipeRight]);

  const bindSwipe = {
    onMouseDown: (e: React.MouseEvent) => handleStart(e.clientX),
    onTouchStart: (e: React.TouchEvent) => handleStart(e.touches[0].clientX),
  };

  const bindDocument = {
    onMouseMove: (e: MouseEvent) => handleMove(e.clientX),
    onMouseUp: handleEnd,
    onTouchMove: (e: TouchEvent) => handleMove(e.touches[0].clientX),
    onTouchEnd: handleEnd,
  };

  return {
    isDragging,
    dragOffset,
    dragRotation,
    bindSwipe,
    bindDocument,
  };
}
