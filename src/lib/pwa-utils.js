// PWA Utilities para PEYU
export const PWA_UTILS = {
  // Detectar si está en modo instalado
  isStandalone: () => {
    if (typeof window === 'undefined') return false;
    return (
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches
    );
  },

  // Detectar plataforma - mejorado
  getPlatform: () => {
    if (typeof navigator === 'undefined') return 'web';
    
    const ua = navigator.userAgent.toLowerCase();
    
    // iOS primero (más específico)
    if (/iphone|ipad|ipod|crios|opr\//.test(ua) && !/android/.test(ua)) {
      return 'ios';
    }
    
    // Android
    if (/android/.test(ua)) {
      return 'android';
    }
    
    // Desktop/Web
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

  // ¿Mostrar el banner de instalación ahora?
  // Reglas (no invasivo):
  //  - NUNCA si ya está instalado (standalone) → el que instaló no lo ve más.
  //  - Si el usuario lo cerró/instaló a mano → no volver por 7 días.
  //  - Si solo se auto-ocultó (no decidió) → reaparece tras un cooldown corto
  //    (cada ~4 minutos) para insistir suave sin molestar.
  showInstallBanner() {
    if (this.isStandalone()) return false;

    try {
      // Dismiss manual / instalado → silencio largo (7 días)
      const lastDismissed = localStorage.getItem('pwa-banner-dismissed');
      if (lastDismissed) {
        const days = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
        if (days <= 7) return false;
      }

      // Auto-ocultado (sin decisión) → reaparece cada ~4 min
      const lastAutoHidden = localStorage.getItem('pwa-banner-autohidden');
      if (lastAutoHidden) {
        const mins = (Date.now() - parseInt(lastAutoHidden)) / (1000 * 60);
        if (mins < 4) return false;
      }

      return true;
    } catch (e) {
      return true; // Show if localStorage fails
    }
  },

  // Cierre/instalación manual: silencio largo.
  dismissInstallBanner() {
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  },

  // Auto-ocultado por timeout (el usuario no decidió): silencio corto.
  autoHideInstallBanner() {
    localStorage.setItem('pwa-banner-autohidden', Date.now().toString());
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