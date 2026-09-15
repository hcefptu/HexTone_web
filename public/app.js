// State ứng dụng
let state = {
  products: [],
  cart: [],
  currentCategory: 'all',
  currentBrand: 'all'
};

// Web Audio Context (Dùng để mô phỏng âm thanh gảy đàn mà không cần tải file mp3)
let audioCtx = null;
function playGuitarTone(frequencies) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  frequencies.forEach((freq, idx) => {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      // Giả lập sóng harmonic ấm kiểu bóng đèn tube
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.6);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.6);
    }, idx * 70); // Gảy lần lượt từng dây cách nhau 70ms
  });
}

// 1. Fetch & Render Home API
async function loadHomeData() {
  try {
    const res = await fetch('/api/home');
    const data = await res.json();
    document.getElementById('hero-headline').innerText = data.hero.headline;
    document.getElementById('hero-subline').innerText = data.hero.subline;
  } catch (err) {
    console.error("Lỗi fetch /api/home:", err);
  }
}

// 2. Fetch & Render Products API (Có lọc)
async function loadProducts() {
  try {
    let url = `/api/products?category=${state.currentCategory}&brand=${state.currentBrand}`;
    const res = await fetch(url);
    const result = await res.json();
    state.products = result.data;
    renderProducts();
  } catch (err) {
    console.error("Lỗi fetch /api/products:", err);
  }
}

function renderProducts() {
  const container = document.getElementById('product-grid');
  if (state.products.length === 0) {
    container.innerHTML = `<p class="col-span-3 text-center text-steelMuted py-16 text-sm">No instruments match your criteria.</p>`;
    return;
  }

  container.innerHTML = state.products.map(p => `
    <div class="group bg-smoked border border-borderLine hover:border-amberGlow/50 transition-all duration-300 flex flex-col">
      <!-- Ảnh sản phẩm -->
      <div class="relative overflow-hidden aspect-[4/5] bg-obsidian">
        <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100">
        <span class="absolute top-3 left-3 bg-obsidian/80 border border-borderLine text-amberGlow text-[10px] tracking-wider uppercase px-2 py-1">
          ${p.tag}
        </span>
        
        <!-- Nút nghe âm sắc (Web Audio API) -->
        <button onclick='auditionTone("${p.id}")' class="absolute bottom-3 right-3 bg-obsidian/90 hover:bg-amberGlow hover:text-obsidian text-parchment text-[11px] px-3 py-1.5 uppercase tracking-widest border border-borderLine transition flex items-center gap-1.5">
          <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          Audition Tone
        </button>
      </div>

      <!-- Thông tin sản phẩm -->
      <div class="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div class="flex justify-between text-xs text-steelMuted uppercase tracking-wider mb-2">
            <span>${p.brand}</span>
            <span>${p.category}</span>
          </div>
          <h3 class="font-editorial text-xl text-parchment mb-3">${p.name}</h3>
          <p class="text-xs text-steelMuted font-light leading-relaxed mb-4">
            Pickups: ${p.specs.pickups} • Top: ${p.specs.top}
          </p>
        </div>

        <div class="pt-4 border-t border-borderLine flex items-center justify-between">
          <span class="font-editorial text-lg text-amberGlow">$${p.price.toLocaleString()}</span>
          <button onclick='addToCart("${p.id}")' class="text-xs uppercase tracking-widest text-parchment hover:text-amberGlow transition font-medium">
            + Add to Bag
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Hàm gảy đàn thử nghiệm
window.auditionTone = function(productId) {
  const p = state.products.find(item => item.id === productId);
  if (p && p.toneFreq) {
    playGuitarTone(p.toneFreq);
  }
};

// 3. Giỏ hàng & Cart Drawer
const drawer = document.getElementById('cart-drawer');
const backdrop = document.getElementById('cart-drawer-backdrop');

function toggleDrawer(open) {
  if (open) {
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    drawer.classList.remove('translate-x-full');
  } else {
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    drawer.classList.add('translate-x-full');
  }
}

document.getElementById('cart-toggle').addEventListener('click', () => toggleDrawer(true));
document.getElementById('cart-close').addEventListener('click', () => toggleDrawer(false));
backdrop.addEventListener('click', () => toggleDrawer(false));

window.addToCart = function(id) {
  const guitar = state.products.find(p => p.id === id);
  if (!guitar) return;

  const existing = state.cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ ...guitar, qty: 1 });
  }

  updateCartUI();
  toggleDrawer(true);
};

function updateCartUI() {
  const container = document.getElementById('cart-items-container');
  const badge = document.getElementById('cart-count-badge');
  const totalPrice = document.getElementById('cart-total-price');

  const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
  badge.innerText = totalItems;

  if (state.cart.length === 0) {
    container.innerHTML = `<p class="text-steelMuted text-xs text-center py-10">Your bag is currently empty.</p>`;
    totalPrice.innerText = '$0.00';
    return;
  }

  let total = 0;
  container.innerHTML = state.cart.map((item, idx) => {
    total += item.price * item.qty;
    return `
      <div class="flex gap-4 pb-4 border-b border-borderLine items-center">
        <img src="${item.image}" class="w-16 h-20 object-cover bg-obsidian border border-borderLine">
        <div class="flex-1">
          <h4 class="font-editorial text-base text-parchment">${item.name}</h4>
          <p class="text-xs text-amberGlow">$${item.price.toLocaleString()} × ${item.qty}</p>
        </div>
        <button onclick="removeFromCart(${idx})" class="text-steelMuted hover:text-red-400 text-xs">Remove</button>
      </div>
    `;
  }).join('');

  totalPrice.innerText = `$${total.toLocaleString()}`;
}

window.removeFromCart = function(index) {
  state.cart.splice(index, 1);
  updateCartUI();
};

// 4. About API
async function loadAboutData() {
  try {
    const res = await fetch('/api/about');
    const data = await res.json();
    document.getElementById('about-title').innerText = data.brand;
    document.getElementById('about-text').innerText = data.manifesto;
    document.getElementById('about-stats').innerHTML = data.stats.map(s => `
      <div>
        <div class="font-editorial text-2xl md:text-3xl text-amberGlow">${s.value}</div>
        <div class="text-[11px] uppercase tracking-wider text-steelMuted mt-1">${s.label}</div>
      </div>
    `).join('');
  } catch (err) {
    console.error("Lỗi fetch /api/about:", err);
  }
}

// 5. Sự kiện Lọc (Category & Brand)
document.querySelectorAll('.filter-category').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-category').forEach(b => {
      b.classList.remove('text-amberGlow');
      b.classList.add('text-steelMuted');
    });
    e.target.classList.add('text-amberGlow');
    e.target.classList.remove('text-steelMuted');
    state.currentCategory = e.target.dataset.cat;
    loadProducts();
  });
});

document.getElementById('filter-brand').addEventListener('change', (e) => {
  state.currentBrand = e.target.value;
  loadProducts();
});

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', () => {
  loadHomeData();
  loadProducts();
  loadAboutData();
});