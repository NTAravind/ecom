'use client';

import { useState, useEffect, ReactNode } from 'react';

interface AnimatedElementsProps {
  children: ReactNode;
  elementId: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export const AnimatedElements = ({ 
  children, 
  elementId, 
  delay = 0, 
  direction = 'up',
  className = '' 
}: AnimatedElementsProps) => {
  const [visibleElements, setVisibleElements] = useState(new Set<string>());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const element = document.getElementById(elementId);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [elementId]);

  const isVisible = visibleElements.has(elementId);

  const getTransformClass = () => {
    if (isVisible) return 'opacity-100 translate-x-0 translate-y-0';
    
    switch (direction) {
      case 'up':
        return 'opacity-0 translate-y-8';
      case 'down':
        return 'opacity-0 -translate-y-8';
      case 'left':
        return 'opacity-0 -translate-x-8';
      case 'right':
        return 'opacity-0 translate-x-8';
      default:
        return 'opacity-0 translate-y-8';
    }
  };

  return (
    <div
      id={elementId}
      className={`transition-all duration-1000 ${getTransformClass()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};