import { useState, useMemo, useEffect, RefObject, useCallback } from 'react';

interface UseVirtualOptions<T> {
  items: T[];
  containerRef: RefObject<HTMLElement>;
  estimateHeight: (index: number) => number;
  overscan?: number;
}

export const useVirtual = <T>({
  items,
  containerRef,
  estimateHeight,
  overscan = 10,
}: UseVirtualOptions<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => setScrollTop(container.scrollTop);
    const resizeObserver = new ResizeObserver(() => {
        if(container) {
            setContainerHeight(container.clientHeight);
        }
    });
    
    setContainerHeight(container.clientHeight);
    container.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.unobserve(container);
    };
  }, [containerRef]);

  const { offsets, totalHeight } = useMemo(() => {
    let total = 0;
    const offsets: number[] = [];
    for (let i = 0; i < items.length; i++) {
      offsets.push(total);
      total += estimateHeight(i);
    }
    return { offsets, totalHeight: total };
  }, [items, estimateHeight]);
  
  const getStartIndex = useCallback(() => {
    let start = 0;
    let end = offsets.length - 1;
    let middle = 0;
    while(start <= end){
        middle = Math.floor((start + end)/2);
        if(offsets[middle] === scrollTop) {
            return middle;
        }
        if(offsets[middle] < scrollTop) {
            start = middle + 1;
        } else {
            end = middle -1;
        }
    }
    return Math.max(0, end);
  }, [offsets, scrollTop]);


  const getEndIndex = useCallback(() => {
    let start = 0;
    let end = offsets.length - 1;
    let middle = 0;
    const searchVal = scrollTop + containerHeight;
    while(start <= end){
        middle = Math.floor((start + end)/2);
        if(offsets[middle] === searchVal) {
            return middle;
        }
        if(offsets[middle] < searchVal) {
            start = middle + 1;
        } else {
            end = middle -1;
        }
    }
    return Math.min(offsets.length - 1, start);
  }, [offsets, scrollTop, containerHeight]);

  const startIndex = Math.max(0, getStartIndex() - overscan);
  const endIndex = Math.min(items.length - 1, getEndIndex() + overscan);

  const virtualItems = useMemo(() => {
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
        result.push({
            item: items[i],
            style: {
                position: 'absolute' as const,
                top: `${offsets[i]}px`,
                left: 0,
                width: '100%',
                height: `${estimateHeight(i)}px`,
            },
            index: i,
        });
    }
    return result;
  }, [startIndex, endIndex, items, offsets, estimateHeight]);

  return {
    virtualContainerStyle: {
      position: 'relative' as const,
      height: `${totalHeight}px`,
    },
    virtualItems,
  };
};
