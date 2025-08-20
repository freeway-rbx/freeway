// Google Analytics 4 implementation
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = 'G-31D2KY463B';
const DEBUG_MODE = true; // Set to true to enable debug logging
const GA_DEBUG_MODE = true; // Set to true to enable Google Analytics debug mode

// Configuration for different environments
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Geolocation settings
const ENABLE_GEOLOCATION = isProduction; // Enable geolocation in production only
const ENABLE_ANONYMIZED_IP = true; // Always anonymize IP addresses for privacy

/**
 * Initialize Google Analytics
 */
export async function initAnalytics(measurementId: string = GA_MEASUREMENT_ID): Promise<void> {
  try {
    if (DEBUG_MODE) {
      console.log('[Analytics] Initializing with measurement ID:', measurementId);
    }
    
    // Load Google Analytics script if not already loaded
    if (!window.gtag) {
      if (DEBUG_MODE) {
        console.log('[Analytics] Loading Google Analytics script...');
      }
      await loadGoogleAnalyticsScript(measurementId);
    }

    // Configure GA4
    if (DEBUG_MODE) {
      console.log('[Analytics] Configuring GA4...');
      console.log('[Analytics] Environment:', isProduction ? 'production' : 'development');
      console.log('[Analytics] Geolocation enabled:', ENABLE_GEOLOCATION);
      console.log('[Analytics] IP anonymization enabled:', ENABLE_ANONYMIZED_IP);
    }
    
    const configOptions: any = {
      send_page_view: false, // We'll handle page views manually for SPA
      debug_mode: GA_DEBUG_MODE, // Enable GA debug mode
      anonymize_ip: ENABLE_ANONYMIZED_IP, // Anonymize IP addresses for privacy
    };

    // Enable geolocation only in production
    if (ENABLE_GEOLOCATION) {
      configOptions.allow_google_signals = true; // Allow Google signals for geolocation
      configOptions.allow_ad_personalization_signals = false; // Disable ad personalization
    } else {
      configOptions.allow_google_signals = false; // Disable geolocation in development
      configOptions.allow_ad_personalization_signals = false;
    }

    window.gtag('config', measurementId, configOptions);

    // Send app start event
    if (DEBUG_MODE) {
      console.log('[Analytics] Sending app start event...');
    }
    await sendAppStartEvent();
    
    if (DEBUG_MODE) {
      console.log('[Analytics] Initialization completed successfully');
    }
  } catch (error) {
    console.warn('[Analytics] Failed to initialize analytics:', error);
  }
}

/**
 * Load Google Analytics script dynamically
 */
async function loadGoogleAnalyticsScript(measurementId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (DEBUG_MODE) {
      console.log('[Analytics] Starting to load Google Analytics script...');
    }
    
    // Check if script is already loaded
    if (document.querySelector(`script[src*="googletagmanager.com"]`)) {
      if (DEBUG_MODE) {
        console.log('[Analytics] Google Analytics script already exists in DOM');
      }
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    
    if (DEBUG_MODE) {
      console.log('[Analytics] Created script element with src:', script.src);
    }
    
    script.onload = () => {
      if (DEBUG_MODE) {
        console.log('[Analytics] Google Analytics script loaded successfully');
      }
      // Initialize gtag function
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      if (DEBUG_MODE) {
        console.log('[Analytics] gtag function initialized');
      }
      resolve();
    };
    
    script.onerror = (error) => {
      if (DEBUG_MODE) {
        console.error('[Analytics] Failed to load Google Analytics script:', error);
      }
      reject(new Error('Failed to load Google Analytics script'));
    };

    // Add script to document
    document.head.appendChild(script);
    if (DEBUG_MODE) {
      console.log('[Analytics] Script element added to document head');
    }
  });
}

/**
 * Send a custom analytics event
 */
export async function sendAnalyticsEvent(
  eventName: string,
  parameters: Record<string, any> = {}
): Promise<void> {
  try {
    if (DEBUG_MODE) {
      console.log('[Analytics] Sending event:', eventName, 'with parameters:', parameters);
    }
    
    if (!window.gtag) {
      console.warn('[Analytics] gtag not found; event not sent:', eventName, parameters);
      return;
    }

    window.gtag('event', eventName, parameters);
    
    if (DEBUG_MODE) {
      console.log('[Analytics] Event sent successfully:', eventName);
    }
  } catch (error) {
    console.warn('[Analytics] Failed to send event:', eventName, error);
  }
}

