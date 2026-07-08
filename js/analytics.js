// OpenRepair Private Analytics — Lightweight page view tracker
// Zero third-party services, full privacy, IP is hashed server-side
(function() {
  try {
    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: window.location.pathname,
        referrer: document.referrer || ''
      })
    }).catch(() => {}); // Silently fail — never block page load
  } catch (e) {}
})();
