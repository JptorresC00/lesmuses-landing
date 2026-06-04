/**
 * LES MUSES CR - Lógica Interactiva Premium
 * 
 * Funcionalidades:
 * 1. Control del Carrusel Destacados (Soporta navegación, dots y gestos táctiles).
 * 2. Catálogo con Filtrado por Categoría.
 * 3. Modal de Detalle de Producto.
 * 4. Carrito de Compras completo en LocalStorage con salida a WhatsApp.
 * 5. Navegación móvil y efectos al hacer scroll (Header fijo y animaciones fade-in).
 * 6. Formularios de Contacto y Boletín interactivos con feedback visual.
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // ESTADO GLOBAL DE LA APLICACIÓN
  // ==========================================================================
  let cart = JSON.parse(localStorage.getItem('lesmuses_cart')) || [];
  let currentActiveModalProduct = null;

  const INSTAGRAM_HANDLE = 'lesmuses.cr';

  // Elementos del DOM reutilizables
  const body = document.body;
  const header = document.querySelector('header');
  const cartTrigger = document.querySelector('.cart-trigger');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartClose = document.getElementById('cart-close');
  const cartItemsWrap = document.getElementById('cart-items-wrap');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartCount = document.querySelector('.cart-count');
  const checkoutBtn = document.getElementById('cart-checkout');
  const menuToggle = document.getElementById('menu-toggle');
  
  // ==========================================================================
  // EFECTOS DE SCROLL Y HEADER FIJO
  // ==========================================================================
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Ejecución inicial

  // ==========================================================================
  // MENÚ DE NAVEGACIÓN MÓVIL
  // ==========================================================================
  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      body.classList.toggle('mobile-menu-open');
    });

    // Cerrar menú al hacer clic en enlaces
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        body.classList.remove('mobile-menu-open');
      });
    });

    // Cerrar menú móvil al hacer clic fuera del menú
    document.addEventListener('click', (e) => {
      if (body.classList.contains('mobile-menu-open') && !header.contains(e.target)) {
        body.classList.remove('mobile-menu-open');
      }
    });
  }

  // ==========================================================================
  // SCROLL PRECISO EN NAV — Calcula offset real del header (compatible con zoom CSS)
  // ==========================================================================
  const smoothScrollTo = (targetId) => {
    const target = document.querySelector(targetId);
    if (!target) return;
    const headerH = header.getBoundingClientRect().height;
    // Saltar al primer hijo de contenido real (ignora esculturas/blobs decorativos)
    const contentEl = target.querySelector(':scope > :not(.sculpt):not(.blob)') || target;
    const rect = contentEl.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top - headerH - 16;
    window.scrollTo({ top: scrollTop, behavior: 'smooth' });
  };

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || !document.querySelector(href)) return;
      e.preventDefault();
      smoothScrollTo(href);
    });
  });

  // ==========================================================================
  // CARRUSEL DE DESTACADOS (SWIPE + NAVIGATION) - BUCLE INFINITO SEAMLESS
  // ==========================================================================
  const track = document.getElementById('track');
  const prevBtn = document.querySelector('.cprev');
  const nextBtn = document.querySelector('.cnext');
  const dotsContainer = document.getElementById('dots');

  if (track && prevBtn && nextBtn && dotsContainer) {
    const slides = Array.from(track.querySelectorAll('.c-slide'));
    const numClones = 3; // Clonamos 3 elementos para soportar pantallas anchas con loop suave
    let currentIndex = numClones; // Comenzamos en el primer elemento original (índice 3)
    let isTransitioning = false;

    // Clonación de elementos (inicio y final) para el efecto infinito
    const clonesEnd = slides.slice(0, numClones).map(el => {
      const clone = el.cloneNode(true);
      clone.classList.add('clone');
      return clone;
    });
    const clonesStart = slides.slice(-numClones).map(el => {
      const clone = el.cloneNode(true);
      clone.classList.add('clone');
      return clone;
    });

    // Agregar clones al contenedor
    clonesEnd.forEach(clone => track.appendChild(clone));
    const firstChild = track.firstElementChild;
    clonesStart.forEach(clone => track.insertBefore(clone, firstChild));

    const getStep = () => {
      const gap = parseFloat(getComputedStyle(track).gap) || 20;
      return slides[0].getBoundingClientRect().width + gap;
    };

    // Crear dots indicadores para los productos originales
    const createDots = () => {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < slides.length; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
          if (isTransitioning) return;
          goToSlide(i + numClones);
        });
        dotsContainer.appendChild(dot);
      }
    };

    const updateDots = () => {
      const dots = Array.from(dotsContainer.children);
      if (dots.length === 0) return;
      
      // Calcular cuál es el índice real correspondiente en el arreglo original
      const activeOriginalIndex = (currentIndex - numClones + slides.length) % slides.length;
      
      dots.forEach((dot, i) => {
        if (i === activeOriginalIndex) dot.classList.add('active');
        else dot.classList.remove('active');
      });
    };

    const goToSlide = (index, animate = true) => {
      currentIndex = index;
      const step = getStep();
      
      if (animate) {
        track.style.transition = 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)';
        isTransitioning = true;
      } else {
        track.style.transition = 'none';
      }
      
      track.style.transform = `translateX(-${currentIndex * step}px)`;
      updateDots();
    };

    // Salto invisible cuando termina la transición en los extremos del carrusel
    track.addEventListener('transitionend', () => {
      isTransitioning = false;
      
      if (currentIndex >= slides.length + numClones) {
        // Superamos los originales hacia adelante: saltamos al primer original
        goToSlide(currentIndex - slides.length, false);
      } else if (currentIndex < numClones) {
        // Retrocedimos de los originales hacia atrás: saltamos al último original
        goToSlide(currentIndex + slides.length, false);
      }
    });

    prevBtn.addEventListener('click', () => {
      if (isTransitioning) return;
      goToSlide(currentIndex - 1);
    });

    nextBtn.addEventListener('click', () => {
      if (isTransitioning) return;
      goToSlide(currentIndex + 1);
    });

    // Soporte táctil (Touch Events)
    let startX = 0;
    let endX = 0;
    let isDragging = false;

    track.addEventListener('touchstart', (e) => {
      if (isTransitioning) return;
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      endX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      const diffX = startX - endX;
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          goToSlide(currentIndex + 1);
        } else {
          goToSlide(currentIndex - 1);
        }
      }
    });

    const initCarousel = () => {
      createDots();
      goToSlide(currentIndex, false);
    };

    window.addEventListener('resize', () => {
      initCarousel();
    });

    initCarousel();
  }

  // ==========================================================================
  // FILTRADO DEL CATÁLOGO DE PRODUCTOS (GRID)
  // ==========================================================================
  const filterButtons = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('#grid .p-card');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remover clase activa de todos y añadir al actual
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');

      productCards.forEach((card, index) => {
        const cardCategory = card.getAttribute('data-category');
        
        if (filterVal === 'all' || cardCategory === filterVal) {
          card.classList.remove('hidden');
          // Pequeño retardo para re-animar con el IntersectionObserver
          setTimeout(() => {
            card.classList.add('visible');
          }, index * 40);
        } else {
          card.classList.add('hidden');
          card.classList.remove('visible');
        }
      });
    });
  });

  // ==========================================================================
  // MODAL DE DETALLE DE PRODUCTO
  // ==========================================================================
  const modal = document.getElementById('product-modal');
  const modalCloseBtn = document.getElementById('modal-close');
  const modalImg = document.getElementById('modal-img');
  const modalCategory = document.getElementById('modal-category');
  const modalTitle = document.getElementById('modal-title');
  const modalPrice = document.getElementById('modal-price');
  const modalDesc = document.getElementById('modal-desc');
  const addToCartBtn = document.getElementById('modal-add-to-cart');
  const sizeOptions = document.querySelectorAll('.size-option');

  let selectedSize = 'M'; // Tamaño seleccionado por defecto

  // Configuración de tamaños
  sizeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      sizeOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedSize = opt.getAttribute('data-size');
    });
  });

  // Abrir Modal con datos dinámicos desde atributos data-* de la tarjeta
  const openProductModal = (productData) => {
    currentActiveModalProduct = productData;

    modalImg.src = productData.img;
    modalImg.alt = productData.name;
    modalCategory.textContent = productData.categoryName || 'Colección';
    modalTitle.textContent = productData.name;
    modalPrice.textContent = `₡${parseInt(productData.price).toLocaleString('es-CR')}`;
    modalDesc.textContent = productData.desc || 'Una pieza de diseño exclusivo elaborada con telas premium para ofrecer la máxima comodidad y elegancia bajo el sol.';

    // Reiniciar selector de talla a 'M'
    sizeOptions.forEach(o => o.classList.remove('active'));
    const defaultSizeOpt = Array.from(sizeOptions).find(o => o.getAttribute('data-size') === 'M');
    if (defaultSizeOpt) defaultSizeOpt.classList.add('active');
    selectedSize = 'M';

    modal.showModal();
    // Prevenir el scroll del body
    body.style.overflow = 'hidden';
  };

  const closeProductModal = () => {
    modal.close();
    body.style.overflow = '';
    currentActiveModalProduct = null;
  };

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProductModal);
  }

  // Cerrar modal al hacer clic en el backdrop
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeProductModal();
      }
    });
  }

  // Delegación de eventos para clics en tarjetas de productos (cuadrícula y carrusel)
  // Esto es necesario para soportar las tarjetas clonadas dinámicamente en el carrusel
  const registerProductClickListeners = () => {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.p-card');
      if (!card) return;
      
      // Evitar abrir el modal si el clic fue en un botón interno (como añadir al carrito del drawer)
      if (e.target.closest('button')) return;
      
      const id = card.getAttribute('data-id');
      const name = card.getAttribute('data-name');
      const price = card.getAttribute('data-price');
      const img = card.querySelector('img').src;
      const category = card.getAttribute('data-category');
      const desc = card.getAttribute('data-desc');

      let categoryName = 'Colección';
      if (category === 'bikini') categoryName = 'Bikini';
      if (category === 'enterizo') categoryName = 'Enterizo / Monokini';
      if (category === 'accesorio') categoryName = 'Accesorio';
      if (category === 'vestido') categoryName = 'Vestido';

      openProductModal({ id, name, price, img, category, categoryName, desc });
    });
  };

  registerProductClickListeners();

  // ==========================================================================
  // CARRITO DE COMPRAS (MOCK SHOPPING CART DRAWER)
  // ==========================================================================
  
  // Abrir / Cerrar Drawer del Carrito
  const openCart = () => {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('visible');
    body.style.overflow = 'hidden';
  };

  const closeCart = () => {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('visible');
    // Solo restaurar scroll si el modal no está abierto
    if (!modal.open) {
      body.style.overflow = '';
    }
  };

  const cartClearBtn = document.getElementById('cart-clear');

  if (cartTrigger) cartTrigger.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
  if (cartClearBtn) cartClearBtn.addEventListener('click', () => clearCart());

  // Panel de confirmación de pedido — abre Instagram con mensaje listo
  const showOrderPanel = (messageText) => {
    const existing = document.getElementById('order-panel-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'order-panel-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(31,21,13,0.55);backdrop-filter:blur(6px);z-index:500;display:flex;align-items:center;justify-content:center;padding:1.5rem;animation:fadeIn 0.3s ease;';

    const igUrl = `https://ig.me/m/${INSTAGRAM_HANDLE}`;
    const lines = messageText.split('\n').map(l => `<div style="margin:0.15rem 0">${l || '&nbsp;'}</div>`).join('');

    overlay.innerHTML = `
      <div style="background:var(--bg-primary);max-width:480px;width:100%;border:0.5px solid var(--border-light);box-shadow:0 25px 60px rgba(42,31,20,0.2);display:flex;flex-direction:column;gap:0;">
        <div style="padding:1.8rem 2rem 1rem;border-bottom:0.5px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-size:0.68rem;letter-spacing:0.3em;text-transform:uppercase;color:var(--text-muted);display:block;margin-bottom:0.4rem;">Tu pedido</span>
            <span style="font-family:var(--font-serif);font-size:1.5rem;font-style:italic;">Listo para enviar</span>
          </div>
          <button id="order-panel-close" style="width:36px;height:36px;border:0.5px solid var(--border-dark);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-main);flex-shrink:0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style="padding:1.5rem 2rem;background:var(--bg-secondary);font-family:var(--font-sans);font-size:0.85rem;line-height:1.8;color:var(--text-main);max-height:200px;overflow-y:auto;white-space:pre-wrap;">${lines}</div>
        <div style="padding:1.5rem 2rem;display:flex;flex-direction:column;gap:0.8rem;">
          <a id="order-ig-link" href="${igUrl}" target="_blank" rel="noopener"
            style="display:flex;align-items:center;justify-content:center;gap:0.6rem;background:var(--text-main);color:var(--bg-primary);padding:1rem 2rem;font-size:0.75rem;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;transition:opacity 0.2s;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>
            Abrir DM de Instagram
          </a>
          <button id="order-copy-btn"
            style="display:flex;align-items:center;justify-content:center;gap:0.6rem;border:0.5px solid var(--border-dark);background:none;padding:0.9rem 2rem;font-size:0.75rem;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;color:var(--text-main);transition:all 0.2s;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copiar mensaje
          </button>
          <p style="text-align:center;font-size:0.72rem;color:var(--text-muted);margin-top:0.2rem;">Abre el DM → copia y pega el mensaje → envía</p>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    document.getElementById('order-panel-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('order-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(messageText).catch(() => {});
      const btn = document.getElementById('order-copy-btn');
      btn.textContent = '✓ Copiado';
      btn.style.borderColor = 'var(--accent)';
      btn.style.color = 'var(--accent)';
      setTimeout(() => {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar mensaje`;
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 2500);
    });

    // Auto-copiar al portapapeles al abrir el panel
    navigator.clipboard.writeText(messageText).catch(() => {});
  };

  // Renderizar contenido del carrito
  const renderCart = () => {
    if (cart.length === 0) {
      cartItemsWrap.innerHTML = `
        <div class="cart-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted)"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <p class="cart-empty-text">Tu musa interior espera...</p>
          <span style="font-size:0.75rem; color:var(--text-muted); letter-spacing:0.1em; text-transform:uppercase;">El carrito está vacío</span>
        </div>
      `;
      checkoutBtn.setAttribute('disabled', 'true');
      checkoutBtn.style.opacity = '0.5';
      checkoutBtn.style.pointerEvents = 'none';
      cartSubtotal.textContent = '₡0';
      cartCount.style.display = 'none';
      cartCount.textContent = '0';
      return;
    }

    checkoutBtn.removeAttribute('disabled');
    checkoutBtn.style.opacity = '1';
    checkoutBtn.style.pointerEvents = 'auto';

    cartItemsWrap.innerHTML = '';
    let subtotal = 0;
    let totalItems = 0;

    cart.forEach((item, index) => {
      subtotal += parseInt(item.price) * item.quantity;
      totalItems += item.quantity;

      const itemEl = document.createElement('div');
      itemEl.classList.add('cart-item');
      itemEl.innerHTML = `
        <div class="cart-item-img-wrap">
          <img src="${item.img}" alt="${item.name}" class="cart-item-img">
        </div>
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-meta">Talla: ${item.size}</span>
          <span class="cart-item-price">₡${(parseInt(item.price) * item.quantity).toLocaleString('es-CR')}</span>
        </div>
        <div class="cart-item-controls">
          <div class="quantity-selector">
            <button class="quantity-btn dec" data-index="${index}">-</button>
            <span class="quantity-val">${item.quantity}</span>
            <button class="quantity-btn inc" data-index="${index}">+</button>
          </div>
          <button class="cart-item-remove" data-index="${index}" title="Eliminar artículo">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      `;
      cartItemsWrap.appendChild(itemEl);
    });

    cartSubtotal.textContent = `₡${subtotal.toLocaleString('es-CR')}`;
    
    // Actualizar indicador de cantidad del Header
    cartCount.style.display = 'flex';
    cartCount.textContent = totalItems;

    // Agregar manejadores de eventos para los botones del carrito
    const decBtns = cartItemsWrap.querySelectorAll('.quantity-btn.dec');
    const incBtns = cartItemsWrap.querySelectorAll('.quantity-btn.inc');
    const removeBtns = cartItemsWrap.querySelectorAll('.cart-item-remove');

    decBtns.forEach(btn => btn.addEventListener('click', () => updateQuantity(btn.dataset.index, -1)));
    incBtns.forEach(btn => btn.addEventListener('click', () => updateQuantity(btn.dataset.index, 1)));
    removeBtns.forEach(btn => btn.addEventListener('click', () => removeItem(btn.dataset.index)));
  };

  // Guardar y Actualizar Carrito
  const saveCart = () => {
    localStorage.setItem('lesmuses_cart', JSON.stringify(cart));
    renderCart();
  };

  // Modificar cantidades de productos
  const updateQuantity = (index, delta) => {
    const idx = parseInt(index);
    cart[idx].quantity += delta;
    if (cart[idx].quantity <= 0) {
      cart.splice(idx, 1);
    }
    saveCart();
  };

  // Eliminar producto
  const removeItem = (index) => {
    cart.splice(parseInt(index), 1);
    saveCart();
  };

  // Vaciar carrito completo
  const clearCart = () => {
    cart = [];
    saveCart();
  };

  // Añadir producto desde el Modal
  addToCartBtn.addEventListener('click', () => {
    if (!currentActiveModalProduct) return;

    const { id, name, price, img } = currentActiveModalProduct;

    // Clave única por nombre + talla (id tiene duplicados en HTML)
    const existingIndex = cart.findIndex(item => item.name === name && item.size === selectedSize);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        id,
        name,
        price,
        img,
        size: selectedSize,
        quantity: 1
      });
    }

    saveCart();
    closeProductModal();

    // Toast de confirmación — sin abrir el carrito para seguir navegando
    const toast = document.createElement('div');
    toast.textContent = `✓ ${name} añadido al carrito`;
    toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);background:var(--bg-dark);color:var(--bg-primary);padding:0.8rem 1.6rem;font-size:0.78rem;letter-spacing:0.08em;z-index:999;opacity:0;transition:all 0.3s ease;white-space:nowrap;pointer-events:none;';
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  });

  // Finalizar Compra - Instagram
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;

    let subtotal = 0;
    let messageText = '¡Hola Les Muses CR! Me encantaría adquirir:\n\n';

    cart.forEach(item => {
      const itemTotal = parseInt(item.price) * item.quantity;
      subtotal += itemTotal;
      messageText += `• ${item.name} (Talla ${item.size}) x${item.quantity} — ₡${itemTotal.toLocaleString('es-CR')}\n`;
    });

    messageText += `\nTotal: ₡${subtotal.toLocaleString('es-CR')}\nEnvío a convenir en Costa Rica.`;

    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      // Móvil: share sheet nativo — el texto llega directo al chat de Instagram
      navigator.share({ text: messageText }).catch(() => showOrderPanel(messageText));
    } else {
      // PC y tablets: panel con mensaje listo + link directo (no window.open)
      showOrderPanel(messageText);
    }
  });

  // Carga inicial del carrito
  renderCart();

  // ==========================================================================
  // FORMULARIOS DE CONTACTO Y NEWSLETTER (FEEDBACK VISUAL)
  // ==========================================================================
  
  // Formulario de Contacto
  const contactForm = document.getElementById('contact-form');
  const contactStatus = document.getElementById('contact-status');

  if (contactForm && contactStatus) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      // Estado enviando...
      submitBtn.textContent = 'Enviando...';
      submitBtn.setAttribute('disabled', 'true');
      contactStatus.className = 'form-status';
      contactStatus.textContent = '';

      // Simular petición
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.removeAttribute('disabled');
        
        contactStatus.textContent = '¡Gracias por escribirnos! Te responderemos muy pronto.';
        contactStatus.classList.add('success');
        
        contactForm.reset();
        
        // Ocultar mensaje de éxito tras unos segundos
        setTimeout(() => {
          contactStatus.style.opacity = '0';
        }, 5000);
      }, 1200);
    });
  }

  // Formulario de Newsletter
  const newsletterForm = document.getElementById('newsletter-form');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const input = newsletterForm.querySelector('.newsletter-input');
      const submitBtn = newsletterForm.querySelector('.newsletter-submit');
      const originalText = submitBtn.textContent;
      
      if (!input.value.trim()) return;

      submitBtn.textContent = '...';
      submitBtn.setAttribute('disabled', 'true');

      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.removeAttribute('disabled');
        
        // Alerta elegante de suscripción
        alert(' ¡Te has suscrito con éxito a las novedades de Les Muses CR! Estarás al tanto de nuestras colecciones exclusivas.');
        
        newsletterForm.reset();
      }, 1000);
    });
  }

  // ==========================================================================
  // ANIMACIONES INTERSECTION OBSERVER (EFECTO SCROLL)
  // ==========================================================================
  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Agregar un pequeño retardo secuencial si entran varias a la vez
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 60);
        
        // Dejar de observar una vez animado
        animationObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -50px 0px' // Se activa un poco antes de que entre del todo
  });

  // Observar todas las tarjetas de productos
  const observeCards = () => {
    const cards = document.querySelectorAll('.p-card');
    cards.forEach(card => animationObserver.observe(card));
  };
  
  observeCards();

  // ==========================================================================
  // BARRA DE ANUNCIO — DISMISS
  // ==========================================================================
  const announceBar = document.getElementById('announce-bar');
  const announceClose = document.getElementById('announce-close');
  if (announceBar && announceClose) {
    announceClose.addEventListener('click', () => {
      announceBar.style.height = announceBar.offsetHeight + 'px';
      requestAnimationFrame(() => {
        announceBar.style.transition = 'height 0.3s ease, opacity 0.3s ease';
        announceBar.style.height = '0';
        announceBar.style.opacity = '0';
        announceBar.style.overflow = 'hidden';
        announceBar.style.padding = '0';
      });
      setTimeout(() => announceBar.remove(), 320);
    });
  }

  // ==========================================================================
  // FILTRO POR TALLA + CATEGORÍA (COMBINADO)
  // ==========================================================================
  let activeSize = 'all';
  let activeCategory = 'all';

  const applyFilters = () => {
    productCards.forEach((card, index) => {
      const cardCategory = card.getAttribute('data-category');
      const cardSizes = card.getAttribute('data-sizes') || 'all';
      const matchesCategory = activeCategory === 'all' || cardCategory === activeCategory;
      const matchesSize = activeSize === 'all' || cardSizes === 'all' || cardSizes.split(',').includes(activeSize);
      if (matchesCategory && matchesSize) {
        card.classList.remove('hidden');
        setTimeout(() => card.classList.add('visible'), index * 40);
      } else {
        card.classList.add('hidden');
        card.classList.remove('visible');
      }
    });
    updateSizeCounts();
  };

  // Contador dinámico por talla según categoría activa
  const updateSizeCounts = () => {
    document.querySelectorAll('.size-btn').forEach(btn => {
      const size = btn.getAttribute('data-size');
      const count = Array.from(productCards).filter(card => {
        const cat = card.getAttribute('data-category');
        const sizes = card.getAttribute('data-sizes') || 'all';
        const matchesCat = activeCategory === 'all' || cat === activeCategory;
        const matchesSize = size === 'all' || sizes === 'all' || sizes.split(',').includes(size);
        return matchesCat && matchesSize;
      }).length;
      const label = size === 'all' ? 'Todas' : size;
      btn.textContent = label;
      btn.disabled = count === 0;
      btn.classList.toggle('size-btn-empty', count === 0);
    });
  };

  // Reemplazar los listeners originales de categoría para usar applyFilters combinado
  filterButtons.forEach(btn => btn.replaceWith(btn.cloneNode(true)));

  document.querySelectorAll('.filter-btn:not(.size-btn)').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn:not(.size-btn)').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-filter');
      applyFilters();
    });
  });

  // Re-query size buttons DESPUÉS del replaceWith para obtener los nodos del DOM actuales
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSize = btn.getAttribute('data-size');
      applyFilters();
    });
  });

  // Inicializar contadores al cargar
  updateSizeCounts();

  // ==========================================================================
  // GUÍA DE TALLAS
  // ==========================================================================
  const sizeGuideModal = document.getElementById('size-guide-modal');
  const sizeGuideBtn = document.getElementById('size-guide-btn');
  const sgClose = document.getElementById('sg-close');

  if (sizeGuideBtn && sizeGuideModal) {
    sizeGuideBtn.addEventListener('click', () => sizeGuideModal.showModal());
    sgClose.addEventListener('click', () => sizeGuideModal.close());
    sizeGuideModal.addEventListener('click', (e) => {
      if (e.target === sizeGuideModal) sizeGuideModal.close();
    });
  }

  // ==========================================================================
  // POPUP NEWSLETTER CON INCENTIVO
  // ==========================================================================
  const nlOverlay = document.getElementById('nl-popup-overlay');
  const nlClose = document.getElementById('nl-popup-close');
  const nlSkip = document.getElementById('nl-popup-skip');
  const nlForm = document.getElementById('nl-popup-form');

  const hideNlPopup = () => {
    nlOverlay.classList.remove('visible');
    nlOverlay.setAttribute('aria-hidden', 'true');
  };

  if (nlOverlay && !localStorage.getItem('lesmuses_newsletter')) {
    setTimeout(() => {
      nlOverlay.classList.add('visible');
      nlOverlay.setAttribute('aria-hidden', 'false');
    }, 4500);

    nlClose.addEventListener('click', () => {
      hideNlPopup();
      localStorage.setItem('lesmuses_newsletter', 'dismissed');
    });
    nlSkip.addEventListener('click', () => {
      hideNlPopup();
      localStorage.setItem('lesmuses_newsletter', 'dismissed');
    });
    nlOverlay.addEventListener('click', (e) => {
      if (e.target === nlOverlay) {
        hideNlPopup();
        localStorage.setItem('lesmuses_newsletter', 'dismissed');
      }
    });
    if (nlForm) {
      nlForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = nlForm.querySelector('button[type="submit"]');
        btn.textContent = 'Codigo: MUSA10';
        btn.style.background = 'transparent';
        btn.style.color = 'var(--accent)';
        btn.style.border = '0.5px solid var(--accent)';
        btn.disabled = true;
        localStorage.setItem('lesmuses_newsletter', 'subscribed');
        setTimeout(hideNlPopup, 2800);
      });
    }
  }

});
