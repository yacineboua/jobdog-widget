(function () {
    function init() {
      const mount = document.getElementById('jobdog');
      if (!mount) return console.error('[jobdog] #jobdog mount not found');
  
      // 1) Inject the widget markup with scoped styles
      mount.innerHTML = `
        <style>
          #jobdog {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            color: white;
            position: relative;
            overflow: hidden;
          }
          #jobdog::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="wave" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23wave)"/></svg>');
            opacity: 0.3;
            pointer-events: none;
          }
          #jobdog * { box-sizing: border-box; }
          #jobdog button {
            background: rgba(255,255,255,0.9);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            font-family: inherit;
            margin: 0;
            color: #333;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          #jobdog button:hover {
            background: rgba(255,255,255,1);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          #jobdog h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: white;
          }
          #jobdog p {
            margin: 0;
            font-size: 12px;
            opacity: 0.8;
            color: white;
          }
          #jobdog a {
            color: #ffd700;
            text-decoration: none;
            font-weight: 500;
          }
          #jobdog a:hover {
            text-decoration: underline;
            color: #fff;
          }
          #jobdog .card-description::-webkit-scrollbar {
            width: 6px;
          }
          #jobdog .card-description::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.1);
            border-radius: 3px;
          }
          #jobdog .card-description::-webkit-scrollbar-thumb {
            background: rgba(102,126,234,0.6);
            border-radius: 3px;
          }
          #jobdog .card-description::-webkit-scrollbar-thumb:hover {
            background: rgba(102,126,234,0.8);
          }
          .jobdog-logo {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
          }
          .jobdog-logo img {
            width: 40px;
            height: 40px;
            background: transparent;
            border: none;
            display: block;
            object-fit: contain;
          }
          .jobdog-logo h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: white;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
        </style>
        <div class="jobdog-logo">
          <img src="jobdog logo.png" alt="Jobdog Logo" style="width: 40px; height: 40px; background: transparent; border: none; display: block;">
          <h1>jobdog</h1>
        </div>
        <header style="display:flex;gap:8px;align-items:center;justify-content:space-between">
          <h2 style="margin:0">Swipe Internships</h2>
          <div>
            <button id="viewCards">Cards</button>
            <button id="viewSaved">Saved</button>
            <button id="viewApplied">Applied</button>
            <button id="viewNetworking">Networking</button>
          </div>
        </header>
  
        <div id="cardsWrap" style="position:relative;height:540px;margin-top:12px;background:transparent;"></div>
        <div id="savedWrap" style="display:none;margin-top:16px;"></div>
        <div id="appliedWrap" style="display:none;margin-top:16px;"></div>
        <div id="networkingWrap" style="display:none;margin-top:16px;"></div>
  
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
      const appliedWrap = q('#appliedWrap');
      const networkingWrap = q('#networkingWrap');
      const viewCards = q('#viewCards');
      const viewSaved = q('#viewSaved');
      const viewApplied = q('#viewApplied');
      const viewNetworking = q('#viewNetworking');
      const skipBtn = q('#skipBtn');
      const saveBtn = q('#saveBtn');
      const applyBtn = q('#applyBtn');
  
      // 3) Guard in case markup changes
      if (!cardsWrap || !savedWrap || !appliedWrap || !networkingWrap || !viewCards || !viewSaved || !viewApplied || !viewNetworking || !skipBtn || !applyBtn || !saveBtn) {
        console.error('[jobdog] expected elements missing'); 
        return;
      }
  
      const SAVED_LS_KEY = 'jobdog_saved_v1';
      const APPLIED_LS_KEY = 'jobdog_applied_v1';
      const saved = new Map((JSON.parse(localStorage.getItem(SAVED_LS_KEY) || '[]')).map(j => [j.job_id, j]));
      const applied = new Map((JSON.parse(localStorage.getItem(APPLIED_LS_KEY) || '[]')).map(j => [j.job_id, j]));
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

      function getNetworkingContacts(company) {
        const enc = encodeURIComponent;
        const q = (s) => `https://www.google.com/search?q=${enc(s)}`;
        return [
          {
            priority: 1,
            category: "High Priority",
            color: "#ff6b6b",
            contacts: [
              {
                title: "University Recruiters",
                description: "Direct hiring managers for internships",
                searchUrl: q(`site:linkedin.com/in ("university recruiter" OR "campus recruiter") "${company}"`),
                icon: "🎯"
              },
              {
                title: "Engineering Managers",
                description: "Team leads who make hiring decisions",
                searchUrl: q(`site:linkedin.com/in ("engineering manager" OR "software manager") "${company}"`),
                icon: "👨‍💼"
              }
            ]
          },
          {
            priority: 2,
            category: "Medium Priority", 
            color: "#4ecdc4",
            contacts: [
              {
                title: "Senior Software Engineers",
                description: "Potential mentors and referral sources",
                searchUrl: q(`site:linkedin.com/in ("senior software engineer" OR "staff engineer") "${company}"`),
                icon: "👩‍💻"
              },
              {
                title: "Recent Interns",
                description: "Get insider tips and experiences",
                searchUrl: q(`site:linkedin.com/in ("software engineer intern" OR "intern") "${company}" 2023 2024`),
                icon: "🎓"
              }
            ]
          },
          {
            priority: 3,
            category: "Low Priority",
            color: "#95a5a6",
            contacts: [
              {
                title: "HR & Talent Acquisition",
                description: "General recruitment contacts",
                searchUrl: q(`site:linkedin.com/in ("talent acquisition" OR "HR") "${company}"`),
                icon: "📋"
              },
              {
                title: "Company Alumni",
                description: "Former employees who can provide insights",
                searchUrl: q(`site:linkedin.com/in ("former" OR "ex") "${company}" software engineer`),
                icon: "👥"
              }
            ]
          }
        ];
      }
  
      function sanitize(text, max=300) {
        if (!text) return "";
        const clean = String(text).replace(/\s+/g,' ').trim();
        return clean.length > max ? clean.slice(0,max) + "…" : clean;
      }

      function parseJobHighlights(job) {
        if (!job.job_highlights) return { qualifications: "", responsibilities: "", benefits: "", other: "" };
        
        const highlights = job.job_highlights;
        const sections = { qualifications: "", responsibilities: "", benefits: "", other: "" };
        
        // Extract sections from job_highlights
        if (highlights.Qualifications) {
          sections.qualifications = Array.isArray(highlights.Qualifications) 
            ? highlights.Qualifications.join('\n• ') 
            : highlights.Qualifications;
        }
        if (highlights.Responsibilities) {
          sections.responsibilities = Array.isArray(highlights.Responsibilities) 
            ? highlights.Responsibilities.join('\n• ') 
            : highlights.Responsibilities;
        }
        if (highlights.Benefits) {
          sections.benefits = Array.isArray(highlights.Benefits) 
            ? highlights.Benefits.join('\n• ') 
            : highlights.Benefits;
        }
        
        // If no highlights found, use the description as fallback
        if (!sections.qualifications && !sections.responsibilities && !sections.benefits) {
          sections.other = job.job_description || "";
        }

        return sections;
      }
  
      function jobToCard(job) {
        const title = job.job_title || "Internship";
        const company = job.employer_name || "Company";
        const loc = job.job_location || job.job_city || "";
        const parsedDesc = parseJobHighlights(job);
        const apply = job.job_apply_link || job.job_google_link || "#";
        const people = companyPeopleLinks(company).map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join(' · ');
        const logo = job.employer_logo ? `<img src="${job.employer_logo}" alt="${company}" style="height:32px">` : "";

        // Format the description sections
        let descrHtml = "";
        if (parsedDesc.qualifications) {
          descrHtml += `<div style="margin-bottom:12px"><strong style="color:#667eea;font-size:13px">🎯 QUALIFICATIONS</strong><br><span style="font-size:13px;line-height:1.4">${parsedDesc.qualifications}</span></div>`;
        }
        if (parsedDesc.responsibilities) {
          descrHtml += `<div style="margin-bottom:12px"><strong style="color:#667eea;font-size:13px">💼 RESPONSIBILITIES</strong><br><span style="font-size:13px;line-height:1.4">${parsedDesc.responsibilities}</span></div>`;
        }
        if (parsedDesc.benefits) {
          descrHtml += `<div style="margin-bottom:12px"><strong style="color:#667eea;font-size:13px">🎁 BENEFITS</strong><br><span style="font-size:13px;line-height:1.4">${parsedDesc.benefits}</span></div>`;
        }
        if (parsedDesc.other && !parsedDesc.qualifications && !parsedDesc.responsibilities && !parsedDesc.benefits) {
          descrHtml += `<div style="font-size:13px;line-height:1.4">${parsedDesc.other}</div>`;
        }
  
        const el = document.createElement('div');
        el.className = 'card';
        el.style.cssText = `
          position:absolute; inset:0; background:rgba(255,255,255,0.95); border:1px solid rgba(255,255,255,0.3); border-radius:16px;
          padding:16px; box-shadow:0 10px 30px rgba(0,0,0,.2); display:flex; flex-direction:column;
          user-select:none; touch-action:none; backdrop-filter: blur(10px); color: #333;
        `;
        el.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            ${logo}
            <div>
              <div style="font-weight:700;font-size:16px;margin:0;padding:0">${title}</div>
              <div style="opacity:.8;font-size:14px;margin:0;padding:0">${company}${loc ? " • " + loc : ""}</div>
            </div>
          </div>
          <div class="card-description" style="font-size:14px;line-height:1.5;white-space:pre-wrap;flex:1;overflow-y:auto;margin:0;padding:12px;background:rgba(248,249,250,0.8);border-radius:8px;border:1px solid rgba(0,0,0,0.05);max-height:350px;color:#333">${descrHtml}</div>
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
        console.log('[jobdog] renderStack called, jobs.length:', jobs.length, 'idx:', idx);
        cardsWrap.innerHTML = '';
        const topN = jobs.slice(idx, idx+3); // show top + a couple behind for depth
        console.log('[jobdog] topN jobs:', topN.length);
        topN.forEach((job, i) => {
          console.log('[jobdog] Creating card for job:', job.job_title, 'at index:', i);
          const c = jobToCard(job);
          c.style.zIndex = 100 - i;
          c.style.transform = `translateY(${i*6}px) scale(${1 - i*0.02})`;
          cardsWrap.appendChild(c);
          console.log('[jobdog] Card appended to DOM, cardsWrap children:', cardsWrap.children.length);
          attachSwipe(c, job);
        });
      }
  
      function saveJob(job) {
        if (!job) return;
        saved.set(job.job_id || `${job.employer_name}-${job.job_title}`, job);
        localStorage.setItem(SAVED_LS_KEY, JSON.stringify(Array.from(saved.values())));
      }

      function applyToJob(job) {
        if (!job) return;
        applied.set(job.job_id || `${job.employer_name}-${job.job_title}`, job);
        localStorage.setItem(APPLIED_LS_KEY, JSON.stringify(Array.from(applied.values())));
      }
  
      function nextCard(action, openApply=false) {
        const job = jobs[idx];
        if (!job) return;
        if (action === 'save') saveJob(job);
        if (action === 'apply') applyToJob(job);
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
            // Right = Apply (save to applied list)
            card.style.transition = 'transform .2s ease, opacity .2s ease';
            card.style.transform = `translate(500px,-40px) rotate(12deg)`;
            card.style.opacity = '0';
            setTimeout(() => nextCard('apply', false), 180);
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
            <div style="border:1px solid rgba(255,255,255,0.3);border-radius:12px;padding:12px;margin-bottom:8px;background:rgba(255,255,255,0.9);backdrop-filter: blur(10px);box-shadow:0 4px 12px rgba(0,0,0,0.1)">
              <div style="font-weight:600;font-size:16px;margin:0;padding:0;color:#333">${job.job_title || "Internship"} — ${company}</div>
              <div style="opacity:.8;font-size:14px;margin:0;padding:0;color:#666">${job.job_location || ""}</div>
              <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;font-size:13px">${people}</div>
              <div style="margin-top:8px">
                <a href="${job.job_apply_link || job.job_google_link || '#'}" target="_blank" rel="noopener" style="color:#667eea;text-decoration:none;font-size:14px;font-weight:500">Open Apply ↗</a>
              </div>
            </div>
          `;
        }).join('');
      }

      function renderApplied() {
        const list = Array.from(applied.values());
        if (!list.length) { appliedWrap.innerHTML = "<p>No applied internships yet.</p>"; return; }
        appliedWrap.innerHTML = list.map(job => {
          const company = job.employer_name || "Company";
          const people = companyPeopleLinks(company).map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join(' · ');
          return `
            <div style="border:1px solid rgba(255,255,255,0.3);border-radius:12px;padding:12px;margin-bottom:8px;background:rgba(255,255,255,0.9);backdrop-filter: blur(10px);box-shadow:0 4px 12px rgba(0,0,0,0.1)">
              <div style="font-weight:600;font-size:16px;margin:0;padding:0;color:#333">${job.job_title || "Internship"} — ${company}</div>
              <div style="opacity:.8;font-size:14px;margin:0;padding:0;color:#666">${job.job_location || ""}</div>
              <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;font-size:13px">${people}</div>
              <div style="margin-top:8px">
                <a href="${job.job_apply_link || job.job_google_link || '#'}" target="_blank" rel="noopener" style="color:#667eea;text-decoration:none;font-size:14px;font-weight:500">Open Apply ↗</a>
              </div>
            </div>
          `;
        }).join('');
      }

      function renderNetworking() {
        const appliedList = Array.from(applied.values());
        if (!appliedList.length) { 
          networkingWrap.innerHTML = "<p>No applied internships yet. Apply to some jobs first to see networking contacts!</p>"; 
          return; 
        }

        // Group applied jobs by company to avoid duplicates
        const companies = new Map();
        appliedList.forEach(job => {
          const company = job.employer_name || "Company";
          if (!companies.has(company)) {
            companies.set(company, job);
          }
        });

        networkingWrap.innerHTML = Array.from(companies.values()).map(job => {
          const company = job.employer_name || "Company";
          const jobTitle = job.job_title || "Internship";
          const networkingContacts = getNetworkingContacts(company);
          
          return `
            <div style="border:1px solid rgba(255,255,255,0.3);border-radius:16px;padding:16px;margin-bottom:20px;background:rgba(255,255,255,0.9);backdrop-filter: blur(10px);box-shadow:0 4px 12px rgba(0,0,0,0.1)">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
                <div style="font-weight:700;font-size:18px;color:#333">${company}</div>
                <div style="background:rgba(102,126,234,0.2);color:#667eea;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:500">Applied</div>
              </div>
              <div style="font-size:14px;color:#666;margin-bottom:16px">${jobTitle}</div>
              
              ${networkingContacts.map(priorityGroup => `
                <div style="margin-bottom:16px">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
                    <div style="width:12px;height:12px;border-radius:50%;background:${priorityGroup.color}"></div>
                    <div style="font-weight:600;font-size:14px;color:#333">${priorityGroup.category}</div>
                  </div>
                  <div style="display:grid;gap:8px">
                    ${priorityGroup.contacts.map(contact => `
                      <div style="border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:12px;background:rgba(255,255,255,0.6);backdrop-filter: blur(5px);transition:all 0.2s ease">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                          <span style="font-size:16px">${contact.icon}</span>
                          <div style="font-weight:600;font-size:14px;color:#333">${contact.title}</div>
                        </div>
                        <div style="font-size:12px;color:#666;margin-bottom:8px">${contact.description}</div>
                        <a href="${contact.searchUrl}" target="_blank" rel="noopener" 
                           style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;background:#667eea;color:white;text-decoration:none;border-radius:6px;font-size:12px;font-weight:500;transition:all 0.2s ease"
                           onmouseover="this.style.background='#5a6fd8';this.style.transform='translateY(-1px)'" 
                           onmouseout="this.style.background='#667eea';this.style.transform='translateY(0)'">
                          🔍 Find on LinkedIn
                        </a>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }).join('');
      }
  
      // Controls
      viewCards.addEventListener('click', () => {
        cardsWrap.style.display = '';
        savedWrap.style.display = 'none';
        appliedWrap.style.display = 'none';
        networkingWrap.style.display = 'none';
        renderStack();
      });
      viewSaved.addEventListener('click', () => {
        cardsWrap.style.display = 'none';
        savedWrap.style.display = '';
        appliedWrap.style.display = 'none';
        networkingWrap.style.display = 'none';
        renderSaved();
      });
      viewApplied.addEventListener('click', () => {
        cardsWrap.style.display = 'none';
        savedWrap.style.display = 'none';
        appliedWrap.style.display = '';
        networkingWrap.style.display = 'none';
        renderApplied();
      });
      viewNetworking.addEventListener('click', () => {
        cardsWrap.style.display = 'none';
        savedWrap.style.display = 'none';
        appliedWrap.style.display = 'none';
        networkingWrap.style.display = '';
        renderNetworking();
      });
      skipBtn.addEventListener('click', () => nextCard('skip'));
      saveBtn.addEventListener('click', () => nextCard('save', false));
      applyBtn.addEventListener('click', () => {
        const job = jobs[idx];
        if (job) {
          nextCard('apply', false);
        }
      });
  
      // Keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft')  nextCard('skip');
        if (e.key === 'ArrowRight') nextCard('apply', false);
        if (e.key === 'Enter')      applyBtn.click();
      });
  
      // Fetch jobs
      (async () => {
        const JOBS_URL = "https://gist.githubusercontent.com/yacineboua/ddd9b515270167f1935f8196546c1755/raw/e64c68eec31bec8bbfb53915912d69679aa79c79/jobs.json";
        try {
          console.log('[jobdog] Fetching jobs from:', JOBS_URL);
          const res = await fetch(JOBS_URL, {cache:'no-store'});
          const raw = await res.json();
          console.log('[jobdog] Raw response:', raw);
          // Accept either array or {data:[...]} shapes (JSearch returns {data: [...]})
          const rows = Array.isArray(raw) ? raw : (raw.data || []);
          console.log('[jobdog] Total rows:', rows.length);
          // Filter to software internships only (cheap heuristic for now)
          jobs = rows.filter(j => /intern/i.test(j.job_title || '') && /(software|swe|engineering)/i.test(j.job_title || ''));
          console.log('[jobdog] Filtered jobs:', jobs.length);
          if (!jobs.length) {
            jobs = rows; // fallback
            console.log('[jobdog] Using fallback, total jobs:', jobs.length);
          }
          renderStack();
        } catch (err) {
          cardsWrap.innerHTML = `<p>Couldn't load jobs. Check your JOBS_URL.</p>`;
          console.error('[jobdog] Error fetching jobs:', err);
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