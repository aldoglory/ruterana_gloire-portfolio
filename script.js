const root = document.documentElement;
const btn = document.getElementById('themeToggle');
const label = document.getElementById('themeLabel');

function applyTheme(theme){
  root.setAttribute('data-theme', theme);
  if(label) label.textContent = theme === 'dark' ? 'light' : 'dark';
}

const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(saved || (prefersDark ? 'dark' : 'light'));

if(btn){
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });
}

/* ---------- cross-page navigation with view transitions ---------- */
function goTo(href){
  if(document.startViewTransition){
    document.startViewTransition(() => { window.location.href = href; });
  } else {
    window.location.href = href;
  }
}

/* ---------- command palette ---------- */
(function(){
  const page = location.pathname.split('/').pop() || 'index.html';

  const commands = [
    { group:'Go to', label:'Home',       href:'index.html',      action:() => goTo('index.html') },
    { group:'Go to', label:'About',      href:'about.html',      action:() => goTo('about.html') },
    { group:'Go to', label:'Experience', href:'experience.html', action:() => goTo('experience.html') },
    { group:'Go to', label:'Work',       href:'work.html',       action:() => goTo('work.html') },
    { group:'Go to', label:'Education',  href:'education.html',  action:() => goTo('education.html') },
    { group:'Go to', label:'Contact',    href:'contact.html',    action:() => goTo('contact.html') },
    { group:'Do',    label:'Toggle theme', hint:'light / dark', action:() => btn && btn.click() },
    { group:'Do',    label:'Hire me',      hint:'↗ LinkedIn',   action:() => window.open('https://www.linkedin.com/in/ruterana-gloire-06a904423/', '_blank', 'noopener') },
    { group:'Do',    label:'View CV',      hint:'↗ PDF',        action:() => window.open('cv.pdf', '_blank', 'noopener') },
    { group:'Do',    label:'Email me',    hint:'ruterana47@gmail.com', action:() => window.location.href = 'mailto:ruterana47@gmail.com' },
    { group:'Do',    label:'Open GitHub', hint:'↗',            action:() => window.open('https://github.com/aldoglory', '_blank', 'noopener') },
    { group:'Do',    label:'Open LinkedIn', hint:'↗',          action:() => window.open('https://www.linkedin.com/in/ruterana-gloire-06a904423/', '_blank', 'noopener') },
  ].filter(c => c.href !== page).map(c => ({ ...c, hint: c.hint || '' }));

  let activeIndex = 0;
  let filtered = commands.slice();

  const backdrop = document.createElement('div');
  backdrop.className = 'cmdk-backdrop';
  backdrop.innerHTML = `
    <div class="cmdk-panel" role="dialog" aria-label="Command menu">
      <div class="cmdk-input-row">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="cmdk-input" type="text" placeholder="Jump to a page, or run a command…" autocomplete="off" spellcheck="false">
        <span class="cmdk-close-hint">esc</span>
      </div>
      <ul class="cmdk-list" role="listbox"></ul>
    </div>`;
  document.body.appendChild(backdrop);

  const input = backdrop.querySelector('.cmdk-input');
  const list = backdrop.querySelector('.cmdk-list');

  function render(){
    list.innerHTML = '';
    if(filtered.length === 0){
      list.innerHTML = '<li class="cmdk-empty">No matches</li>';
      return;
    }
    filtered.forEach((cmd, i) => {
      const li = document.createElement('li');
      li.className = 'cmdk-item';
      li.setAttribute('role', 'option');
      li.dataset.active = i === activeIndex ? 'true' : 'false';
      li.innerHTML = `<span><span class="cmdk-group">${cmd.group}</span>${cmd.label}</span><span class="cmdk-hint">${cmd.hint}</span>`;
      li.addEventListener('mouseenter', () => { activeIndex = i; render(); });
      li.addEventListener('click', () => run(cmd));
      list.appendChild(li);
    });
  }

  function filter(query){
    const q = query.trim().toLowerCase();
    filtered = q ? commands.filter(c => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)) : commands.slice();
    activeIndex = 0;
    render();
  }

  function run(cmd){
    close();
    cmd.action();
  }

  function open(){
    backdrop.classList.add('is-open');
    input.value = '';
    filter('');
    setTimeout(() => input.focus(), 10);
  }

  function close(){
    backdrop.classList.remove('is-open');
  }

  input.addEventListener('input', () => filter(input.value));

  backdrop.addEventListener('click', (e) => {
    if(e.target === backdrop) close();
  });

  backdrop.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){ close(); }
    else if(e.key === 'ArrowDown'){ e.preventDefault(); activeIndex = Math.min(activeIndex + 1, filtered.length - 1); render(); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); render(); }
    else if(e.key === 'Enter'){ e.preventDefault(); if(filtered[activeIndex]) run(filtered[activeIndex]); }
  });

  document.addEventListener('keydown', (e) => {
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
      e.preventDefault();
      backdrop.classList.contains('is-open') ? close() : open();
    }
  });

  const trigger = document.getElementById('cmdkTrigger');
  if(trigger){ trigger.addEventListener('click', open); }

  // intercept in-site nav links to use the same smooth transition
  document.querySelectorAll('a[href$=".html"]').forEach(a => {
    if(a.hostname === location.hostname){
      a.addEventListener('click', (e) => {
        e.preventDefault();
        goTo(a.getAttribute('href'));
      });
    }
  });
})();

