import { useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

export function useCancellableRequest() {
  const abortControllerRef = useRef(null);
  
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const makeRequest = useCallback((axiosConfig) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Cancelar la anterior si existe
    }
    abortControllerRef.current = new AbortController();
    return axios({ ...axiosConfig, signal: abortControllerRef.current.signal });
  }, []);
  
  return { makeRequest };
}
