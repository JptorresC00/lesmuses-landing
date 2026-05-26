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

  // Teléfono de WhatsApp de la tienda (Costa Rica: +506)
  const WHATSAPP_NUMBER = '50688888888'; 

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
    modalDesc.textContent = productData.desc || 'Una pieza artesanal de alta calidad, confeccionada con telas premium para ofrecer la máxima comodidad y elegancia bajo el sol.';

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

  if (cartTrigger) cartTrigger.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

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

  // Añadir producto desde el Modal
  addToCartBtn.addEventListener('click', () => {
    if (!currentActiveModalProduct) return;

    const { id, name, price, img } = currentActiveModalProduct;

    // Comprobar si ya existe un artículo idéntico con la misma talla
    const existingIndex = cart.findIndex(item => item.id === id && item.size === selectedSize);

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
    
    // Retardo sutil y abrir el carrito para mostrar el artículo añadido
    setTimeout(() => {
      openCart();
    }, 300);
  });

  // Finalizar Compra - Enlace de WhatsApp con mensaje detallado
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;

    let subtotal = 0;
    let messageText = '¡Hola Les Muses CR! 🌊🌸 Me encantaría adquirir las siguientes piezas:\n\n';

    cart.forEach(item => {
      const itemTotal = parseInt(item.price) * item.quantity;
      subtotal += itemTotal;
      messageText += `• *${item.name}* (Talla ${item.size}) x${item.quantity} - ₡${itemTotal.toLocaleString('es-CR')}\n`;
    });

    messageText += `\n💵 *Total estimado:* ₡${subtotal.toLocaleString('es-CR')}\n`;
    messageText += `📍 Envío a convenir en Costa Rica.`;

    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    // Abrir enlace en pestaña nueva
    window.open(whatsappUrl, '_blank');
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
        alert('✨ ¡Te has suscrito con éxito a las novedades de Les Muses CR! Estarás al tanto de nuestras colecciones exclusivas.');
        
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
});
