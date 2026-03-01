/**
 * ═══════════════════════════════════════════════════════════════
 * EJERCICIO 2 — APP DEL CLIMA
 * API: OpenWeatherMap (https://openweathermap.org/api)
 *
 * CONCEPTOS APLICADOS:
 *  ✔ async / await        → petición no bloqueante a la API
 *  ✔ fetch con URL params → construcción dinámica de endpoint
 *  ✔ try / catch / finally → manejo robusto de errores
 *  ✔ Validación de input  → antes de hacer la petición
 *  ✔ Estados de UI        → loading, success, error, empty
 *  ✔ Event listener + Enter key
 *  ✔ Modo demo (sin API Key real)
 *
 * PARA USAR CON TU API KEY REAL:
 *  1. Regístrate en https://openweathermap.org/api
 *  2. Ve a "My API keys" y copia tu clave
 *  3. Reemplaza 'YOUR_API_KEY' en WEATHER_CONFIG.API_KEY
 *  4. Cambia DEMO_MODE a false
 * ═══════════════════════════════════════════════════════════════
 */

/* ────────────────────────────────────────────────────────────
   CONFIGURACIÓN
──────────────────────────────────────────────────────────── */
const WEATHER_CONFIG = {
  API_KEY:  'YOUR_API_KEY',             // ← reemplaza con tu clave
  BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',
  UNITS:    'metric',                   // metric = Celsius
  LANG:     'es',                       // respuesta en español
  DEMO_MODE: true,                      // true mientras no tengas key
};

/* ────────────────────────────────────────────────────────────
   DATOS DEMO
   Se usan cuando DEMO_MODE = true para poder probar la UI
   sin API Key real.
──────────────────────────────────────────────────────────── */
const WEATHER_DEMO_DATA = {
  'bogota':     { city: 'Bogotá',     country: 'CO', temp: 14, feels: 12, humidity: 80, wind: 3.1, visibility: 10, desc: 'Parcialmente nublado', icon: '02d' },
  'medellin':   { city: 'Medellín',   country: 'CO', temp: 22, feels: 21, humidity: 65, wind: 2.5, visibility: 10, desc: 'Cielo despejado',     icon: '01d' },
  'madrid':     { city: 'Madrid',     country: 'ES', temp: 18, feels: 16, humidity: 50, wind: 5.2, visibility: 10, desc: 'Soleado',             icon: '01d' },
  'paris':      { city: 'París',      country: 'FR', temp: 11, feels: 9,  humidity: 75, wind: 4.0, visibility: 8,  desc: 'Lluvia ligera',       icon: '10d' },
  'tokyo':      { city: 'Tokio',      country: 'JP', temp: 20, feels: 19, humidity: 60, wind: 3.8, visibility: 10, desc: 'Despejado',           icon: '01d' },
  'new york':   { city: 'New York',   country: 'US', temp: 9,  feels: 6,  humidity: 55, wind: 7.2, visibility: 9,  desc: 'Viento fuerte',       icon: '03d' },
  'buenos aires':{ city: 'Buenos Aires',country:'AR', temp: 26, feels: 28, humidity: 70, wind: 4.1, visibility: 10, desc: 'Cálido y soleado',    icon: '01d' },
};

/* ────────────────────────────────────────────────────────────
   REFERENCIAS AL DOM
──────────────────────────────────────────────────────────── */
const weatherDOM = {
  input:      document.getElementById('city-input'),
  btn:        document.getElementById('btn-search-weather'),
  validation: document.getElementById('weather-validation'),
  loader:     document.getElementById('weather-loader'),
  error:      document.getElementById('weather-error'),
  errMsg:     document.getElementById('weather-error-msg'),
  card:       document.getElementById('weather-card'),
  // campos de la tarjeta
  city:       document.getElementById('weather-city'),
  country:    document.getElementById('weather-country'),
  icon:       document.getElementById('weather-icon'),
  temp:       document.getElementById('weather-temp'),
  desc:       document.getElementById('weather-desc'),
  feels:      document.getElementById('weather-feels'),
  humidity:   document.getElementById('weather-humidity'),
  wind:       document.getElementById('weather-wind'),
  visibility: document.getElementById('weather-visibility'),
};

/* ────────────────────────────────────────────────────────────
   CAPA DE DATOS — fetchWeather(city)
   ▸ Construye la URL con los parámetros necesarios.
   ▸ Hace la petición y verifica el status.
   ▸ Lanza error descriptivo si la ciudad no existe (404).
──────────────────────────────────────────────────────────── */
async function fetchWeather(city) {
  // Construimos los query params de la URL
  const params = new URLSearchParams({
    q:     city,
    appid: WEATHER_CONFIG.API_KEY,
    units: WEATHER_CONFIG.UNITS,
    lang:  WEATHER_CONFIG.LANG,
  });

  const url = `${WEATHER_CONFIG.BASE_URL}?${params}`;
  const response = await fetch(url);

  // OpenWeather devuelve 404 si la ciudad no existe
  if (response.status === 404) {
    throw new Error(`Ciudad "${city}" no encontrada. Verifica el nombre e intenta de nuevo.`);
  }

  if (response.status === 401) {
    throw new Error('API Key inválida. Revisa tu clave en WEATHER_CONFIG.');
  }

  if (!response.ok) {
    throw new Error(`Error del servidor: ${response.status}`);
  }

  return await response.json();
}

