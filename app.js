'use strict';

// ============================================
// CONFIG
// ============================================
const CONFIG = {
    whatsappNumber: '553532672238',
    minOrder: 10,
    // Seg–Sáb, 5h às 19:30 (horário de Brasília)
    hours: { days: [1, 2, 3, 4, 5, 6], open: 5 * 60, close: 19 * 60 + 30, timeZone: 'America/Sao_Paulo' },
    storageKeys: {
        cart: 'paodemel:cart',
        favorites: 'paodemel:favorites',
        customer: 'paodemel:customer'
    }
};

// chip = rótulo do filtro · tag = rótulo exibido no card
const CATEGORIES = [
    { id: 'paes', chip: 'Pães', tag: 'Pães' },
    { id: 'doces', chip: 'Doces', tag: 'Doces' },
    { id: 'bolos', chip: 'Bolos', tag: 'Bolos & Tortas' },
    { id: 'salgados', chip: 'Salgados', tag: 'Salgados' }
];
const categoryById = new Map(CATEGORIES.map(c => [c.id, c]));

const PAYMENT_LABELS = {
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    cartao: 'Cartão'
};

// ============================================
// PRODUTOS
// image = nome base; existem as versões images/<nome>.webp (640px) e images/<nome>-360.webp
// Produtos com unit 'Kg' são vendidos de 100 em 100 g.
// ============================================
const products = [
    {
        id: 1,
        name: 'Pão Francês',
        description: 'Crocante por fora, macio por dentro. O tradicional pãozinho fresquinho de cada dia.',
        price: 1.00,
        unit: 'un',
        category: 'paes',
        image: 'pao_frances',
        badge: 'Mais Vendido'
    },
    {
        id: 2,
        name: 'Pão de Queijo',
        description: 'Pão de queijo mineiro tradicional, crocante por fora e macio por dentro.',
        price: 31.90,
        unit: 'Kg',
        category: 'paes',
        image: 'pao_de_queijo',
        badge: 'Tradicional'
    },
    {
        id: 3,
        name: 'Biscoitão',
        description: 'Biscoitão caseiro tradicional, crocante e irresistível para acompanhar o café.',
        price: 2.00,
        unit: 'un',
        category: 'paes',
        image: 'biscoitao',
        badge: 'Mais Vendido'
    },
    {
        id: 4,
        name: 'Pão de Leite',
        description: 'Pãozinho fofinho e levemente adocicado, perfeito para o café da manhã.',
        price: 1.50,
        unit: 'un',
        category: 'paes',
        image: 'pao_de_leite',
        badge: 'Mais Vendido'
    },
    {
        id: 5,
        name: 'Pão de Knorr',
        description: 'Pão macio e saboroso ideal para o café da tarde.',
        price: 1.20,
        unit: 'un',
        category: 'paes',
        image: 'pao_knor_mortadela',
        badge: ''
    },
    {
        id: 6,
        name: 'Broa de Fubá',
        description: 'Receita tradicional mineira com fubá selecionado e um toque caseiro especial.',
        price: 29.00,
        unit: 'Kg',
        category: 'paes',
        image: 'broa_fuba',
        badge: ''
    },
    {
        id: 7,
        name: 'Broa com Gotas de Chocolate',
        description: 'A clássica broa de fubá com irresistíveis gotas de chocolate derretido.',
        price: 3.00,
        unit: 'un',
        category: 'doces',
        image: 'broa_chocolate',
        badge: 'Especial'
    },
    {
        id: 8,
        name: 'Rosquinhas de Creme',
        description: 'Rosquinhas douradas e macias com saborosa cobertura de creme.',
        price: 1.80,
        unit: 'un',
        category: 'doces',
        image: 'rosquinhas_creme',
        badge: 'Favorito'
    },
    {
        id: 9,
        name: 'Bolo de Chocolate',
        description: 'Bolo retangular de chocolate com cobertura cremosa, cortado em pedaços generosos.',
        price: 3.50,
        unit: 'un',
        category: 'bolos',
        image: 'chocolate_cake',
        badge: 'Especial'
    },
    {
        id: 10,
        name: 'Bolo de Cenoura',
        description: 'Bolo de cenoura fofinho com generosa cobertura de ganache de chocolate.',
        price: 3.50,
        unit: 'un',
        category: 'bolos',
        image: 'bolo_cenoura',
        badge: ''
    },
    {
        id: 11,
        name: 'Salgados Sortidos',
        description: 'Coxinha, empada e pastel assado de frango — os salgados mais pedidos da casa.',
        price: 6.00,
        unit: 'un',
        category: 'salgados',
        image: 'salgados_sortidos',
        badge: 'Novidade'
    }
];
const productById = new Map(products.map(p => [p.id, p]));

