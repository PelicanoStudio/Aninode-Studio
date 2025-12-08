import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './engines/AnimationEngine'; // Start the Engine Heartbeat

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
