import React from 'react';
import TextPressure from './TextPressureComponent';

/**
 * TextPressureIsland
 * Wrapper component that renders two Text Pressure components:
 * 1. "Weekly" (smaller, lighter)
 * 2. "INSIGHTS" (larger, bolder)
 */
const TextPressureIsland = () => {
  return (
    <div className="text-pressure-island">
      <TextPressure
        text="Weekly"
        className="text-pressure-weekly"
      />
      <TextPressure
        text="INSIGHTS"
        className="text-pressure-insights"
      />
    </div>
  );
};

export default TextPressureIsland;
