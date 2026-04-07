// js/proveedores.js
import { db, rtdb } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, set, remove }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Protección de ruta
if (!localStorage.getItem('loggedIn')) window.location.href = 'index.html';

// Variable global para guardar todos los proveedores
let todosLosProveedores = [];

// ─── AGREGAR PROVEEDOR ───────────────────────────────────────────
window.agregarProveedor = async function () {
  const nombre    = document.getElementById('nombre').value.trim();
  const telefono  = document.getElementById('telefono').value.trim();
  const email     = document.getElementById('email').value.trim();
  const producto  = document.getElementById('producto').value.trim();
  const direccion = document.getElementById('direccion').value.trim();
  const msg       = document.getElementById('msg-prov');

  // Validación básica
  if (!nombre || !telefono || !email || !producto) {
    msg.style.color = 'red';
    msg.textContent = '⚠️ Por favor completa todos los campos obligatorios.';
    return;
  }

  const proveedor = { nombre, telefono, email, producto, direccion };

  try {
    // Guardar en Firestore (Base de datos principal)
    const docRef = await addDoc(collection(db, 'proveedores'), proveedor);

    // Replicar en Realtime Database (Base de datos secundaria)
    await set(ref(rtdb, 'proveedores/' + docRef.id), proveedor);

    msg.style.color = 'green';
    msg.textContent = '✅ Proveedor guardado correctamente.';

    // Limpiar formulario
    ['nombre','telefono','email','producto','direccion'].forEach(id => {
      document.getElementById(id).value = '';
    });

    cargarProveedores();

  } catch (error) {
    msg.style.color = 'red';
    msg.textContent = '❌ Error al guardar: ' + error.message;
  }
};

// ─── CARGAR PROVEEDORES ──────────────────────────────────────────
async function cargarProveedores() {
  const snap = await getDocs(collection(db, 'proveedores'));
  todosLosProveedores = [];

  snap.forEach(d => {
    todosLosProveedores.push({ id: d.id, ...d.data() });
  });

  renderizarTabla(todosLosProveedores);
}

// ─── RENDERIZAR TABLA ────────────────────────────────────────────
function renderizarTabla(lista) {
  const tbody = document.getElementById('tabla-proveedores');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:#999;">No hay proveedores registrados.</td></tr>';
    return;
  }

  lista.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.nombre}</td>
        <td>${p.telefono}</td>
        <td>${p.email}</td>
        <td>${p.producto}</td>
        <td>${p.direccion || '-'}</td>
        <td>
          <button style="background:#c62828; padding:6px 12px;"
            onclick="eliminarProveedor('${p.id}')">Eliminar</button>
        </td>
      </tr>`;
  });
}

// ─── FILTRAR / BUSCAR ────────────────────────────────────────────
window.filtrarProveedores = function () {
  const texto = document.getElementById('buscador').value.toLowerCase();
  const filtrados = todosLosProveedores.filter(p =>
    p.nombre.toLowerCase().includes(texto) ||
    p.producto.toLowerCase().includes(texto)
  );
  renderizarTabla(filtrados);
};

// ─── ELIMINAR PROVEEDOR ──────────────────────────────────────────
window.eliminarProveedor = async function (id) {
  if (!confirm('¿Seguro que deseas eliminar este proveedor?')) return;

  // Eliminar de Firestore
  await deleteDoc(doc(db, 'proveedores', id));

  // Eliminar de Realtime Database
  await remove(ref(rtdb, 'proveedores/' + id));

  cargarProveedores();
};

// Cargar al iniciar
cargarProveedores();