// ============================================
// HELPERS
// ============================================
const $ = id => document.getElementById(id);
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const kgFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const formatPrice = value => brl.format(value);
const isByWeight = product => product.unit === 'Kg';
// Quantidade de itens por peso é guardada em gramas (evita erro de ponto flutuante)
const stepFor = product => (isByWeight(product) ? 100 : 1);
const lineTotal = (product, qty) => product.price * (isByWeight(product) ? qty / 1000 : qty);
const imageSrc = (product, small = false) => `images/${product.image}${small ? '-360' : ''}.webp`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function formatQty(product, qty) {
    if (!isByWeight(product)) return String(qty);
    return qty >= 1000 ? `${kgFormat.format(qty / 1000)} kg` : `${qty} g`;
}

const escapeHTML = str => String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

// Busca sem acento e sem diferenciar maiúsculas
const normalize = str => str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const icon = (name, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

const storage = {
    load(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    },
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Modo privado / armazenamento cheio: segue sem persistir
        }
    }
};

function bump(el) {
    if (prefersReducedMotion.matches || !el.animate) return;
    el.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
        { duration: 350, easing: 'cubic-bezier(.3, 1.5, .6, 1)' }
    );
}

// ============================================
// STATE
// ============================================
let cart = storage.load(CONFIG.storageKeys.cart, [])
    .filter(item => productById.has(item.id) && item.qty > 0);
const favorites = new Set(storage.load(CONFIG.storageKeys.favorites, []));
const filter = { category: 'all', query: '' };
let orderSent = false;

const getQty = id => cart.find(i => i.id === id)?.qty ?? 0;
// Pedido mínimo vale só para entrega; retirada na loja não tem mínimo
const isDelivery = () => fields.mode.value === 'entrega';
const meetsMinOrder = () => !isDelivery() || cartTotal() >= CONFIG.minOrder;
const cartTotal = () => cart.reduce((sum, i) => sum + lineTotal(productById.get(i.id), i.qty), 0);
// Itens por peso contam como 1 no contador
const cartCount = () => cart.reduce((sum, i) => sum + (isByWeight(productById.get(i.id)) ? 1 : i.qty), 0);

// ============================================
// DOM
// ============================================
const header = $('header');
const nav = $('nav');
const menuBtn = $('menuBtn');
const menuToolbar = $('menuToolbar');
const chipsEl = $('categoryChips');
const searchInput = $('productSearch');
const productsGrid = $('productsGrid');
const productsEmpty = $('productsEmpty');
const drawer = $('cartDrawer');
const cartItemsEl = $('cartItems');
const checkoutForm = $('checkoutForm');
const fields = checkoutForm.elements;
const firstPaymentInput = checkoutForm.querySelector('input[name="payment"]');
const addressField = $('addressField');
const checkoutBtn = $('checkoutBtn');
const cartBar = $('cartBar');
const toast = $('toast');
const toastMessage = $('toastMessage');

// ============================================
// STATUS DA LOJA (aberto / fechado)
// ============================================
function getStoreStatus(now = new Date()) {
    const { days, open, close, timeZone } = CONFIG.hours;
    const local = new Date(now.toLocaleString('en-US', { timeZone }));
    const day = local.getDay();
    const minutes = local.getHours() * 60 + local.getMinutes();
    const openToday = days.includes(day);
    const fmt = m => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;

    if (openToday && minutes >= open && minutes < close) {
        return { open: true, html: `<strong>Aberto agora</strong> · fecha às ${fmt(close)}` };
    }

    let when;
    if (openToday && minutes < open) {
        when = 'hoje';
    } else {
        const next = [1, 2, 3, 4, 5, 6, 7].map(d => (day + d) % 7).find(d => days.includes(d));
        const names = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
        when = next === (day + 1) % 7 ? 'amanhã' : names[next];
    }
    return { open: false, html: `<strong>Fechado agora</strong> · abre ${when} às ${fmt(open)}` };
}

