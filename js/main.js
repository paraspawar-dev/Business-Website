function getNavbar(activePage) {
  const links = [
    { id: 'home', path: 'index.html', i18n: 'nav.home', text: 'Home' },
    { id: 'services', path: 'services.html', i18n: 'nav.services', text: 'Services' },
    { id: 'products', path: 'products.html', i18n: 'nav.products', text: 'Products' },
    { id: 'enterprise', path: 'enterprise.html', i18n: 'nav.enterprise', text: 'Enterprises' },
    { id: 'about', path: 'about.html', i18n: 'nav.about', text: 'About Us' },
    { id: 'contact', path: 'contact.html', i18n: 'nav.contact', text: 'Contact' }
  ];
  const lang = localStorage.getItem('clink-lang') || 'en';
  return `
    <nav class="navbar" id="navbar">
      <div class="container nav-container">
        <a href="index.html" class="nav-logo">
          <img src="assets/logo-cropped.png" alt="OpenRepair Logo">
        </a>
        <div class="nav-links">
          ${links.map(l => `<a href="${l.path}" class="${activePage===l.id?'active':''}" data-i18n="${l.i18n}">${l.text}</a>`).join('')}
        </div>
        <div class="nav-actions">
          <button class="btn btn-primary" onclick="openTicketModal()" data-i18n="nav.ticket">Raise a Ticket</button>
        </div>
        <button class="hamburger" onclick="toggleMobile()">☰</button>
      </div>
      <div class="mobile-menu" id="mobile-menu">
        ${links.map(l => `<a href="${l.path}" class="${activePage===l.id?'active':''}" data-i18n="${l.i18n}">${l.text}</a>`).join('')}
        <button class="btn btn-primary" onclick="openTicketModal();toggleMobile()" data-i18n="nav.ticket">Raise a Ticket</button>
      </div>
    </nav>
  `;
}

function getFooter() {
  return `
    <footer class="footer">
      <div class="container footer-grid">
        <div>
          <img src="assets/logo-footer.png" alt="OpenRepair" style="height:65px; margin-bottom:1rem; filter:brightness(0) invert(1);">
          <p data-i18n="footer.text">Your Trusted Technology Partner in Thane.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="index.html" data-i18n="nav.home">Home</a></li>
            <li><a href="services.html" data-i18n="nav.services">Services</a></li>
            <li><a href="products.html" data-i18n="nav.products">Products</a></li>
            <li><a href="about.html" data-i18n="nav.about">About Us</a></li>
            <li><a href="contact.html" data-i18n="nav.contact">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4>Services</h4>
          <ul>
            <li><a href="services.html">Computer Repair</a></li>
            <li><a href="services.html">MacBook Service</a></li>
            <li><a href="services.html">Data Recovery</a></li>
            <li><a href="enterprise.html">B2B IT Support</a></li>
            <li><a href="enterprise.html">AMC Contracts</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact Info</h4>
          <ul>
            <li style="display:flex;gap:0.5rem;margin-bottom:0.5rem;"><span>📍</span> 301, Raghuchandra Niwas, Balkum Pada No.2, Thane (W), 400608</li>
            <li style="display:flex;gap:0.5rem;margin-bottom:0.5rem;"><span>📞</span> <a href="tel:+917700932311">+91 7700932311</a></li>
            <li style="display:flex;gap:0.5rem;margin-bottom:0.5rem;"><span>✉️</span> <a href="mailto:caliberlink@outlook.com">caliberlink@outlook.com</a></li>
            <li style="display:flex;gap:0.5rem;"><span>🕐</span> Mon-Sat: 10AM - 8PM</li>
          </ul>
        </div>
      </div>
      <div class="container footer-bottom">
        <p data-i18n="footer.copyright">© 2026 OpenRepair Computer. All rights reserved.</p>
      </div>
    </footer>
  `;
}

function getWhatsApp() {
  return `<a href="https://wa.me/917700932311" target="_blank" class="whatsapp-float">💬</a>`;
}

function getBrandsHTML() {
  const brands = ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Samsung', 'Microsoft', 'Canon', 'Epson', 'LG', 'Sony', 'Toshiba', 'MSI'];
  const doubled = [...brands, ...brands];
  return `<div class="brands-track">${doubled.map(b => `<div class="brand-logo">${b}</div>`).join('')}</div>`;
}

async function loadTestimonials() {
  const tTrack = document.getElementById('testimonials-track');
  if(!tTrack) return;
  
  try {
    const res = await fetch('/api/testimonials');
    const data = await res.json();
    if(data.success) {
      tTrack.innerHTML = data.data.map(x => `
        <div class="testimonial-card">
          <div class="testimonial-stars">${'★'.repeat(x.stars)}${'☆'.repeat(5-x.stars)}</div>
          <p class="testimonial-text">"${x.text}"</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar">${x.name.charAt(0)}</div>
            <div><strong>${x.name}</strong><br><span style="font-size:0.85rem;color:var(--gray-500)">${x.role}</span></div>
          </div>
        </div>
      `).join('');
    }
  } catch(e) {
    console.error('Failed to load testimonials', e);
  }
}

