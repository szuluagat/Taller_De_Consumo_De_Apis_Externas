/**
 * ═══════════════════════════════════════════════════════════════
 * EJERCICIO 3 — POKÉDEX
 * API: https://pokeapi.co/api/v2/pokemon/{nombre}
 *
 * CONCEPTOS APLICADOS:
 *  ✔ async / await         → múltiples awaits en secuencia
 *  ✔ fetch con URL dinámica → interpolación de strings
 *  ✔ try / catch / finally  → manejo de Pokémon no existentes
 *  ✔ Separación de capas    → fetchPokemon + renderPokemonCard
 *  ✔ Validación de input    → nombre o número válido
 *  ✔ Loader animado
 *  ✔ Barras de stats animadas con CSS
 *  ✔ Colores por tipo de Pokémon
 * ═══════════════════════════════════════════════════════════════
 */

/* ────────────────────────────────────────────────────────────
   CONFIGURACIÓN
──────────────────────────────────────────────────────────── */
const POKEDEX_CONFIG = {
  BASE_URL: 'https://pokeapi.co/api/v2/pokemon',
};

/* ────────────────────────────────────────────────────────────
   MAPA DE COLORES POR TIPO
   Los tipos de Pokémon tienen clases CSS definidas en style.css
──────────────────────────────────────────────────────────── */
const TYPE_CLASSES = {
  fire: 'type-fire',  water: 'type-water',    grass: 'type-grass',
  electric: 'type-electric', psychic: 'type-psychic', ice: 'type-ice',
  dragon: 'type-dragon', dark: 'type-dark',     fairy: 'type-fairy',
  fighting: 'type-fighting', poison: 'type-poison',  ground: 'type-ground',
  rock: 'type-rock',  bug: 'type-bug',         ghost: 'type-ghost',
  steel: 'type-steel', flying: 'type-flying',   normal: 'type-normal',
};

/* ────────────────────────────────────────────────────────────
   NOMBRES DE ESTADÍSTICAS (traducción al español)
──────────────────────────────────────────────────────────── */
const STAT_NAMES = {
  'hp':              'HP',
  'attack':          'Ataque',
  'defense':         'Defensa',
  'special-attack':  'Atq. Esp.',
  'special-defense': 'Def. Esp.',
  'speed':           'Velocidad',
};

/* ────────────────────────────────────────────────────────────
   REFERENCIAS AL DOM
──────────────────────────────────────────────────────────── */
const pokedexDOM = {
  input:      document.getElementById('pokemon-input'),
  btn:        document.getElementById('btn-search-pokemon'),
  validation: document.getElementById('pokemon-validation'),
  loader:     document.getElementById('pokemon-loader'),
  error:      document.getElementById('pokemon-error'),
  errMsg:     document.getElementById('pokemon-error-msg'),
  card:       document.getElementById('pokemon-card'),
  // campos de la tarjeta
  img:        document.getElementById('pokemon-img'),
  id:         document.getElementById('pokemon-id'),
  name:       document.getElementById('pokemon-name'),
  types:      document.getElementById('pokemon-types'),
  height:     document.getElementById('pokemon-height'),
  weight:     document.getElementById('pokemon-weight'),
  abilities:  document.getElementById('pokemon-abilities-list'),
  stats:      document.getElementById('pokemon-stats-bars'),
};

/* ────────────────────────────────────────────────────────────
   CAPA DE DATOS — fetchPokemon(nameOrId)
   ▸ La PokeAPI acepta nombre en minúsculas o número de ID.
   ▸ Retorna el objeto completo con toda la info del Pokémon.
   ▸ Lanza error descriptivo si no existe (404).

   ¿Por qué transformamos a minúsculas?
   La PokeAPI es case-sensitive: "Pikachu" falla, "pikachu" funciona.
──────────────────────────────────────────────────────────── */
async function fetchPokemon(nameOrId) {
  // Normalizar: minúsculas + sin espacios extra
  const query = nameOrId.toLowerCase().trim();
  const url   = `${POKEDEX_CONFIG.BASE_URL}/${query}`;

  const response = await fetch(url);

  if (response.status === 404) {
    // Lanzamos un error personalizado que el catch capturará
    throw new Error(
      `No se encontró el Pokémon "${nameOrId}". Verifica el nombre o prueba con el número de ID.`
    );
  }

  if (!response.ok) {
    throw new Error(`Error al contactar la PokeAPI: ${response.status}`);
  }

  return await response.json();
}

/* ────────────────────────────────────────────────────────────
   CAPA DE VISTA — renderPokemonCard(pokemon)
   ▸ Recibe el objeto JSON de la API y actualiza el DOM.
   ▸ Delega la creación de tipos, habilidades y barras a
     funciones auxiliares para mayor claridad.
──────────────────────────────────────────────────────────── */
function renderPokemonCard(pokemon) {
  // ── Imagen ──────────────────────────────────────────────
  // oficial-artwork > sprite normal > sprite shiny como fallbacks
  const imgUrl =
    pokemon.sprites.other?.['official-artwork']?.front_default ||
    pokemon.sprites.front_default ||
    '';
  pokedexDOM.img.src = imgUrl;
  pokedexDOM.img.alt = pokemon.name;

  // ── Identidad ────────────────────────────────────────────
  pokedexDOM.id.textContent   = `#${String(pokemon.id).padStart(3, '0')}`;
  pokedexDOM.name.textContent = pokemon.name;

  // ── Tipos ────────────────────────────────────────────────
  // Llamamos a función auxiliar para mantener renderPokemonCard limpia
  renderTypes(pokemon.types);

  // ── Altura y Peso ────────────────────────────────────────
  // La API devuelve en decímetros y hectogramos → convertimos
  pokedexDOM.height.textContent = `${(pokemon.height / 10).toFixed(1)} m`;
  pokedexDOM.weight.textContent = `${(pokemon.weight / 10).toFixed(1)} kg`;

  // ── Habilidades ──────────────────────────────────────────
  renderAbilities(pokemon.abilities);

  // ── Estadísticas base ────────────────────────────────────
  renderBaseStats(pokemon.stats);

  // Mostrar la tarjeta
  pokedexDOM.card.classList.remove('hidden');
}