function renderStoreStatus() {
    const status = getStoreStatus();
    document.querySelectorAll('[data-store-status]').forEach(el => {
        el.classList.toggle('is-closed', !status.open);
        el.querySelector('[data-status-text]').innerHTML = status.html;
    });
}

// ============================================
// HEADER / MENU
// ============================================
let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        menuToolbar.classList.toggle('is-stuck', menuToolbar.getBoundingClientRect().top <= header.offsetHeight + 1);
        scrollTicking = false;
    });
}, { passive: true });

function setMenuOpen(open) {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}

menuBtn.addEventListener('click', () => setMenuOpen(!nav.classList.contains('is-open')));
nav.addEventListener('click', e => {
    if (e.target.closest('a')) setMenuOpen(false);
});
document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !header.contains(e.target)) setMenuOpen(false);
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenuOpen(false);
        menuBtn.focus();
    }
});

// Destaca no menu a seção visível
function initActiveNav() {
    if (!('IntersectionObserver' in window)) return;
    const links = new Map([...nav.querySelectorAll('a')].map(a => [a.hash.slice(1), a]));
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const link = links.get(entry.target.id);
            if (entry.isIntersecting) links.forEach(a => a.classList.toggle('is-active', a === link));
            else link?.classList.remove('is-active');
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => {
        const section = $(id);
        if (section) observer.observe(section);
    });
}

// ============================================
// CARDÁPIO
// ============================================
function renderChips() {
    const all = [{ id: 'all', chip: 'Todos', count: products.length }]
        .concat(CATEGORIES.map(c => ({ ...c, count: products.filter(p => p.category === c.id).length })));

    chipsEl.innerHTML = all.map(c => `
      <button type="button" class="chip-filter" data-category="${c.id}" aria-pressed="${c.id === filter.category}">
        ${c.chip} <small>${c.count}</small>
      </button>`).join('');
}

function buyControlHTML(product, qty) {
    const name = escapeHTML(product.name);
    if (qty === 0) {
        const label = isByWeight(product) ? 'Adicionar<span class="hide-xs"> 100 g</span>' : 'Adicionar';
        return `<button type="button" class="add-btn" data-action="inc" data-id="${product.id}"
            aria-label="Adicionar ${name} ao carrinho">${icon('plus')} ${label}</button>`;
    }
    return stepperHTML(product, qty);
}

function stepperHTML(product, qty, extraClass = '') {
    const name = escapeHTML(product.name);
    const step = isByWeight(product) ? ' 100 g' : '';
    return `
      <div class="stepper ${extraClass}">
        <button type="button" data-action="dec" data-id="${product.id}" aria-label="Diminuir${step} de ${name}">${icon('minus')}</button>
        <output aria-live="polite" aria-label="Quantidade de ${name}">${formatQty(product, qty)}</output>
        <button type="button" data-action="inc" data-id="${product.id}" aria-label="Aumentar${step} de ${name}">${icon('plus')}</button>
      </div>`;
}

function productCardHTML(product) {
    const name = escapeHTML(product.name);
    const fav = favorites.has(product.id);
    const qty = getQty(product.id);
    const priceNote = isByWeight(product)
        ? `<small>100 g = ${formatPrice(product.price / 10)}</small>`
        : '';

    return `
      <article class="product${qty ? ' in-cart' : ''}" data-product="${product.id}">
        <div class="product-media">
          <img src="${imageSrc(product)}"
               srcset="${imageSrc(product, true)} 360w, ${imageSrc(product)} 640w"
               sizes="(min-width: 1100px) 270px, (min-width: 720px) 30vw, calc(50vw - 26px)"
               alt="${name}" width="640" height="640" loading="lazy" decoding="async" />
          ${product.badge ? `<span class="badge">${escapeHTML(product.badge)}</span>` : ''}
          <button type="button" class="fav-btn" data-action="fav" data-id="${product.id}"
            aria-pressed="${fav}" aria-label="Favoritar ${name}">${icon('heart')}</button>
        </div>
        <div class="product-body">
          <span class="product-cat">${categoryById.get(product.category)?.tag ?? ''}</span>
          <h3>${name}</h3>
          <p class="product-desc">${escapeHTML(product.description)}</p>
          <div class="product-foot">
            <p class="price"><strong>${formatPrice(product.price)}</strong> <span>/${product.unit}</span>${priceNote}</p>
            <div data-buy="${product.id}">${buyControlHTML(product, qty)}</div>
          </div>
        </div>
      </article>`;
}