/* ────────────────────────────────────────────────────────────
   MODO DEMO — fetchWeatherDemo(city)
   Simula una llamada async con setTimeout para mostrar el loader.
──────────────────────────────────────────────────────────── */
function fetchWeatherDemo(city) {
  // Retornamos una Promise manualmente para simular async
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const key = city.toLowerCase().trim();
      const data = WEATHER_DEMO_DATA[key];

      if (data) {
        resolve(data);
      } else {
        reject(new Error(
          `Ciudad "${city}" no está en el modo demo. Prueba: Bogotá, Medellín, Madrid, París, Tokyo, New York, Buenos Aires`
        ));
      }
    }, 900); // simula latencia de red
  });
}

/* ────────────────────────────────────────────────────────────
   CAPA DE VISTA — renderWeather(data)
   ▸ Recibe los datos y actualiza el DOM.
   ▸ Soporta tanto la respuesta real de OpenWeather como
     el formato simplificado del modo demo.
──────────────────────────────────────────────────────────── */
function renderWeather(data) {
  // Normalizar datos: la API real tiene estructura diferente al demo
  const isRealAPI = !!data.main; // la API real tiene la propiedad 'main'

  const normalized = isRealAPI ? {
    city:       data.name,
    country:    data.sys.country,
    temp:       Math.round(data.main.temp),
    feels:      Math.round(data.main.feels_like),
    humidity:   data.main.humidity,
    wind:       data.wind.speed,
    visibility: (data.visibility / 1000).toFixed(1),
    desc:       data.weather[0].description,
    icon:       data.weather[0].icon,
  } : {
    // datos del modo demo ya están normalizados
    ...data,
  };

  // Poblar los campos de la tarjeta
  weatherDOM.city.textContent    = normalized.city;
  weatherDOM.country.textContent = `📍 ${normalized.country}`;
  weatherDOM.temp.textContent    = normalized.temp;
  weatherDOM.desc.textContent    = normalized.desc;
  weatherDOM.feels.textContent   = `${normalized.feels}°C`;
  weatherDOM.humidity.textContent= `${normalized.humidity}%`;
  weatherDOM.wind.textContent    = `${normalized.wind} m/s`;
  weatherDOM.visibility.textContent = `${normalized.visibility} km`;

  // Ícono del clima de OpenWeather
  weatherDOM.icon.src = `https://openweathermap.org/img/wn/${normalized.icon}@2x.png`;
  weatherDOM.icon.alt = normalized.desc;

  // Mostrar tarjeta
  weatherDOM.card.classList.remove('hidden');
}

/* ────────────────────────────────────────────────────────────
   VALIDACIÓN DE INPUT
   ▸ Verifica que el input no esté vacío ni sea muy corto.
   ▸ Muestra el mensaje de error de validación.
   ▸ Retorna true si el input es válido.
──────────────────────────────────────────────────────────── */
function validateCityInput(value) {
  if (!value.trim()) {
    showWeatherValidation('⚠ Por favor escribe el nombre de una ciudad.');
    return false;
  }

  if (value.trim().length < 2) {
    showWeatherValidation('⚠ El nombre de la ciudad debe tener al menos 2 caracteres.');
    return false;
  }

  hideWeatherValidation();
  return true;
}

/* ────────────────────────────────────────────────────────────
   HELPERS DE UI
──────────────────────────────────────────────────────────── */
function showWeatherValidation(msg) {
  weatherDOM.validation.textContent = msg;
  weatherDOM.validation.classList.remove('hidden');
}

function hideWeatherValidation() {
  weatherDOM.validation.classList.add('hidden');
}

function setWeatherUIState(state) {
  // Ocultar todos los estados posibles
  weatherDOM.loader.classList.add('hidden');
  weatherDOM.error.classList.add('hidden');
  weatherDOM.card.classList.add('hidden');

  // Mostrar el estado indicado
  if (state === 'loading') weatherDOM.loader.classList.remove('hidden');
  if (state === 'error')   weatherDOM.error.classList.remove('hidden');
  if (state === 'success') weatherDOM.card.classList.remove('hidden');
}

/* ────────────────────────────────────────────────────────────
   ORQUESTADOR — weatherApp.search()
──────────────────────────────────────────────────────────── */
const weatherApp = {
  async search() {
    const city = weatherDOM.input.value;

    // 1. Validar antes de hacer cualquier petición
    if (!validateCityInput(city)) return;

    // 2. Actualizar UI a estado "cargando"
    setWeatherUIState('loading');
    weatherDOM.btn.disabled = true;

    try {
      // 3. Obtener datos (real o demo)
      const data = WEATHER_CONFIG.DEMO_MODE
        ? await fetchWeatherDemo(city)
        : await fetchWeather(city);

      // 4. Renderizar datos
      renderWeather(data);
      setWeatherUIState('success');

    } catch (error) {
      console.error('[WeatherApp] Error:', error);
      weatherDOM.errMsg.textContent = error.message;
      setWeatherUIState('error');

    } finally {
      weatherDOM.btn.disabled = false;
    }
  }
};

/* ────────────────────────────────────────────────────────────
   EVENT LISTENERS
   Soportamos tanto clic en botón como Enter en el input.
──────────────────────────────────────────────────────────── */
weatherDOM.btn.addEventListener('click', () => weatherApp.search());

// Tecla Enter en el input — mejor UX
weatherDOM.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') weatherApp.search();
});

// Limpiar validación mientras el usuario escribe
weatherDOM.input.addEventListener('input', () => {
  if (weatherDOM.input.value.trim()) hideWeatherValidation();
});
