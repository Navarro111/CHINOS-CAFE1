// js/facturacion.js
import { db, rtdb } from './firebase-config.js';
import { collection, addDoc, getDocs, Timestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, set }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Protección de ruta
if (!localStorage.getItem('loggedIn')) window.location.href = 'index.html';

// Contador de filas de productos
let filaCount = 0;

// ─── AGREGAR FILA DE PRODUCTO ────────────────────────────────────
window.agregarFila = function () {
  filaCount++;
  const container = document.getElementById('items-container');

  const fila = document.createElement('div');
  fila.className = 'detalle-producto';
  fila.id = `fila-${filaCount}`;
  fila.innerHTML = `
    <input type="text"   placeholder="Descripción del producto" id="desc-${filaCount}">
    <input type="number" placeholder="Cantidad" id="cant-${filaCount}"
           oninput="recalcular()" min="1" value="1">
    <input type="number" placeholder="Precio unit. $" id="prec-${filaCount}"
           oninput="recalcular()" step="0.01" value="0">
    <button style="background:#c62828; padding:8px 12px;"
      onclick="eliminarFila(${filaCount})">✕</button>
  `;
  container.appendChild(fila);
  recalcular();
};

// ─── ELIMINAR FILA ───────────────────────────────────────────────
window.eliminarFila = function (id) {
  document.getElementById(`fila-${id}`)?.remove();
  recalcular();
};

// ─── RECALCULAR TOTALES ──────────────────────────────────────────
window.recalcular = function () {
  let subtotal = 0;
  const filas = document.querySelectorAll('.detalle-producto');

  filas.forEach(fila => {
    const num  = fila.id.split('-')[1];
    const cant = parseFloat(document.getElementById(`cant-${num}`)?.value) || 0;
    const prec = parseFloat(document.getElementById(`prec-${num}`)?.value) || 0;
    subtotal += cant * prec;
  });

  const itbms = subtotal * 0.07;
  const total = subtotal + itbms;

  document.getElementById('subtotal').textContent    = `$${subtotal.toFixed(2)}`;
  document.getElementById('itbms').textContent       = `$${itbms.toFixed(2)}`;
  document.getElementById('total-final').textContent = `$${total.toFixed(2)}`;
};

// ─── GENERAR Y GUARDAR FACTURA ───────────────────────────────────
window.generarFactura = async function () {
  const cliente = document.getElementById('cliente').value.trim();
  const ruc     = document.getElementById('ruc').value.trim();
  const fecha   = document.getElementById('fecha').value;
  const msg     = document.getElementById('msg-fact');

  if (!cliente || !fecha) {
    msg.style.color = 'red';
    msg.textContent = '⚠️ Completa el nombre del cliente y la fecha.';
    return;
  }

  // Recolectar productos de las filas
  const filas = document.querySelectorAll('.detalle-producto');
  const productos = [];

  filas.forEach(fila => {
    const num  = fila.id.split('-')[1];
    const desc = document.getElementById(`desc-${num}`)?.value.trim();
    const cant = parseFloat(document.getElementById(`cant-${num}`)?.value) || 0;
    const prec = parseFloat(document.getElementById(`prec-${num}`)?.value) || 0;
    if (desc && cant > 0 && prec > 0) {
      productos.push({ descripcion: desc, cantidad: cant, precio: prec, subtotal: cant * prec });
    }
  });

  if (productos.length === 0) {
    msg.style.color = 'red';
    msg.textContent = '⚠️ Agrega al menos un producto válido.';
    return;
  }

  const subtotal = productos.reduce((acc, p) => acc + p.subtotal, 0);
  const itbms    = subtotal * 0.07;
  const total    = subtotal + itbms;

  const factura = {
    cliente, ruc, fecha,
    productos,
    subtotal: parseFloat(subtotal.toFixed(2)),
    itbms:    parseFloat(itbms.toFixed(2)),
    total:    parseFloat(total.toFixed(2)),
    creadoEn: Timestamp.now()
  };

  try {
    // Guardar en Firestore (BD principal)
    const docRef = await addDoc(collection(db, 'facturas'), factura);

    // Replicar en Realtime Database (BD secundaria)
    await set(ref(rtdb, 'facturas/' + docRef.id), {
      ...factura,
      creadoEn: new Date().toISOString()
    });

    msg.style.color = 'green';
    msg.textContent = `✅ Factura #${docRef.id.substring(0,6).toUpperCase()} guardada.`;

    mostrarPreview(factura, docRef.id);
    cargarFacturas();

  } catch (error) {
    msg.style.color = 'red';
    msg.textContent = '❌ Error: ' + error.message;
  }
};

// ─── MOSTRAR VISTA PREVIA ────────────────────────────────────────
function mostrarPreview(f, id) {
  const preview = document.getElementById('factura-preview');
  const contenido = document.getElementById('contenido-factura');

  const filas = f.productos.map(p => `
    <tr>
      <td>${p.descripcion}</td>
      <td style="text-align:center">${p.cantidad}</td>
      <td style="text-align:right">$${p.precio.toFixed(2)}</td>
      <td style="text-align:right">$${p.subtotal.toFixed(2)}</td>
    </tr>`).join('');

  contenido.innerHTML = `
    <p><strong>N° Factura:</strong> ${id.substring(0,6).toUpperCase()}</p>
    <p><strong>Cliente:</strong> ${f.cliente}</p>
    <p><strong>RUC/Cédula:</strong> ${f.ruc || '-'}</p>
    <p><strong>Fecha:</strong> ${f.fecha}</p>
    <hr style="margin:15px 0;">
    <table>
      <thead>
        <tr>
          <th>Descripción</th><th>Cant.</th>
          <th>Precio</th><th>Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    <hr style="margin:15px 0;">
    <p style="text-align:right">Subtotal: $${f.subtotal.toFixed(2)}</p>
    <p style="text-align:right">ITBMS 7%: $${f.itbms.toFixed(2)}</p>
    <p style="text-align:right; font-size:18px;">
      <strong>TOTAL: $${f.total.toFixed(2)}</strong>
    </p>
  `;

  preview.style.display = 'block';
  preview.scrollIntoView({ behavior: 'smooth' });
}

// ─── CARGAR HISTORIAL ────────────────────────────────────────────
async function cargarFacturas() {
  const snap  = await getDocs(collection(db, 'facturas'));
  const tbody = document.getElementById('tabla-facturas');
  tbody.innerHTML = '';

  if (snap.empty) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:#999;">No hay facturas aún.</td></tr>';
    return;
  }

  snap.forEach(d => {
    const f    = d.data();
    const num  = d.id.substring(0,6).toUpperCase();
    const fecha = f.creadoEn?.toDate
      ? f.creadoEn.toDate().toLocaleDateString()
      : f.fecha;

    tbody.innerHTML += `
      <tr>
        <td>#${num}</td>
        <td>${f.cliente}</td>
        <td>${f.ruc || '-'}</td>
        <td><strong>$${f.total?.toFixed(2)}</strong></td>
        <td>${fecha}</td>
      </tr>`;
  });
}

// Agregar primera fila automáticamente y poner fecha de hoy
window.addEventListener('DOMContentLoaded', () => {
  agregarFila();
  document.getElementById('fecha').valueAsDate = new Date();
});

cargarFacturas();
