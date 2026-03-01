/**
 * ═══════════════════════════════════════════════════════════════
 * app.js — CONTROLADOR PRINCIPAL
 * Gestiona la navegación entre tabs y la inicialización.
 *
 * PATRÓN: Module Pattern con IIFE (Immediately Invoked Function Expression)
 * ¿Por qué? Evita contaminar el scope global con variables internas
 * del controlador de tabs.
 * ═══════════════════════════════════════════════════════════════
 */

(function initApp() {
  /* ────────────────────────────────────────────────────────
     SISTEMA DE TABS
     Cada botón de la nav tiene data-tab="nombre" que coincide
     con el id="tab-nombre" del panel correspondiente.
  ──────────────────────────────────────────────────────── */
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  /**
   * activateTab(tabName)
   * ▸ Desactiva todos los tabs/paneles.
   * ▸ Activa solo el indicado.
   * ▸ Actualiza la URL con hash para bookmarking.
   */
  function activateTab(tabName) {
    // Desactivar todos
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));

    // Activar el seleccionado
    const activeBtn   = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const activePanel = document.getElementById(`tab-${tabName}`);

    if (activeBtn)   activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.add('active');

    // Actualizar hash en URL (sin recargar)
    history.replaceState(null, '', `#${tabName}`);
  }

  // Agregar listener a cada botón
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activateTab(btn.dataset.tab);
    });
  });

  /* ────────────────────────────────────────────────────────
     RESTAURAR TAB DESDE URL HASH
     Si el usuario copió la URL con #pokedex, abrirá ese tab.
  ──────────────────────────────────────────────────────── */
  const hashTab = window.location.hash.replace('#', '');
  const validTabs = ['galeria', 'clima', 'pokedex'];

  if (validTabs.includes(hashTab)) {
    activateTab(hashTab);
  } else {
    activateTab('galeria'); // tab por defecto
  }

  /* ────────────────────────────────────────────────────────
     ATAJOS DE TECLADO (bonus UX)
     1 → Galería | 2 → Clima | 3 → Pokédex
  ──────────────────────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    // Solo si no hay foco en un input
    if (document.activeElement.tagName === 'INPUT') return;

    const map = { '1': 'galeria', '2': 'clima', '3': 'pokedex' };
    if (map[e.key]) activateTab(map[e.key]);
  });

  console.info(
    '%c⚡ Taller de APIs listo',
    'color:#e8ff47; font-family:monospace; font-size:14px; font-weight:bold;'
  );
  console.info('%cTips:', 'color:#47c8ff; font-weight:bold;');
  console.info('  • Usa teclas 1, 2, 3 para cambiar de tab');
  console.info('  • Para el clima, prueba: Bogotá, Medellín, Madrid, París, Tokyo');
  console.info('  • Para la Pokédex, prueba: pikachu, charizard, 1, 25, bulbasaur');
})();
