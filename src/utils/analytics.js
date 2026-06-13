// Google Analytics 4 + Hotjar placeholders
// Замените YOUR_GA4_ID и YOUR_HOTJAR_ID на свои значения

const GA4_ID = import.meta.env.VITE_GA4_ID || '';
const HOTJAR_ID = import.meta.env.VITE_HOTJAR_ID || '';

export function initAnalytics() {
  if (GA4_ID && GA4_ID !== 'YOUR_GA4_ID') {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID);
  }

  if (HOTJAR_ID && HOTJAR_ID !== 'YOUR_HOTJAR_ID') {
    (function (h, o, t, j, a, r) {
      h.hj = h.hj || function () { (h.hj.q = h.hj.q || []).push(arguments); };
      h._hjSettings = { hjid: HOTJAR_ID, hjsv: 6 };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script');
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
  }
}

export function trackEvent(name, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}