function toggleMobile() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

function observeFadeIns() {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        e.target.classList.add('visible');
        if(e.target.hasAttribute('data-count')) {
          const target = parseInt(e.target.getAttribute('data-count'));
          let start = 0;
          const duration = 2000;
          const startTime = performance.now();
          const easeOut = t => 1 - Math.pow(1 - t, 3);
          const update = time => {
            let prog = Math.min((time - startTime) / duration, 1);
            e.target.textContent = Math.floor(easeOut(prog) * target) + "+";
            if(prog < 1) requestAnimationFrame(update);
          };
          requestAnimationFrame(update);
          e.target.removeAttribute('data-count'); // prevent re-running
        }
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.fade-in, .stat-number[data-count]').forEach(el => observer.observe(el));
}

function initCardGlow() {
  document.querySelectorAll('.card, .tier-card, .product-card, .testimonial-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

async function initPlanCards() {
  const container = document.getElementById('amc-tiers-container');
  if(!container) return;

  try {
    const res = await fetch('/api/plans');
    const data = await res.json();
    if(data.success) {
      container.innerHTML = data.data.map(p => `
        <div class="tier-card ${p.is_featured ? 'featured' : ''} fade-in">
          <div class="tier-name" style="color:${p.color || 'var(--primary)'};">${p.icon} ${p.name}</div>
          <p style="color:var(--gray-500);font-size:0.9rem;margin-bottom:1rem;">${p.target_audience}</p>
          <ul class="tier-features">
            ${p.features.map(f => `<li>✓ ${f}</li>`).join('')}
          </ul>
          <button class="btn ${p.is_featured ? 'btn-primary' : 'btn-outline'}" onclick="openTicketModal('AMC')" style="width:100%;justify-content:center;">Get Quote</button>
        </div>
      `).join('');
      
      const plans = document.querySelectorAll('.tier-card');
      plans.forEach(plan => {
        plan.addEventListener('click', () => {
          plans.forEach(p => p.classList.remove('selected'));
          plan.classList.add('selected');
        });
      });
      observeFadeIns();
    }
  } catch(e) {
    console.error('Failed to load AMC plans', e);
  }
}

async function initBanner() {
  if (sessionStorage.getItem('clink-banner-closed')) return;

  try {
    const res = await fetch('/api/banner');
    const data = await res.json();
    const bannerData = data.success ? data.data : null;
    if (!bannerData) return;

  const placeholder = document.getElementById('banner-placeholder');
  if (placeholder) {
    placeholder.innerHTML = `
      <div class="announcement-banner visible" id="top-banner">
        <span>${bannerData.text}</span>
        ${bannerData.link_text ? `<a href="${bannerData.link_url}">${bannerData.link_text}</a>` : ''}
        <button class="banner-close" onclick="closeBanner()">×</button>
      </div>
    `;
    document.body.classList.add('has-banner');
  }
  } catch(e) {
    console.error('Failed to load banner', e);
  }
}

function closeBanner() {
  const banner = document.getElementById('top-banner');
  if (banner) {
    banner.classList.remove('visible');
    document.body.classList.remove('has-banner');
    sessionStorage.setItem('clink-banner-closed', 'true');
    setTimeout(() => {
      banner.remove();
    }, 300); // Wait for transition
  }
}

function initParallax() {
  window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    if (hero) {
      const scrolled = window.scrollY;
      hero.style.setProperty('--scroll-offset', `${scrolled * 0.2}px`);
      // Shift pseudo elements slightly
      const before = hero.style;
      before.transform = `translateY(${scrolled * 0.1}px)`;
    }
  });
}

function initPage(pageName) {
  const nav = document.getElementById('nav-placeholder');
  const foot = document.getElementById('footer-placeholder');
  
  if(nav) nav.innerHTML = getNavbar(pageName);
  if(foot) foot.innerHTML = getFooter();
  document.body.insertAdjacentHTML('beforeend', getWhatsApp());
  
  if(typeof getTicketModalHTML === 'function') {
    document.body.insertAdjacentHTML('beforeend', getTicketModalHTML());
  }
  
  const bSlider = document.getElementById('brands-slider');
  if(bSlider) bSlider.innerHTML = getBrandsHTML();
  
  const tTrack = document.getElementById('testimonials-track');
  if(tTrack) {
    loadTestimonials();
    
    // Testimonial drag to scroll
    let isDown = false;
    let startX;
    let scrollLeft;
    tTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - tTrack.offsetLeft;
      scrollLeft = tTrack.scrollLeft;
    });
    tTrack.addEventListener('mouseleave', () => { isDown = false; });
    tTrack.addEventListener('mouseup', () => { isDown = false; });
    tTrack.addEventListener('mousemove', (e) => {
      if(!isDown) return;
      e.preventDefault();
      const x = e.pageX - tTrack.offsetLeft;
      const walk = (x - startX) * 2;
      tTrack.scrollLeft = scrollLeft - walk;
    });
  }

  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if(navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  initBanner();
  observeFadeIns();
  initCardGlow();
  initPlanCards();
  initParallax();
  setLanguage(localStorage.getItem('clink-lang') || 'en');
}
