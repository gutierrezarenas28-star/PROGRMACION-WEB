import {
  login,
  getProductos,
  crearProducto,
  eliminarProducto,
} from "./services/tienda.service.js";

const sesionInfo = document.querySelector("#sesion-info");
const btnSalir = document.querySelector("#btn-salir");
const panelLogin = document.querySelector("#panel-login");
const formLogin = document.querySelector("#form-login");
const loginMensaje = document.querySelector("#login-mensaje");
const listaProductos = document.querySelector("#lista-productos");
const btnRecargar = document.querySelector("#btn-recargar");
const panelCrear = document.querySelector("#panel-crear");
const formProducto = document.querySelector("#form-producto");
const productoMensaje = document.querySelector("#producto-mensaje");

let token = localStorage.getItem("token") ?? "";
let rol = localStorage.getItem("rol") ?? "";

function decodificarToken(valor) {
  try {
    const base64 = valor.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(base64 + relleno));
  } catch {
    return null;
  }
}

function limpiarSesion() {
  token = "";
  rol = "";
  localStorage.removeItem("token");
  localStorage.removeItem("rol");
}

function actualizarVistaSesion() {
  const payload = token ? decodificarToken(token) : null;
  const vencido = !payload || payload.exp * 1000 <= Date.now();

  if (token && vencido) {
    limpiarSesion();
  } else if (payload?.rol) {
    rol = payload.rol;
    localStorage.setItem("rol", rol);
  }

  const autenticado = Boolean(token);
  panelLogin.classList.toggle("oculto", autenticado);
  panelCrear.classList.toggle("oculto", !autenticado);
  btnSalir.classList.toggle("oculto", !autenticado);
  sesionInfo.textContent = autenticado ? `Sesión: ${rol}` : "Sin sesión";
}

function mostrarMensaje(elemento, texto, tipo = "") {
  elemento.textContent = texto;
  elemento.className = `mensaje ${tipo}`.trim();
}

function crearElementoProducto(producto) {
  const item = document.createElement("li");
  item.className = "producto";

  const info = document.createElement("div");
  info.className = "producto-info";

  const nombre = document.createElement("strong");
  nombre.textContent = producto.nombre;

  const detalles = document.createElement("span");
  const precio = Number(producto.precio).toLocaleString("es-CO");
  detalles.textContent = `$${precio} · Stock: ${producto.stock}`;

  info.append(nombre, detalles);
  item.append(info);

  if (rol === "admin") {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton peligro";
    boton.textContent = "Eliminar";
    boton.dataset.id = producto.id;
    item.append(boton);
  }

  return item;
}

function renderizarProductos(productos) {
  listaProductos.replaceChildren();

  if (!productos.length) {
    const vacio = document.createElement("li");
    vacio.className = "vacio";
    vacio.textContent = "No hay productos todavía.";
    listaProductos.append(vacio);
    return;
  }

  for (const producto of productos) {
    listaProductos.append(crearElementoProducto(producto));
  }
}

async function cargarProductos() {
  try {
    renderizarProductos(await getProductos());
  } catch (error) {
    listaProductos.replaceChildren();
    const item = document.createElement("li");
    item.className = "vacio";
    item.textContent = `No se pudieron cargar los productos: ${error.message}`;
    listaProductos.append(item);
  }
}

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault();
  mostrarMensaje(loginMensaje, "Entrando...");

  try {
    const email = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;
    const datos = await login(email, password);
    const payload = decodificarToken(datos.token);

    token = datos.token;
    rol = payload?.rol ?? "usuario";
    localStorage.setItem("token", token);
    localStorage.setItem("rol", rol);

    formLogin.reset();
    mostrarMensaje(loginMensaje, "");
    actualizarVistaSesion();
    await cargarProductos();
  } catch (error) {
    mostrarMensaje(loginMensaje, error.message, "error");
  }
});

formProducto.addEventListener("submit", async (event) => {
  event.preventDefault();
  mostrarMensaje(productoMensaje, "Guardando...");

  const producto = {
    nombre: document.querySelector("#producto-nombre").value.trim(),
    precio: Number(document.querySelector("#producto-precio").value),
    stock: Number(document.querySelector("#producto-stock").value),
  };

  try {
    await crearProducto(producto, token);
    formProducto.reset();
    document.querySelector("#producto-stock").value = "0";
    mostrarMensaje(productoMensaje, "Producto creado correctamente.", "ok");
    await cargarProductos();
  } catch (error) {
    mostrarMensaje(productoMensaje, error.message, "error");

    if (error.status === 401) {
      limpiarSesion();
      actualizarVistaSesion();
    }
  }
});

listaProductos.addEventListener("click", async (event) => {
  const boton = event.target.closest("button[data-id]");

  if (!boton) {
    return;
  }

  if (!window.confirm("¿Seguro que quieres eliminar este producto?")) {
    return;
  }

  try {
    await eliminarProducto(boton.dataset.id, token);
    await cargarProductos();
  } catch (error) {
    window.alert(error.message);

    if (error.status === 401) {
      limpiarSesion();
      actualizarVistaSesion();
    }
  }
});

btnSalir.addEventListener("click", () => {
  limpiarSesion();
  actualizarVistaSesion();
  mostrarMensaje(loginMensaje, "Sesión cerrada.");
  cargarProductos();
});

btnRecargar.addEventListener("click", cargarProductos);

actualizarVistaSesion();
cargarProductos();
