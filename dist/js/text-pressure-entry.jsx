import React from 'react';
import ReactDOM from 'react-dom/client';
import TextPressureIsland from './text-pressure-island';

// Mount the Text Pressure island - script runs after DOM is ready
(function() {
  console.log('Text Pressure entry point loaded');

  try {
    const container = document.getElementById('textPressureContainer');
    console.log('Container element:', container);

    if (container) {
      console.log('Mounting Text Pressure component to container');
      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(TextPressureIsland));
      console.log('✓ Text Pressure component mounted successfully');

      // Verify elements are in DOM
      setTimeout(() => {
        const weekly = document.querySelector('.text-pressure-weekly');
        const insights = document.querySelector('.text-pressure-insights');
        console.log('Weekly element:', weekly);
        console.log('Insights element:', insights);
      }, 100);
    } else {
      console.error('✗ textPressureContainer element not found in DOM');
    }
  } catch (error) {
    console.error('✗ Error mounting Text Pressure component:', error);
  }
})();
