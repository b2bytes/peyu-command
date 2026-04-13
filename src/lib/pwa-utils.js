// PWA Utilities para PEYU
export const PWA_UTILS = {
  // Detectar si está en modo instalado
  isStandalone: () => {
    return window.navigator.standalone === true ||
           window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches;
  },

  // Detectar plataforma
  getPlatform: () => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'web';
  },

  // Mostrar prompt de instalación
  async requestInstall() {
    return new Promise((resolve) => {
      const handler = () => {
        document.body.removeEventListener('pwa-installable', handler);
        resolve();
      };
      document.body.addEventListener('pwa-installable', handler);
    });
  },

  // Notificaciones push
  async requestNotifications() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  // Enviar notificación
  async sendNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, {
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 192 192%22><rect fill=%22%230F8B6C%22 width=%22192%22 height=%22192%22/><text x=%2250%25%22 y=%2250%25%22 font-size=%22120%22 font-weight=%22bold%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22central%22>🐢</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%230F8B6C%22 width=%22100%22 height=%22100%22/></svg>',
        ...options
      });
    }
  },

  // Detectar online/offline
  isOnline: () => navigator.onLine,

  // Background sync
  async registerSync(tag = 'sync') {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await registration.sync.register(tag);
        return true;
      } catch (err) {
        console.error('Sync registration failed:', err);
        return false;
      }
    }
    return false;
  },

  // Add to home screen banner
  showInstallBanner() {
    if (this.isStandalone()) return false;
    
    const platform = this.getPlatform();
    const lastDismissed = localStorage.getItem('pwa-banner-dismissed');
    const daysSinceDismissed = lastDismissed 
      ? (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
      : Infinity;

    // Show if never dismissed or 7+ days passed
    return daysSinceDismissed > 7;
  },

  dismissInstallBanner() {
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  },

  // Get install instructions for platform
  getInstallInstructions() {
    const platform = this.getPlatform();
    
    const instructions = {
      ios: {
        title: 'Instalar PEYU en tu iPhone',
        steps: [
          'Toca el botón Compartir en Safari',
          'Selecciona "Agregar a pantalla principal"',
          'Dale un nombre a la app',
          '¡Listo! Abre desde tu pantalla principal'
        ]
      },
      android: {
        title: 'Instalar PEYU en tu dispositivo',
        steps: [
          'Toca el botón de instalación',
          'Confirma la instalación',
          'La app aparecerá en tu pantalla de inicio',
          '¡Disfruta PEYU offline!'
        ]
      }
    };

    return instructions[platform] || instructions.ios;
  }
};

// Auto-detect online/offline changes
window.addEventListener('online', () => {
  console.log('📡 Conexión restaurada');
  document.body.dispatchEvent(new CustomEvent('pwa-online'));
});

window.addEventListener('offline', () => {
  console.log('📵 Sin conexión');
  document.body.dispatchEvent(new CustomEvent('pwa-offline'));
});