/* ---------- live footer status ---------- */
(function(){
  const footer = document.querySelector('footer.wrap');
  if(!footer) return;
  const status = document.createElement('div');
  status.className = 'status';
  status.innerHTML = '<span class="dot"></span><span id="localTime"></span>';
  footer.appendChild(status);

  function updateTime(){
    const timeEl = document.getElementById('localTime');
    if(!timeEl) return;
    const now = new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', timeZone:'Africa/Kigali' });
    timeEl.textContent = `${now} in Kigali — open to opportunities`;
  }
  updateTime();
  setInterval(updateTime, 30000);
})();

/* ---------- ambient tech background (circuit network) ---------- */
(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'bgfx';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let w, h, dpr, nodes, pulses;
  const isMobile = window.innerWidth < 760;
  const NODE_COUNT = isMobile ? 34 : 64;
  const LINK_DIST = isMobile ? 130 : 160;
  const PULSE_CHANCE = 0.006;

  function colors(){
    const cs = getComputedStyle(document.documentElement);
    return {
      line: cs.getPropertyValue('--line').trim() || 'rgba(120,130,135,0.14)',
      accent: cs.getPropertyValue('--accent').trim() || '#B0862A',
      ink: cs.getPropertyValue('--ink-soft').trim() || '#4B5D63'
    };
  }

  function hexToRgb(hex){
    hex = hex.replace('#','').trim();
    if(hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    const num = parseInt(hex, 16);
    return `${(num>>16)&255}, ${(num>>8)&255}, ${num&255}`;
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initNodes(){
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() < 0.14 ? 2.2 : 1.2
    }));
    pulses = [];
  }

  resize();
  initNodes();
  window.addEventListener('resize', () => { resize(); initNodes(); });

  function step(){
    const { line, accent } = colors();
    const accentRgb = hexToRgb(accent);
    ctx.clearRect(0, 0, w, h);

    // move nodes
    for(const n of nodes){
      n.x += n.vx; n.y += n.vy;
      if(n.x < -20) n.x = w + 20; if(n.x > w + 20) n.x = -20;
      if(n.y < -20) n.y = h + 20; if(n.y > h + 20) n.y = -20;
    }

    // draw links (circuit-like straight segments)
    ctx.lineWidth = 1;
    for(let i = 0; i < nodes.length; i++){
      for(let j = i + 1; j < nodes.length; j++){
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < LINK_DIST){
          const alpha = (1 - dist / LINK_DIST) * 0.5;
          ctx.strokeStyle = line.includes('rgba') ? line : `rgba(${accentRgb}, ${alpha * 0.4})`;
          ctx.globalAlpha = line.includes('rgba') ? alpha : 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          // occasionally spawn a data pulse along this link
          if(Math.random() < PULSE_CHANCE && pulses.length < 10){
            pulses.push({ a, b, t: 0, speed: 0.006 + Math.random() * 0.01 });
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    // draw nodes
    ctx.fillStyle = `rgba(${accentRgb}, 0.55)`;
    for(const n of nodes){
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw + advance pulses (small bright dot traveling a link, circuit "signal")
    ctx.fillStyle = `rgba(${accentRgb}, 0.9)`;
    pulses = pulses.filter(p => p.t <= 1);
    for(const p of pulses){
      const x = p.a.x + (p.b.x - p.a.x) * p.t;
      const y = p.a.y + (p.b.y - p.a.y) * p.t;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
      p.t += p.speed;
    }

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
})();