function renderProducts() {
    productsGrid.innerHTML = products.map(productCardHTML).join('');
    applyFilter();
}

function applyFilter() {
    const q = normalize(filter.query.trim());
    let visible = 0;

    productsGrid.querySelectorAll('[data-product]').forEach(card => {
        const p = productById.get(Number(card.dataset.product));
        const matchesCategory = filter.category === 'all' || p.category === filter.category;
        const matchesQuery = !q || normalize(`${p.name} ${p.description}`).includes(q);
        card.hidden = !(matchesCategory && matchesQuery);
        if (!card.hidden) visible++;
    });

    productsEmpty.hidden = visible > 0;
    chipsEl.querySelectorAll('[data-category]').forEach(chip => {
        chip.setAttribute('aria-pressed', String(chip.dataset.category === filter.category));
    });
}

function setCategory(category) {
    filter.category = category;
    applyFilter();
}

chipsEl.addEventListener('click', e => {
    const chip = e.target.closest('[data-category]');
    if (chip) setCategory(chip.dataset.category);
});

searchInput.addEventListener('input', () => {
    filter.query = searchInput.value;
    applyFilter();
});

$('clearSearch').addEventListener('click', () => {
    searchInput.value = '';
    filter.query = '';
    setCategory('all');
    searchInput.focus();
});

// Links do rodapé que já abrem o cardápio filtrado
document.querySelectorAll('[data-filter]').forEach(link => {
    link.addEventListener('click', () => {
        searchInput.value = '';
        filter.query = '';
        setCategory(link.dataset.filter);
    });
});

function updateProductCard(id) {
    const slot = productsGrid.querySelector(`[data-buy="${id}"]`);
    if (!slot) return;
    const qty = getQty(id);
    slot.innerHTML = buyControlHTML(productById.get(id), qty);
    slot.closest('.product').classList.toggle('in-cart', qty > 0);
}

productsGrid.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const product = productById.get(Number(btn.dataset.id));
    if (!product) return;
    const { action } = btn.dataset;

    if (action === 'fav') {
        toggleFavorite(product, btn);
        return;
    }

    const before = getQty(product.id);
    changeQty(product, action === 'inc' ? 1 : -1);
    if (before === 0) showToast(`${product.name} adicionado ao carrinho`);

    // Mantém o foco no controle que substituiu o botão clicado
    const slot = productsGrid.querySelector(`[data-buy="${product.id}"]`);
    const next = slot.querySelector(`[data-action="${action}"]`) || slot.querySelector('button');
    next?.focus();
});

function toggleFavorite(product, btn) {
    const isFav = !favorites.has(product.id);
    if (isFav) favorites.add(product.id);
    else favorites.delete(product.id);
    storage.save(CONFIG.storageKeys.favorites, [...favorites]);
    btn.setAttribute('aria-pressed', String(isFav));
    bump(btn);
}

// ============================================
// CARRINHO
// ============================================
function changeQty(product, direction) {
    const delta = stepFor(product) * direction;
    const item = cart.find(i => i.id === product.id);

    if (item) {
        item.qty += delta;
        if (item.qty <= 0) cart = cart.filter(i => i.id !== product.id);
    } else if (delta > 0) {
        cart.push({ id: product.id, qty: delta });
    }
    commitCart([product.id]);
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    commitCart([id]);
}

function commitCart(changedIds = []) {
    storage.save(CONFIG.storageKeys.cart, cart);
    changedIds.forEach(updateProductCard);
    renderCart();
}

function cartItemHTML({ id, qty }) {
    const product = productById.get(id);
    const name = escapeHTML(product.name);
    return `
      <li>
        <img src="${imageSrc(product, true)}" alt="" width="56" height="56" loading="lazy" />
        <div class="cart-item-top">
          <h3>${name}</h3>
          <span class="cart-item-total">${formatPrice(lineTotal(product, qty))}</span>
        </div>
        <div class="cart-item-bottom">
          <span class="cart-item-unit">${formatPrice(product.price)}/${product.unit}</span>
          <div class="cart-item-controls">
            ${stepperHTML(product, qty, 'stepper-sm')}
            <button type="button" class="remove-btn" data-action="remove" data-id="${id}" aria-label="Remover ${name}">${icon('trash')}</button>
          </div>
        </div>
      </li>`;
}

