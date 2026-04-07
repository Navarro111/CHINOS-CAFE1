// js/ventas.js
import { db, rtdb } from './firebase-config.js';
import { collection, addDoc, getDocs, Timestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, set }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

if (!localStorage.getItem('loggedIn')) window.location.href = 'index.html';

window.registrarVenta = async function () {
  const producto = document.getElementById('producto').value;
  const cantidad = parseInt(document.getElementById('cantidad').value);
  const precio   = parseFloat(document.getElementById('precio').value);
  const cliente  = document.getElementById('cliente').value;
  const total    = cantidad * precio;
  const fecha    = Timestamp.now();

  const venta = { producto, cantidad, precio, total, cliente, fecha };

  // Guardar en Firestore (BD principal)
  const docRef = await addDoc(collection(db, 'ventas'), venta);

  // Replicar en Realtime Database (BD secundaria)
  await set(ref(rtdb, 'ventas/' + docRef.id), {
    ...venta, fecha: fecha.toDate().toISOString()
  });

  document.getElementById('msg-venta').textContent = '✅ Venta registrada correctamente';
  cargarVentas();
};

async function cargarVentas() {
  const snap = await getDocs(collection(db, 'ventas'));
  const tbody = document.getElementById('tabla-ventas');
  tbody.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    const fecha = d.fecha?.toDate ? d.fecha.toDate().toLocaleDateString() : '-';
    tbody.innerHTML += `<tr>
      <td>${d.producto}</td><td>${d.cantidad}</td>
      <td>$${d.total?.toFixed(2)}</td><td>${d.cliente}</td><td>${fecha}</td>
    </tr>`;
  });
}

cargarVentas();
