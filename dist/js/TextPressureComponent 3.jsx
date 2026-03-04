import React, { useRef, useEffect, useState } from 'react';

/**
 * TextPressure Component
 * Creates an interactive text effect where font weight responds to cursor proximity
 */
const TextPressure = ({ text, className = '' }) => {
  const containerRef = useRef(null);
  const [fontWeight, setFontWeight] = useState(500);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate distance from cursor to text center
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Radius of effect: 300px (increased for better interaction)
      const maxDistance = 300;

      // Calculate pressure (0 to 1, where 1 is closest)
      const pressure = Math.max(0, 1 - distance / maxDistance);

      // Map pressure to font weight (400-800 for more dramatic effect)
      const weight = 400 + pressure * 400;
      setFontWeight(weight);
    };

    // Add listener to document for global tracking
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`text-pressure-component ${className}`}
      style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontWeight: Math.round(fontWeight),
        fontStyle: 'italic',
        fontSize: 'clamp(3rem, 6vw, 5rem)', // Same size for both
        color: 'rgba(244, 235, 208, 1)',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        textAlign: 'center',
        userSelect: 'none',
        lineHeight: '1.2',
        margin: '0',
        padding: '0.5rem 0',
        transition: 'font-weight 0.2s ease-out',
        cursor: 'default',
        willChange: 'font-weight',
      }}
    >
      {text}
    </div>
  );
};

export default TextPressure;