/* ────────────────────────────────────────────────────────────
   HELPER — renderTypes(types)
──────────────────────────────────────────────────────────── */
function renderTypes(types) {
  pokedexDOM.types.innerHTML = '';

  types.forEach(({ type }) => {
    const badge = document.createElement('span');
    badge.className = `type-badge ${TYPE_CLASSES[type.name] || ''}`;
    badge.textContent = type.name;
    pokedexDOM.types.appendChild(badge);
  });
}

/* ────────────────────────────────────────────────────────────
   HELPER — renderAbilities(abilities)
   ▸ Filtra las ocultas (hidden) con una etiqueta visual.
──────────────────────────────────────────────────────────── */
function renderAbilities(abilities) {
  pokedexDOM.abilities.innerHTML = '';

  abilities.forEach(({ ability, is_hidden }) => {
    const tag = document.createElement('span');
    tag.className = 'ability-tag';
    // Indicar visualmente si es habilidad oculta
    tag.textContent = is_hidden
      ? `${ability.name} (oculta)`
      : ability.name;
    pokedexDOM.abilities.appendChild(tag);
  });
}

/* ────────────────────────────────────────────────────────────
   HELPER — renderBaseStats(stats)
   ▸ Crea barras de progreso animadas para cada stat.
   ▸ El máximo de una stat base es 255 → escala porcentual.
──────────────────────────────────────────────────────────── */
function renderBaseStats(stats) {
  pokedexDOM.stats.innerHTML = '';
  const MAX_STAT = 255; // máximo teórico en la franquicia

  stats.forEach(({ stat, base_stat }) => {
    const pct = Math.round((base_stat / MAX_STAT) * 100);
    const name = STAT_NAMES[stat.name] || stat.name;

    // Colorear barra según valor: rojo-amarillo-verde
    const color = base_stat < 50 ? '#ff4747' : base_stat < 90 ? '#f5c518' : '#47ff9c';

    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
      <span class="stat-row-name">${name}</span>
      <span class="stat-row-val">${base_stat}</span>
      <div class="stat-bar-bg">
        <div
          class="stat-bar-fill"
          style="width: 0%; background: ${color};"
          data-target="${pct}"
        ></div>
      </div>
    `;
    pokedexDOM.stats.appendChild(row);
  });

  // Animar las barras después de insertar en el DOM
  // requestAnimationFrame asegura que el navegador ya pintó el 0%
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.stat-bar-fill').forEach(bar => {
        bar.style.width = `${bar.dataset.target}%`;
      });
    });
  });
}

/* ────────────────────────────────────────────────────────────
   VALIDACIÓN
──────────────────────────────────────────────────────────── */
function validatePokemonInput(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    showPokedexValidation('⚠ Ingresa el nombre o número del Pokémon.');
    return false;
  }

  // Aceptamos letras, números y guiones (ej: "mr-mime", "type-null")
  if (!/^[a-zA-Z0-9\-áéíóú\s]+$/.test(trimmed)) {
    showPokedexValidation('⚠ Nombre inválido. Usa letras, números o guiones.');
    return false;
  }

  hidePokedexValidation();
  return true;
}

/* ────────────────────────────────────────────────────────────
   HELPERS DE UI
──────────────────────────────────────────────────────────── */
function showPokedexValidation(msg) {
  pokedexDOM.validation.textContent = msg;
  pokedexDOM.validation.classList.remove('hidden');
}

function hidePokedexValidation() {
  pokedexDOM.validation.classList.add('hidden');
}

function setPokedexUIState(state) {
  pokedexDOM.loader.classList.add('hidden');
  pokedexDOM.error.classList.add('hidden');
  pokedexDOM.card.classList.add('hidden');

  if (state === 'loading') pokedexDOM.loader.classList.remove('hidden');
  if (state === 'error')   pokedexDOM.error.classList.remove('hidden');
  if (state === 'success') pokedexDOM.card.classList.remove('hidden');
}

/* ────────────────────────────────────────────────────────────
   ORQUESTADOR — pokedexApp.search()
──────────────────────────────────────────────────────────── */
const pokedexApp = {
  async search() {
    const query = pokedexDOM.input.value;

    // 1. Validar
    if (!validatePokemonInput(query)) return;

    // 2. Estado: cargando
    setPokedexUIState('loading');
    pokedexDOM.btn.disabled = true;

    try {
      // 3. Fetch de datos
      const pokemon = await fetchPokemon(query);

      // 4. Renderizar
      renderPokemonCard(pokemon);
      setPokedexUIState('success');

    } catch (error) {
      console.error('[PokedexApp] Error:', error);
      pokedexDOM.errMsg.textContent = error.message;
      setPokedexUIState('error');

    } finally {
      pokedexDOM.btn.disabled = false;
    }
  }
};

/* ────────────────────────────────────────────────────────────
   EVENT LISTENERS
──────────────────────────────────────────────────────────── */
pokedexDOM.btn.addEventListener('click', () => pokedexApp.search());

pokedexDOM.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') pokedexApp.search();
});

pokedexDOM.input.addEventListener('input', () => {
  if (pokedexDOM.input.value.trim()) hidePokedexValidation();
});