let lastCount = null;

function renderCart() {
    const count = cartCount();
    const total = cartTotal();
    const hasItems = cart.length > 0;
    const itemsLabel = plural(count, 'item', 'itens');

    // Contadores (header + barra flutuante)
    document.querySelectorAll('[data-cart-count]').forEach(el => {
        el.textContent = count;
        el.hidden = count === 0;
        if (lastCount !== null && count !== lastCount) bump(el);
    });
    document.querySelectorAll('[data-cart-total]').forEach(el => {
        el.textContent = hasItems ? formatPrice(total) : (el.closest('.cart-bar') ? formatPrice(0) : 'Carrinho');
    });
    document.querySelectorAll('[data-cart-items]').forEach(el => { el.textContent = itemsLabel; });
    document.querySelectorAll('[data-open-cart]').forEach(btn => {
        btn.setAttribute('aria-label', hasItems ? `Ver pedido: ${itemsLabel}, total ${formatPrice(total)}` : 'Abrir carrinho');
    });
    lastCount = count;

    cartBar.hidden = !hasItems;
    document.body.classList.toggle('has-cart-bar', hasItems);

    // Drawer
    $('cartSummary').textContent = hasItems ? itemsLabel : 'Nenhum item';
    $('cartEmpty').hidden = hasItems || orderSent;
    $('cartSuccess').hidden = !orderSent || hasItems;
    $('cartContent').hidden = !hasItems;
    $('cartFoot').hidden = !hasItems;
    if (!hasItems) return;

    cartItemsEl.innerHTML = cart.map(cartItemHTML).join('');
    $('cartTotal').textContent = formatPrice(total);

    const met = meetsMinOrder();
    $('minOrder').hidden = !isDelivery();
    $('minOrder').classList.toggle('is-met', met);
    $('minOrderProgress').style.width = `${Math.min(100, (total / CONFIG.minOrder) * 100)}%`;
    $('minOrderText').textContent = met
        ? '✓ Pedido mínimo para entrega atingido'
        : `Faltam ${formatPrice(CONFIG.minOrder - total)} para o pedido mínimo de entrega (${formatPrice(CONFIG.minOrder)}). Retirando na loja não há mínimo.`;
    checkoutBtn.disabled = !met;
}

cartItemsEl.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const product = productById.get(id);
    if (!product) return;
    const { action } = btn.dataset;

    if (action === 'remove') removeFromCart(id);
    else changeQty(product, action === 'inc' ? 1 : -1);

    const same = cartItemsEl.querySelector(`[data-action="${action}"][data-id="${id}"]`);
    (same || $('closeCart')).focus();
});

// ============================================
// DRAWER
// ============================================
function openCart() {
    setMenuOpen(false);
    renderCart();
    if (typeof drawer.showModal === 'function') drawer.showModal();
    else drawer.setAttribute('open', '');
}

function closeCart() {
    if (typeof drawer.close === 'function') drawer.close();
    else drawer.removeAttribute('open');
}

document.querySelectorAll('[data-open-cart]').forEach(btn => btn.addEventListener('click', openCart));
$('closeCart').addEventListener('click', closeCart);
drawer.querySelectorAll('[data-close-cart]').forEach(el => el.addEventListener('click', closeCart));

// Clique no fundo escurecido fecha (o painel ocupa todo o <dialog>)
drawer.addEventListener('click', e => {
    if (e.target === drawer) closeCart();
});

drawer.addEventListener('close', () => {
    if (orderSent) {
        orderSent = false;
        renderCart();
    }
});

// ============================================
// DADOS DO CLIENTE + CHECKOUT (WhatsApp)
// ============================================
function loadCustomer() {
    const saved = storage.load(CONFIG.storageKeys.customer, {});
    if (saved.name) fields.name.value = saved.name;
    if (saved.address) fields.address.value = saved.address;
    if (saved.mode) fields.mode.value = saved.mode;
    if (saved.payment in PAYMENT_LABELS) fields.payment.value = saved.payment;
    syncDeliveryMode();
}

