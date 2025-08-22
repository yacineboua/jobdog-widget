(function () {
    function init() {
      const mount = document.getElementById('jobdog');
      if (!mount) return console.error('[jobdog] #jobdog mount not found');
  
      // 1) Inject the widget markup with scoped styles
      mount.innerHTML = `
        <style>
          #jobdog * { box-sizing: border-box; }
          #jobdog button {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            font-family: inherit;
            margin: 0;
          }
          #jobdog button:hover {
            background: #f5f5f5;
          }
          #jobdog h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
          }
          #jobdog p {
            margin: 0;
            font-size: 12px;
            opacity: 0.7;
          }
          #jobdog a {
            color: #007bff;
            text-decoration: none;
          }
          #jobdog a:hover {
            text-decoration: underline;
          }
        </style>
        <header style="display:flex;gap:8px;align-items:center;justify-content:space-between">
          <h2 style="margin:0">Swipe Internships</h2>
          <div>
            <button id="viewCards">Cards</button>
            <button id="viewSaved">Saved</button>
          </div>
        </header>
  
        <div id="cardsWrap" style="position:relative;height:540px;margin-top:12px;"></div>
        <div id="savedWrap" style="display:none;margin-top:16px;"></div>
  
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
          <button id="skipBtn">Skip ⬅️</button>
          <button id="applyBtn">Apply ↗</button>
          <button id="saveBtn">Save ✅</button>
        </div>
  
        <p style="font-size:12px;opacity:.7;margin-top:12px">
          Tip: ←/→ to skip/save, Enter to open apply link.
        </p>
      `;
  
      // 2) Now safely query elements (scoped to mount)
      const q = (sel) => mount.querySelector(sel);
  
      const cardsWrap = q('#cardsWrap');
      const savedWrap = q('#savedWrap');
      const viewCards = q('#viewCards');
      const viewSaved = q('#viewSaved');
      const skipBtn = q('#skipBtn');
      const saveBtn = q('#saveBtn');
      const applyBtn = q('#applyBtn');
  
      // 3) Guard in case markup changes
      if (!cardsWrap || !savedWrap || !viewCards || !viewSaved || !skipBtn || !applyBtn || !saveBtn) {
        console.error('[jobdog] expected elements missing'); 
        return;
      }
  
      const LS_KEY = 'jobdog_saved_v1';
      const saved = new Map((JSON.parse(localStorage.getItem(LS_KEY) || '[]')).map(j => [j.job_id, j]));
      let jobs = [];
      let idx = 0;
  
      function companyPeopleLinks(company) {
        const enc = encodeURIComponent;
        const q = (s) => `https://www.google.com/search?q=${enc(s)}`;
        return [
          {label: "📇 Tech Recruiters", url: q(`site:linkedin.com/in ("recruiter" OR "university recruiter") "${company}"`)},
          {label: "👩‍💻 SWE / Intern Mentors", url: q(`site:linkedin.com/in ("software engineer" OR "SWE") "${company}" "intern"`)},
          {label: "🧑‍💼 Eng Managers", url: q(`site:linkedin.com/in ("engineering manager" OR "manager software") "${company}"`)},
          {label: "🎓 Campus Programs", url: q(`${company} university recruiting internship`)}
        ];
      }
  
      function sanitize(text, max=300) {
        if (!text) return "";
        const clean = String(text).replace(/\s+/g,' ').trim();
        return clean.length > max ? clean.slice(0,max) + "…" : clean;
      }
  
      function jobToCard(job) {
        const title = job.job_title || "Internship";
        const company = job.employer_name || "Company";
        const loc = job.job_location || job.job_city || "";
        const descr = sanitize(job.job_description, 280);
        const apply = job.job_apply_link || job.job_google_link || "#";
        const people = companyPeopleLinks(company).map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join(' · ');
        const logo = job.employer_logo ? `<img src="${job.employer_logo}" alt="${company}" style="height:32px">` : "";
  
        const el = document.createElement('div');
        el.className = 'card';
        el.style.cssText = `
          position:absolute; inset:0; background:#fff; border:1px solid #eee; border-radius:16px;
          padding:16px; box-shadow:0 10px 30px rgba(0,0,0,.06); display:flex; flex-direction:column;
          user-select:none; touch-action:none;
        `;
        el.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            ${logo}
            <div>
              <div style="font-weight:700;font-size:16px;margin:0;padding:0">${title}</div>
              <div style="opacity:.8;font-size:14px;margin:0;padding:0">${company}${loc ? " • " + loc : ""}</div>
            </div>
          </div>
          <div style="font-size:14px;line-height:1.4;white-space:pre-wrap;flex:1;overflow:auto;margin:0;padding:0">${descr}</div>
          <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;font-size:13px">${people}</div>
          <div style="margin-top:12px;display:flex;gap:8px">
            <a href="${apply}" target="_blank" rel="noopener" style="padding:8px 12px;border:1px solid #ddd;border-radius:10px;text-decoration:none;background:#fff;color:#007bff;font-size:14px;font-family:inherit">Open Apply</a>
            <button class="save" style="padding:8px 12px;border:1px solid #ddd;border-radius:10px;background:#f7fff7;font-size:14px;font-family:inherit;cursor:pointer">Save</button>
            <button class="skip" style="padding:8px 12px;border:1px solid #ddd;border-radius:10px;background:#fff7f7;font-size:14px;font-family:inherit;cursor:pointer">Skip</button>
          </div>
        `;
        el.dataset.jobId = job.job_id || `${company}-${title}`;
        el.dataset.apply = apply;
        return el;
      }
  
      function renderStack() {
        cardsWrap.innerHTML = '';
        const topN = jobs.slice(idx, idx+3); // show top + a couple behind for depth
        topN.forEach((job, i) => {
          const c = jobToCard(job);
          c.style.zIndex = 100 - i;
          c.style.transform = `translateY(${i*6}px) scale(${1 - i*0.02})`;
          cardsWrap.appendChild(c);
          attachSwipe(c, job);
        });
      }
  
      function saveJob(job) {
        if (!job) return;
        saved.set(job.job_id || `${job.employer_name}-${job.job_title}`, job);
        localStorage.setItem(LS_KEY, JSON.stringify(Array.from(saved.values())));
      }
  
      function nextCard(action, openApply=false) {
        const job = jobs[idx];
        if (!job) return;
        if (action === 'save') saveJob(job);
        if (openApply) window.open(job.job_apply_link || job.job_google_link || '#', '_blank', 'noopener');
        idx++;
        renderStack();
      }
  
      function attachSwipe(card, job) {
        let startX = 0, currentX = 0, dragging = false;
  
        const onDown = (x) => { dragging = true; startX = x; card.style.transition = 'none'; };
        const onMove = (x) => {
          if (!dragging) return;
          currentX = x - startX;
          const rot = currentX / 20;
          card.style.transform = `translate(${currentX}px,0) rotate(${rot}deg)`;
          card.style.opacity = String(1 - Math.min(Math.abs(currentX)/300, .4));
        };
        const onUp = () => {
          if (!dragging) return;
          dragging = false;
          const threshold = 120;
          if (currentX > threshold) {
            // Right = Save + (optional) open apply
            card.style.transition = 'transform .2s ease, opacity .2s ease';
            card.style.transform = `translate(500px,-40px) rotate(12deg)`;
            card.style.opacity = '0';
            setTimeout(() => nextCard('save', /*open*/ true), 180);
          } else if (currentX < -threshold) {
            // Left = Skip
            card.style.transition = 'transform .2s ease, opacity .2s ease';
            card.style.transform = `translate(-500px,-40px) rotate(-12deg)`;
            card.style.opacity = '0';
            setTimeout(() => nextCard('skip'), 180);
          } else {
            // Snap back
            card.style.transition = 'transform .2s ease, opacity .2s ease';
            card.style.transform = '';
            card.style.opacity = '1';
          }
          currentX = 0;
        };
  
        // mouse
        card.addEventListener('mousedown', e => onDown(e.clientX));
        window.addEventListener('mousemove', e => onMove(e.clientX));
        window.addEventListener('mouseup', onUp);
        // touch
        card.addEventListener('touchstart', e => onDown(e.touches[0].clientX), {passive:true});
        card.addEventListener('touchmove',  e => onMove(e.touches[0].clientX), {passive:true});
        card.addEventListener('touchend', onUp);
  
        card.querySelector('.save').addEventListener('click', () => nextCard('save', false));
        card.querySelector('.skip').addEventListener('click', () => nextCard('skip', false));
      }
  
      function renderSaved() {
        const list = Array.from(saved.values());
        if (!list.length) { savedWrap.innerHTML = "<p>No saved internships yet.</p>"; return; }
        savedWrap.innerHTML = list.map(job => {
          const company = job.employer_name || "Company";
          const people = companyPeopleLinks(company).map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join(' · ');
          return `
            <div style="border:1px solid #eee;border-radius:12px;padding:12px;margin-bottom:8px;background:#fff">
              <div style="font-weight:600;font-size:16px;margin:0;padding:0">${job.job_title || "Internship"} — ${company}</div>
              <div style="opacity:.8;font-size:14px;margin:0;padding:0">${job.job_location || ""}</div>
              <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;font-size:13px">${people}</div>
              <div style="margin-top:8px">
                <a href="${job.job_apply_link || job.job_google_link || '#'}" target="_blank" rel="noopener" style="color:#007bff;text-decoration:none;font-size:14px">Open Apply ↗</a>
              </div>
            </div>
          `;
        }).join('');
      }
  
      // Controls
      viewCards.addEventListener('click', () => {
        cardsWrap.style.display = '';
        savedWrap.style.display = 'none';
        renderStack();
      });
      viewSaved.addEventListener('click', () => {
        cardsWrap.style.display = 'none';
        savedWrap.style.display = '';
        renderSaved();
      });
      skipBtn.addEventListener('click', () => nextCard('skip'));
      saveBtn.addEventListener('click', () => nextCard('save', false));
      applyBtn.addEventListener('click', () => {
        const job = jobs[idx];
        if (job) window.open(job.job_apply_link || job.job_google_link || '#', '_blank', 'noopener');
      });
  
      // Keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft')  nextCard('skip');
        if (e.key === 'ArrowRight') nextCard('save', true);
        if (e.key === 'Enter')      applyBtn.click();
      });
  
      // Fetch jobs
      (async () => {
        const JOBS_URL = "https://gist.githubusercontent.com/yacineboua/ddd9b515270167f1935f8196546c1755/raw/e64c68eec31bec8bbfb53915912d69679aa79c79/jobs.json";
        try {
          const res = await fetch(JOBS_URL, {cache:'no-store'});
          const raw = await res.json();
          // Accept either array or {data:[...]} shapes (JSearch returns {data: [...]})
          const rows = Array.isArray(raw) ? raw : (raw.data || []);
          // Filter to software internships only (cheap heuristic for now)
          jobs = rows.filter(j => /intern/i.test(j.job_title || '') && /(software|swe|engineering)/i.test(j.job_title || ''));
          if (!jobs.length) jobs = rows; // fallback
          renderStack();
        } catch (err) {
          cardsWrap.innerHTML = `<p>Couldn't load jobs. Check your JOBS_URL.</p>`;
          console.error(err);
        }
      })();
    }
    
    // Wait for DOM, then init
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
})();