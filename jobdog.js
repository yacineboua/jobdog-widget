(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const el = document.getElementById('jobdog');
      if (!el) { console.error('No #jobdog found'); return; }
      el.innerHTML = '<div style="padding:16px;border:1px solid #ddd;border-radius:12px">✅ Widget booted (sanity test)</div>';
    });
  })();