function saveCustomer() {
    storage.save(CONFIG.storageKeys.customer, {
        name: fields.name.value.trim(),
        mode: fields.mode.value,
        address: fields.address.value.trim(),
        payment: fields.payment.value
    });
}

function syncDeliveryMode() {
    const delivery = isDelivery();
    addressField.hidden = !delivery;
    fields.address.required = delivery;
    if (!delivery) setFieldError(fields.address, '');
}

function setFieldError(input, message) {
    const wrapper = input.closest('.field');
    let error = wrapper.querySelector('.field-error');
    if (!message) {
        input.removeAttribute('aria-invalid');
        error?.remove();
        return;
    }
    if (!error) {
        error = document.createElement('span');
        error.className = 'field-error';
        error.id = `${input.name}-error`;
        wrapper.append(error);
    }
    error.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', error.id);
}

function validateCheckout() {
    const problems = [];
    const name = fields.name.value.trim();
    const address = fields.address.value.trim();

    setFieldError(fields.name, name ? '' : 'Informe seu nome.');
    if (!name) problems.push(fields.name);

    if (isDelivery()) {
        setFieldError(fields.address, address ? '' : 'Informe o endereço de entrega.');
        if (!address) problems.push(fields.address);
    }

    const payment = fields.payment.value;
    setFieldError(firstPaymentInput, payment ? '' : 'Escolha a forma de pagamento.');
    if (!payment) problems.push(firstPaymentInput);

    return problems;
}

checkoutForm.addEventListener('change', e => {
    if (e.target.name === 'mode') {
        syncDeliveryMode();
        renderCart(); // o pedido mínimo depende do modo de recebimento
    }
    if (e.target.name === 'payment') setFieldError(firstPaymentInput, '');
    saveCustomer();
});

checkoutForm.addEventListener('input', e => {
    if (e.target.getAttribute('aria-invalid') && e.target.value.trim()) setFieldError(e.target, '');
    saveCustomer();
});

function buildOrderMessage() {
    const lines = cart.map(({ id, qty }) => {
        const p = productById.get(id);
        const label = isByWeight(p) ? `${p.name} (${formatQty(p, qty)})` : `${qty}x ${p.name}`;
        return `• ${label} — ${formatPrice(lineTotal(p, qty))}`;
    });

    const delivery = isDelivery();
    const notes = fields.notes.value.trim();

    return [
        '🍞 *Encomenda — Panificadora Pão de Mel*',
        '',
        ...lines,
        '',
        `💰 *Total: ${formatPrice(cartTotal())}*`,
        '',
        `👤 Nome: ${fields.name.value.trim()}`,
        `📦 Recebimento: ${delivery ? 'Entrega' : 'Retirar na loja'}`,
        delivery ? `📍 Endereço: ${fields.address.value.trim()}` : null,
        `💳 Pagamento: ${PAYMENT_LABELS[fields.payment.value]}`,
        notes ? `📝 Observações: ${notes}` : null,
        '',
        'Gostaria de finalizar esta encomenda!'
    ].filter(line => line !== null).join('\n');
}

checkoutForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!cart.length) return;

    if (!meetsMinOrder()) {
        showToast(`Pedido mínimo de ${formatPrice(CONFIG.minOrder)} para entrega`);
        return;
    }

    const problems = validateCheckout();
    if (problems.length) {
        problems[0].focus();
        return;
    }

    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(buildOrderMessage())}`;

    // Abre de forma síncrona (dentro do clique) para não ser bloqueado como pop-up
    const win = window.open(url, '_blank');
    if (win) win.opener = null;
    else window.location.href = url;

    const changed = cart.map(i => i.id);
    cart = [];
    fields.notes.value = '';
    orderSent = true;
    commitCart(changed);
    $('cartSuccess').querySelector('button').focus();
});

// ============================================
// TOAST
// ============================================
let toastTimer;

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ============================================
// ANIMAÇÕES DE ENTRADA
// ============================================
function initReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
        elements.forEach(el => el.classList.add('is-visible'));
        return;
    }
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });
    elements.forEach(el => observer.observe(el));
}

// ============================================
// INIT (script com defer — DOM já disponível)
// ============================================
$('year').textContent = new Date().getFullYear();
renderStoreStatus();
setInterval(renderStoreStatus, 60 * 1000);
renderChips();
renderProducts();
loadCustomer();
renderCart();
initReveal();
initActiveNav();
