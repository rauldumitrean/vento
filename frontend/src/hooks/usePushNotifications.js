import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

// VAPID Public Key should be retrieved from environment variables if possible,
// but since it's meant to be public, we can either hardcode it or pass it.
// The public key must exactly match the one on the server.
const VAPID_PUBLIC_KEY = 'BA9Q0C22oQxb2r4mSZxP9783r8laitEI19dr4jy5ywJMxh01ScXc2__aURthV9defiQoBJJNamPOEUu9CyAN69A';

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking push subscription:', err);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permiso de notificación denegado');
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const token = Cookies.get('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      await axios.post(`${API_URL}/api/notifications/subscribe`, subscription, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error('Failed to subscribe:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const token = Cookies.get('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        await axios.delete(`${API_URL}/api/notifications/unsubscribe`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { endpoint: subscription.endpoint }
        });

        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { isSupported, isSubscribed, loading, error, subscribe, unsubscribe };
};
