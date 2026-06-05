import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  collection, getDocs, addDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const CLOUDINARY_CLOUD  = 'dvtveuixl';
const CLOUDINARY_PRESET = 'lesmuses_productos';

const loginSection    = document.getElementById('login-section');
const dashSection     = document.getElementById('dashboard-section');
const loginForm       = document.getElementById('login-form');
const loginError      = document.getElementById('login-error');
const logoutBtn       = document.getElementById('logout-btn');
const productsList    = document.getElementById('products-list');
const productCount    = document.getElementById('product-count');
const addForm         = document.getElementById('add-product-form');
const addBtn          = document.getElementById('add-btn');
const addStatus       = document.getElementById('add-status');
const imagenInput     = document.getElementById('prod-imagen');
const imagenPreview   = document.getElementById('imagen-preview');
const allSizesCb      = document.getElementById('all-sizes');

// ── Auth state ──────────────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display  = 'none';
    dashSection.style.display   = 'block';
    loadProducts();
  } else {
    loginSection.style.display  = 'flex';
    dashSection.style.display   = 'none';
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const btn = loginForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById('login-email').value,
      document.getElementById('login-password').value
    );
  } catch {
    loginError.textContent = 'Correo o contraseña incorrectos';
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

// ── Cloudinary upload ────────────────────────────────────────────────────────
async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST', body: fd
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'No se pudo subir la imagen');
  return data.secure_url;
}

// ── Load products ────────────────────────────────────────────────────────────
async function loadProducts() {
  productsList.innerHTML = '<p class="msg">Cargando...</p>';
  try {
    const snap = await getDocs(query(collection(db, 'productos'), orderBy('createdAt', 'desc')));
    const prods = [];
    snap.forEach(d => prods.push({ id: d.id, ...d.data() }));

    productCount.textContent = `(${prods.length})`;

    if (prods.length === 0) {
      productsList.innerHTML = '<p class="msg">Sin productos aún. Agrega el primero.</p>';
      return;
    }

    productsList.innerHTML = prods.map(p => `
      <div class="prod-item">
        <img src="${p.imagen}" alt="${p.nombre}">
        <div class="prod-info">
          <strong>${p.nombre}</strong>
          <span class="prod-meta">₡${Number(p.precio).toLocaleString('en-US')} &nbsp;·&nbsp; ${p.categoria}</span>
          <div class="prod-tags">
            <span class="tag tag-tallas">${p.tallas === 'all' ? 'Todas las tallas' : p.tallas}</span>
            ${p.destacado ? '<span class="tag tag-dest">Favorita</span>' : ''}
          </div>
        </div>
        <button class="btn-delete" data-id="${p.id}">Eliminar</button>
      </div>
    `).join('');

    productsList.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id, btn))
    );
  } catch (err) {
    productsList.innerHTML = '<p class="msg error">Error al cargar productos.</p>';
    console.error(err);
  }
}

// ── Delete product ───────────────────────────────────────────────────────────
async function deleteProduct(id, btn) {
  if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
  btn.disabled = true;
  btn.textContent = '...';
  try {
    await deleteDoc(doc(db, 'productos', id));
    loadProducts();
  } catch {
    alert('Error al eliminar el producto');
    btn.disabled = false;
    btn.textContent = 'Eliminar';
  }
}

// ── Image preview ────────────────────────────────────────────────────────────
imagenInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    imagenPreview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="preview">`;
  }
});

// ── "Todas las tallas" toggle ────────────────────────────────────────────────
allSizesCb.addEventListener('change', () => {
  document.querySelectorAll('.size-checks input[type="checkbox"]:not(#all-sizes)')
    .forEach(cb => { cb.checked = false; cb.disabled = allSizesCb.checked; });
});

// ── Add product ──────────────────────────────────────────────────────────────
addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addBtn.disabled = true;
  setStatus('Subiendo imagen...', '');

  try {
    // Tallas
    let tallas;
    if (allSizesCb.checked) {
      tallas = 'all';
    } else {
      const checked = [...document.querySelectorAll('.size-checks input[type="checkbox"]:not(#all-sizes):checked')]
        .map(cb => cb.value);
      if (checked.length === 0) {
        setStatus('Selecciona al menos una talla', 'error');
        addBtn.disabled = false;
        return;
      }
      tallas = checked.join(',');
    }

    // Subir imagen
    const file = imagenInput.files[0];
    if (!file) { setStatus('Selecciona una imagen', 'error'); addBtn.disabled = false; return; }
    const imageUrl = await uploadImage(file);

    setStatus('Guardando producto...', '');

    await addDoc(collection(db, 'productos'), {
      nombre:      document.getElementById('prod-nombre').value.trim(),
      precio:      Number(document.getElementById('prod-precio').value),
      categoria:   document.getElementById('prod-categoria').value,
      tallas,
      descripcion: document.getElementById('prod-descripcion').value.trim(),
      imagen:      imageUrl,
      destacado:   document.getElementById('prod-destacado').checked,
      activo:      true,
      createdAt:   serverTimestamp()
    });

    setStatus('✓ Producto agregado correctamente', 'success');
    addForm.reset();
    imagenPreview.innerHTML = '';
    allSizesCb.checked = false;
    document.querySelectorAll('.size-checks input[type="checkbox"]:not(#all-sizes)')
      .forEach(cb => { cb.disabled = false; });
    loadProducts();
    setTimeout(() => setStatus('', ''), 3500);

  } catch (err) {
    setStatus('Error: ' + err.message, 'error');
    console.error(err);
  } finally {
    addBtn.disabled = false;
  }
});

function setStatus(msg, type) {
  addStatus.textContent = msg;
  addStatus.className = 'status-msg' + (type ? ' ' + type : '');
}