/**
 * Send app start event
 */
async function sendAppStartEvent(): Promise<void> {
  if (DEBUG_MODE) {
    console.log('[Analytics] Sending app start event...');
  }
  await sendAnalyticsEvent('app_start', {
    event_category: 'app_lifecycle',
    event_label: 'app_start',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send page view event for SPA navigation
 */
export async function sendPageView(pagePath: string, pageTitle?: string): Promise<void> {
  await sendAnalyticsEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
}

/**
 * Send piece created event
 */
export async function sendPieceCreatedEvent(extension: string, type: string): Promise<void> {
  if (DEBUG_MODE) {
    console.log('[Analytics] Sending piece created event for:', extension, type);
  }
  await sendAnalyticsEvent('piece_created', {
    event_category: 'piece_operations',
    event_label: 'piece_created',
    piece_extension: extension,
    piece_type: type,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send piece deleted event
 */
export async function sendPieceDeletedEvent(extension: string, type: string): Promise<void> {
  if (DEBUG_MODE) {
    console.log('[Analytics] Sending piece deleted event for:', extension, type);
  }
  await sendAnalyticsEvent('piece_deleted', {
    event_category: 'piece_operations',
    event_label: 'piece_deleted',
    piece_extension: extension,
    piece_type: type,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send piece updated event
 */
export async function sendPieceUpdatedEvent(extension: string, type: string): Promise<void> {
  if (DEBUG_MODE) {
    console.log('[Analytics] Sending piece updated event for:', extension, type);
  }
  await sendAnalyticsEvent('piece_updated', {
    event_category: 'piece_operations',
    event_label: 'piece_updated',
    piece_extension: extension,
    piece_type: type,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Enable Google Analytics debug mode in the browser
 * This will show debug information in the browser console and GA dashboard
 */
export function enableGADebugMode(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    // Enable debug mode
    window.gtag('config', GA_MEASUREMENT_ID, {
      debug_mode: true,
    });
    console.log('[Analytics] Google Analytics debug mode enabled');
    console.log('[Analytics] You can now see real-time events in your GA4 dashboard');
    console.log('[Analytics] Also check the browser console for detailed GA debug info');
  } else {
    console.warn('[Analytics] gtag not available, cannot enable debug mode');
  }
}

/**
 * Disable Google Analytics debug mode
 */
export function disableGADebugMode(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      debug_mode: false,
    });
    console.log('[Analytics] Google Analytics debug mode disabled');
  }
}

/**
 * Enable geolocation tracking
 */
export function enableGeolocation(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      allow_google_signals: true,
      allow_ad_personalization_signals: false,
    });
    console.log('[Analytics] Geolocation tracking enabled');
  }
}

/**
 * Disable geolocation tracking
 */
export function disableGeolocation(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    console.log('[Analytics] Geolocation tracking disabled');
  }
}

/**
 * Get current analytics configuration
 */
export function getAnalyticsConfig(): {
  isProduction: boolean;
  geolocationEnabled: boolean;
  ipAnonymized: boolean;
  debugMode: boolean;
} {
  return {
    isProduction,
    geolocationEnabled: ENABLE_GEOLOCATION,
    ipAnonymized: ENABLE_ANONYMIZED_IP,
    debugMode: DEBUG_MODE,
  };
}

/**
 * Test function to manually trigger an analytics event
 * Call this from browser console: window.testAnalytics()
 */
export function testAnalytics(): void {
  sendAnalyticsEvent('test_event', {
    event_category: 'test',
    event_label: 'manual_test',
    timestamp: new Date().toISOString(),
  }).then(() => {
    console.log('[Analytics] Test event sent successfully');
  }).catch((error) => {
    console.error('[Analytics] Test event failed:', error);
  });
}

// Make test function available globally for debugging
declare global {
  interface Window {
    dataLayer: any[];
    testAnalytics: () => void;
    enableGADebugMode: () => void;
    disableGADebugMode: () => void;
    enableGeolocation: () => void;
    disableGeolocation: () => void;
    getAnalyticsConfig: () => any;
  }
}

// Expose test functions globally
if (typeof window !== 'undefined') {
  window.testAnalytics = testAnalytics;
  window.enableGADebugMode = enableGADebugMode;
  window.disableGADebugMode = disableGADebugMode;
  window.enableGeolocation = enableGeolocation;
  window.disableGeolocation = disableGeolocation;
  window.getAnalyticsConfig = getAnalyticsConfig;
}
