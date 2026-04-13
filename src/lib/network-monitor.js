/**
 * Global network monitoring and offline handling
 */
class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.subscribers = new Set();
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));
  }

  setOnline(status) {
    if (this.isOnline !== status) {
      this.isOnline = status;
      this.notifySubscribers();
      console.log(`[NetworkMonitor] Status: ${status ? 'ONLINE' : 'OFFLINE'}`);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach((cb) => {
      try {
        cb(this.isOnline);
      } catch (error) {
        console.error('[NetworkMonitor] Subscription callback error:', error);
      }
    });
  }

  getStatus() {
    return this.isOnline;
  }
}

export const networkMonitor = new NetworkMonitor();

/**
 * React hook for network status
 */
import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(networkMonitor.getStatus());

  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
}