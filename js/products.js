let products = [];

async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success) {
      products = data.data.map(p => ({
        id: p.id,
        name: p.name,
        cat: p.category,
        cond: p.condition,
        price: p.price,
        img: p.image_path || `assets/images/product-${p.category === 'macbooks' ? 'macbook' : p.category === 'laptops' ? 'laptop' : p.category === 'desktops' ? 'desktop' : 'accessories'}.png`,
        specs: p.specs
      }));
      filterCatalog();
    }
  } catch(e) {
    console.error('Failed to load products', e);
  }
}

let currentFilter = 'all';

function renderProducts(filter = 'all') {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
  filterCatalog();
}

function filterCatalog() {
  const grid = document.getElementById('products-grid');
  if(!grid) return;
  const search = (document.getElementById('product-search')?.value || '').toLowerCase();
  const sort = document.getElementById('product-sort')?.value || 'default';

  let filtered = products.filter(p => {
    const matchCat = currentFilter === 'all' || p.cat === currentFilter;
    const matchSearch = p.name.toLowerCase().includes(search) || p.specs.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });

  if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
  if (sort === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));

  grid.innerHTML = filtered.map(p => `
    <div class="product-card fade-in visible" onclick="openProductPopup(${p.id})" style="cursor: pointer;">
      <div class="product-badge badge-${p.cond}">${p.cond.toUpperCase()}</div>
      <div class="product-image"><img src="${p.img}" alt="${p.name}"></div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="product-specs">${p.specs}</p>
        <div class="product-price">
          <span>₹${p.price.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  `).join('') || '<p style="grid-column: 1/-1; text-align: center; color: var(--gray-500); padding: 3rem;">No products found.</p>';
}

function openProductPopup(id) {
  const p = products.find(prod => prod.id === id);
  if(!p) return;

  const container = document.getElementById('product-popup-container');
  
  // Format specs as bullets if it contains newlines, else just text
  const specsHtml = p.specs.split('\n').filter(s => s.trim() !== '').map(s => `<li>${s}</li>`).join('');

  const popupHtml = `
    <div class="product-popup-overlay active" onclick="closeProductPopup(event || arguments[0])">
      <div class="product-popup-content glass-panel" onclick="(event || arguments[0]).stopPropagation()">
        <button class="popup-close-btn" onclick="closeProductPopup(event || arguments[0])">×</button>
        <div class="popup-grid">
          <div class="popup-image-col">
            <div class="popup-image-wrapper">
              <img src="${p.img}" alt="${p.name}">
            </div>
          </div>
          <div class="popup-info-col">
            <div class="popup-badges">
              <span class="product-badge badge-${p.cond}">${p.cond.toUpperCase()}</span>
              <span class="product-badge" style="background:var(--primary); color:white;">${p.cat.toUpperCase()}</span>
            </div>
            <h2>${p.name}</h2>
            <div class="popup-price">₹${p.price.toLocaleString('en-IN')}</div>
            <div class="popup-divider"></div>
            <h3>About this item</h3>
            <ul class="popup-specs-list">
              ${specsHtml}
            </ul>
            <div class="popup-divider"></div>
            <div class="popup-actions">
              <a href="https://wa.me/918451996541?text=${encodeURIComponent('Hi OpenRepair! I am interested in buying: ' + p.name + ' - ₹' + p.price.toLocaleString('en-IN'))}" target="_blank" class="btn btn-primary btn-block" style="display:flex; justify-content:center; align-items:center; gap:0.5rem; font-size:1.1rem; padding:1rem;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Inquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = popupHtml;
  document.body.style.overflow = 'hidden';
}

function closeProductPopup(e) {
  if (e && e.target.classList.contains('popup-close-btn')) {
    // continue
  } else if (e && !e.target.classList.contains('product-popup-overlay')) {
    return;
  }
  const container = document.getElementById('product-popup-container');
  container.innerHTML = '';
  document.body.style.overflow = '';
}


function initProductFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => renderProducts(e.target.dataset.filter));
  });
}

// Fetch products on load
document.addEventListener('DOMContentLoaded', fetchProducts);
