// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/main.tsx
// React application entry point

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
