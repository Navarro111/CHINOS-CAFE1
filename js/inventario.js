import { db, rtdb } from './firebase-config.js';
import { collection, addDoc, getDocs }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, set }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

if (!localStorage.getItem('loggedIn')) window.location.href = 'index.html';

window.agregarProducto = async function () {
  const nombre    = document.getElementById('nombre').value;
  const categoria = document.getElementById('categoria').value;
  const stock     = parseInt(document.getElementById('stock').value);
  const precio    = parseFloat(document.getElementById('precio').value);
  const producto  = { nombre, categoria, stock, precio };

  const docRef = await addDoc(collection(db, 'productos'), producto);
  await set(ref(rtdb, 'productos/' + docRef.id), producto);

  document.getElementById('msg-inv').textContent = '✅ Producto agregado';
  cargarProductos();
};

async function cargarProductos() {
  const snap = await getDocs(collection(db, 'productos'));
  const tbody = document.getElementById('tabla-inv');
  tbody.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    tbody.innerHTML += `<tr><td>${d.nombre}</td><td>${d.categoria}</td><td>${d.stock}</td><td>$${d.precio}</td></tr>`;
  });
}
cargarProductos();
