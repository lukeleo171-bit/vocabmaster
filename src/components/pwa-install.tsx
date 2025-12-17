'use client'

import { useEffect } from 'react'

export function PWAInstall() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !(window as any).__SW_REGISTERED__) {
      // Check if service worker is already registered
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          console.log('Service Worker already registered:', registration.scope);
          
          // Ensure it's active
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          
          // Check if we need to reload
          if (!navigator.serviceWorker.controller && registration.active) {
            window.location.reload();
          }
        } else {
          // Register service worker if not already registered
          navigator.serviceWorker
            .register('/sw.js', {
              scope: '/',
            })
            .then((registration) => {
              console.log('Service Worker registered:', registration.scope);
              
              // Wait for the service worker to become active
              if (registration.installing) {
                registration.installing.addEventListener('statechange', () => {
                  if (registration.installing?.state === 'activated') {
                    console.log('Service Worker activated');
                    // Reload to ensure service worker takes control
                    if (!navigator.serviceWorker.controller) {
                      window.location.reload();
                    }
                  }
                });
              } else if (registration.waiting) {
                // If there's a waiting service worker, skip waiting
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              } else if (registration.active) {
                console.log('Service Worker is active');
              }
              
              // Check for updates periodically
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      console.log('New service worker available');
                    } else if (newWorker.state === 'activated') {
                      console.log('New service worker activated');
                      window.location.reload();
                    }
                  });
                }
              });
            })
            .catch((error) => {
              console.error('Service Worker registration failed:', error);
            });
        }
      });
    }
  }, [])

  return null
}


