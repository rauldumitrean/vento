import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';

// "Modo Ultra" - Cache todas las peticiones GET por 5 minutos (300,000 ms)
setupCache(axios, {
  ttl: 1000 * 60 * 5,
  methods: ['get']
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
