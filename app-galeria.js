/**
 * ═══════════════════════════════════════════════════════════════
 * EJERCICIO 1 — GALERÍA DE IMÁGENES
 * API: https://jsonplaceholder.typicode.com/photos
 *
 * CONCEPTOS APLICADOS:
 *  ✔ async / await       → suspende la función hasta tener la respuesta
 *  ✔ fetch               → API nativa para peticiones HTTP
 *  ✔ try / catch         → manejo de errores centralizado
 *  ✔ Separación de capas → fetchPhotos (datos) + renderGallery (vista)
 *  ✔ Manipulación DOM    → creación dinámica de elementos
 *  ✔ UX: loader, error, contador
 * ═══════════════════════════════════════════════════════════════
 */

/* ────────────────────────────────────────────────────────────
   CONFIGURACIÓN DEL MÓDULO
   Agrupamos las constantes en un objeto para no contaminar el
   scope global y facilitar futuros cambios.
──────────────────────────────────────────────────────────── */
const GALLERY_CONFIG = {
  API_URL: 'https://jsonplaceholder.typicode.com/photos',
  LIMIT: 20,           // cuántas fotos mostrar
  COLUMNS_FALLBACK_IMG: 'https://via.placeholder.com/150',
};

/* ────────────────────────────────────────────────────────────
   REFERENCIAS AL DOM
   Las declaramos al inicio para no buscarlas en cada función.
──────────────────────────────────────────────────────────── */
const galleryDOM = {
  grid:   document.getElementById('gallery-grid'),
  loader: document.getElementById('gallery-loader'),
  error:  document.getElementById('gallery-error'),
  errMsg: document.getElementById('gallery-error-msg'),
  count:  document.getElementById('gallery-count'),
  btn:    document.getElementById('btn-load-gallery'),
};

/* ────────────────────────────────────────────────────────────
   CAPA DE DATOS — fetchPhotos()
   ▸ ÚNICA responsabilidad: pedir datos a la API.
   ▸ Retorna un arreglo de objetos foto.
   ▸ NO sabe nada de HTML ni DOM.

   ¿Por qué async/await?
   fetch() devuelve una Promise. Con await pausamos la ejecución
   de esta función hasta obtener la respuesta, sin bloquear el
   hilo principal del navegador (el usuario puede seguir interactuando).
──────────────────────────────────────────────────────────── */
async function fetchPhotos(limit = GALLERY_CONFIG.LIMIT) {
  // _limit: parámetro que soporta JSONPlaceholder para paginar
  const url = `${GALLERY_CONFIG.API_URL}?_limit=${limit}`;

  // fetch retorna una Promise<Response>. await la "desenvuelve".
  const response = await fetch(url);

  // fetch NO lanza error para respuestas 4xx/5xx; debemos checar
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status} — ${response.statusText}`);
  }

  // .json() también retorna Promise → segundo await necesario
  const photos = await response.json();
  return photos;
}

/* ────────────────────────────────────────────────────────────
   CAPA DE VISTA — renderGallery(photos)
   ▸ Recibe datos puros y los convierte en HTML.
   ▸ Usa DocumentFragment para insertar todo de una sola vez
     → menos reflows, mejor rendimiento.
──────────────────────────────────────────────────────────── */
function renderGallery(photos) {
  galleryDOM.grid.innerHTML = ''; // limpiar contenido previo

  // DocumentFragment vive en memoria, sin coste de reflow por cada tarjeta
  const fragment = document.createDocumentFragment();

  photos.forEach((photo, index) => {
    const card = createImageCard(photo, index + 1);
    fragment.appendChild(card);
  });

  galleryDOM.grid.appendChild(fragment); // UN solo reflow

  // Actualizar contador en la UI
  galleryDOM.count.textContent = `${photos.length} imágenes cargadas`;
}

/* ────────────────────────────────────────────────────────────
   HELPER — createImageCard(photo, number)
   ▸ Crea y retorna un elemento DOM para cada foto.
   ▸ Separado de renderGallery para mantenibilidad.
──────────────────────────────────────────────────────────── */
function createImageCard(photo, number) {
  const card = document.createElement('div');
  card.className = 'img-card';

  // Usamos thumbnailUrl (150x150) para cargar rápido
  const img = document.createElement('img');
  img.src = photo.thumbnailUrl;
  img.alt = photo.title;
  img.loading = 'lazy'; // carga diferida nativa del navegador

  // Manejo de error si la imagen no carga
  img.onerror = () => { img.src = GALLERY_CONFIG.COLUMNS_FALLBACK_IMG; };

  // Leyenda flotante que aparece con CSS hover
  const caption = document.createElement('div');
  caption.className = 'img-caption';
  caption.innerHTML = `
    <span class="img-num">#${photo.id}</span>
    <p>${photo.title}</p>
  `;

  card.appendChild(img);
  card.appendChild(caption);
  return card;
}

/* ────────────────────────────────────────────────────────────
   HELPERS DE UI — show/hide/state
   ▸ Pequeñas funciones puras para evitar repetición de
     classList.add/remove repartido por todo el código.
──────────────────────────────────────────────────────────── */
function showLoader(el)  { el.classList.remove('hidden'); }
function hideLoader(el)  { el.classList.add('hidden'); }
function showError(msg)  {
  galleryDOM.errMsg.textContent = msg;
  galleryDOM.error.classList.remove('hidden');
}
function hideError()     { galleryDOM.error.classList.add('hidden'); }

/* ────────────────────────────────────────────────────────────
   ORQUESTADOR — galleryApp.load()
   ▸ Conecta capas de datos y vista.
   ▸ Gestiona todos los estados de UI: loading, success, error.

   FLUJO:
   1. Deshabilitar botón + mostrar loader
   2. Llamar a fetchPhotos() — puede fallar
   3. Si éxito → renderGallery()
   4. Si error → mostrar mensaje
   5. Siempre (finally) → ocultar loader
──────────────────────────────────────────────────────────── */
const galleryApp = {
  async load() {
    // Estado: cargando
    galleryDOM.btn.disabled = true;
    galleryDOM.btn.textContent = 'Cargando…';
    hideError();
    showLoader(galleryDOM.loader);

    try {
      // ▸ await pausa aquí hasta que fetchPhotos resuelva o rechace
      const photos = await fetchPhotos();
      renderGallery(photos);

    } catch (error) {
      /**
       * ¿Cuándo entra catch?
       *  - fetch lanza error de red (sin internet, CORS, etc.)
       *  - Nosotros lanzamos throw si !response.ok
       *  - Si JSON malformado
       * El catch captura CUALQUIERA de estos casos.
       */
      console.error('[GalleryApp] Error al cargar fotos:', error);
      showError(`No se pudieron cargar las imágenes. ${error.message}`);

    } finally {
      /**
       * finally siempre se ejecuta, haya error o no.
       * Ideal para limpiar estados de UI como ocultar el loader.
       */
      hideLoader(galleryDOM.loader);
      galleryDOM.btn.disabled = false;
      galleryDOM.btn.innerHTML = '<span class="btn-icon">↺</span> Recargar';
    }
  }
};

/* ────────────────────────────────────────────────────────────
   INICIALIZACIÓN — Event Listener
   Separamos la definición de funciones de la lógica de eventos.
──────────────────────────────────────────────────────────── */
galleryDOM.btn.addEventListener('click', () => galleryApp.load());
