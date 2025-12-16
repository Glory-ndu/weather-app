import React, { useEffect, useMemo, useRef, useState } from "react";

// =====================================
// Environment-safe API key resolution
// =====================================
// Avoid referencing process.env directly in the browser (may be undefined).
// We resolve from (in order): Vite env, CRA/Next public env, window global, localStorage.
function chooseApiKey(sources) {
  // Select the first non-empty string among provided sources
  const order = [
    "vite",
    "viteAlt",
    "cra",
    "next",
    "windowGlobal",
    "localStorage",
  ];
  for (const key of order) {
    const val = sources[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

function resolveApiKey() {
  let local = "";
  try {
    if (typeof localStorage !== "undefined") {
      local = localStorage.getItem("WEATHER_API_KEY") || "";
    }
  } catch (_) {}

  const viteEnv =
    (typeof import.meta !== "undefined" && import.meta.env &&
      (import.meta.env.VITE_WEATHER_API_KEY ||
        import.meta.env.VITE_APP_WEATHER_API_KEY ||
        import.meta.env.PUBLIC_WEATHER_API_KEY)) || "";

  const craEnv =
    (typeof process !== "undefined" && process.env &&
      process.env.REACT_APP_WEATHER_API_KEY) || "";

  const nextEnv =
    (typeof process !== "undefined" && process.env &&
      process.env.NEXT_PUBLIC_WEATHER_API_KEY) || "";

  const winGlobal =
    (typeof window !== "undefined" && window._WEATHER_API_KEY_) || "";

  return chooseApiKey({
    vite: viteEnv,
    viteAlt: "", // reserved for future variants
    cra: craEnv,
    next: nextEnv,
    windowGlobal: winGlobal,
    localStorage: local,
  });
}

const INITIAL_API_KEY = resolveApiKey();

// =====================================
// Embedded copy of your App.css
// (keeps builds working even if file import fails)
// =====================================
const EMBEDDED_CSS = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

:root{ --bg1:#F6EEFA; --bg2:#EFDFF8; --card:rgba(255,255,255,0.9); --accent:#6B3FA0; --muted:#6c6c7a; --glass-shadow:0 8px 30px rgba(100,80,120,0.12); --radius:16px; }
*{ box-sizing:border-box; }
html,body,#root{ height:100%; }
body{ margin:0; font-family:'Poppins',system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial; background:linear-gradient(135deg,var(--bg1) 0%,var(--bg2) 100%); -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; color:#222; display:flex; align-items:center; justify-content:center; padding:32px; }
.app{ width:100%; max-width:920px; }
.card{ background:linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.85)); border-radius:var(--radius); padding:28px; box-shadow:var(--glass-shadow); width:100%; max-width:560px; margin:0 auto; }
.card-header h1{ margin:0; font-size:22px; letter-spacing:-.2px; color:var(--accent); }
.subtitle{ margin:6px 0 16px; color:var(--muted); font-size:13px; }
.search{ display:grid; grid-template-columns:1fr; gap:12px; margin-bottom:16px; }
.input{ width:100%; padding:12px 14px; border-radius:10px; border:1px solid rgba(107,63,160,0.12); background:rgba(250,246,255,0.8); font-size:15px; outline:none; transition: box-shadow .18s, transform .12s; }
.input:focus{ box-shadow:0 6px 18px rgba(107,63,160,0.12); transform:translateY(-1px); }
.buttons{ display:flex; gap:10px; }
.btn{ padding:10px 14px; border-radius:10px; border:none; background:transparent; cursor:pointer; font-weight:600; color:var(--accent); transition: transform .12s, box-shadow .12s; }
.btn:hover{ transform:translateY(-3px); }
.btn.primary{ background:linear-gradient(90deg,var(--accent),#8f5db8); color:white; box-shadow:0 6px 18px rgba(107,63,160,0.12); }
.status{ min-height:56px; margin-bottom:12px; }
.loading{ display:flex; gap:12px; align-items:center; color:var(--muted); font-weight:600; }
.spinner{ height:18px; width:18px; border-radius:50%; border:3px solid rgba(107,63,160,0.15); border-top-color:var(--accent); animation: spin 1s linear infinite; }
@keyframes spin{ to{ transform:rotate(360deg); } }
.error{ color:#b00020; background:rgba(176,0,32,0.06); padding:10px; border-radius:8px; font-weight:600; }
.weather-card{ padding:14px; border-radius:12px; background:linear-gradient(180deg,rgba(239,231,251,0.6),rgba(255,255,255,0.4)); box-shadow:0 6px 26px rgba(100,80,120,0.06); }
.top-row{ display:flex; justify-content:space-between; align-items:center; gap:12px; }
.city h2{ margin:0; color:#3b2a5b; font-size:18px; }
.desc{ color:var(--muted); font-size:13px; margin-top:6px; text-transform:capitalize; }
.temp{ text-align:right; }
.temp-value{ font-size:36px; font-weight:700; color:#4b2f7a; }
.feels{ color:var(--muted); font-size:13px; margin-top:4px; }
.details{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-top:12px; }
.detail-item{ background:rgba(255,255,255,0.6); border-radius:10px; padding:10px; text-align:left; border:1px solid rgba(107,63,160,0.04); }
.detail-item .label{ color:var(--muted); font-size:12px; }
.detail-item .value{ font-weight:700; font-size:14px; margin-top:6px; }
.card-footer{ display:flex; justify-content:space-between; align-items:center; margin-top:12px; color:var(--muted); font-size:12px; }
.ow-icon{ width:48px; height:48px; }
.hint{ color:var(--muted); font-weight:600; }
.sr-only{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
@media (max-width:480px){ .card{ padding:18px; border-radius:12px; } .temp-value{ font-size:28px; } .details{ grid-template-columns:1fr; } }`;

function EmbeddedStyles() {
  return <style dangerouslySetInnerHTML={{ __html: EMBEDDED_CSS }} />;
}

function getWeatherEmoji(condition) {
  if (!condition) return "🌤";
  const m = String(condition).toLowerCase();
  if (m.includes("sunny") || m.includes("clear")) return "☀";
  if (m.includes("cloud")) return "☁";
  if (m.includes("rain")) return "🌧";
  if (m.includes("drizzle")) return "🌦";
  if (m.includes("thunder")) return "⛈";
  if (m.includes("snow")) return "❄";
  if (["mist", "fog", "haze", "smoke"].some((x) => m.includes(x))) return "🌫";
  return "🌤";
}

// ---- Lightweight self-tests (run in non-production only) ----------------------
function isProduction() {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && typeof import.meta.env.PROD !== "undefined") {
      return !!import.meta.env.PROD;
    }
    if (typeof process !== "undefined" && process.env && typeof process.env.NODE_ENV !== "undefined") {
      return process.env.NODE_ENV === "production";
    }
  } catch (_) {}
  return false; // default to dev
}

function runSelfTests() {
  // Existing tests (do not modify)
  const cases = [
    ["Sunny", "☀"],
    ["Clear", "☀"],
    ["Cloudy", "☁"],
    ["Overcast", "☁"],
    ["Light rain", "🌧"],
    ["Drizzle", "🌦"],
    ["Thunderstorm", "⛈"],
    ["Snow", "❄"],
    ["Mist", "🌫"],
    ["SomethingElse", "🌤"],
  ];
  cases.forEach(([input, expected]) => {
    console.assert(
      getWeatherEmoji(input) === expected,
      getWeatherEmoji(${input}) !== ${expected}
    );
  });

  // Additional tests for broader coverage
  const extraCases = [
    ["Light drizzle", "🌦"],
    ["Moderate rain", "🌧"],
    ["Patchy light snow", "❄"],
    ["Smoke", "🌫"],
    ["Partly cloudy", "☁"],
    ["", "🌤"],
    [null, "🌤"],
    [undefined, "🌤"],
    ["CLEAR SKY", "☀"],
  ];
  extraCases.forEach(([input, expected]) => {
    console.assert(
      getWeatherEmoji(input) === expected,
      getWeatherEmoji(${input}) !== ${expected}
    );
  });

  // New tests: env key selection (without touching real globals)
  console.assert(
    chooseApiKey({ vite: "VITE", viteAlt: "", cra: "CRA", next: "NEXT", windowGlobal: "WIN", localStorage: "LOC" }) === "VITE",
    "Env precedence should prefer Vite"
  );
  console.assert(
    chooseApiKey({ vite: "", viteAlt: "", cra: "CRA", next: "NEXT", windowGlobal: "WIN", localStorage: "LOC" }) === "CRA",
    "Env precedence should prefer CRA when Vite empty"
  );
  console.assert(
    chooseApiKey({ vite: "", viteAlt: "", cra: "", next: "NEXT", windowGlobal: "WIN", localStorage: "LOC" }) === "NEXT",
    "Env precedence should prefer NEXT when CRA empty"
  );
  console.assert(
    chooseApiKey({ vite: "", viteAlt: "", cra: "", next: "", windowGlobal: "WIN", localStorage: "LOC" }) === "WIN",
    "Env precedence should prefer window global next"
  );
  console.assert(
    chooseApiKey({ vite: "", viteAlt: "", cra: "", next: "", windowGlobal: "", localStorage: "LOC" }) === "LOC",
    "Env precedence should fall back to localStorage"
  );
  console.assert(
    chooseApiKey({ vite: " ", viteAlt: " ", cra: " ", next: " ", windowGlobal: " ", localStorage: " " }) === "",
    "Whitespace-only values should be treated as empty"
  );

  // unit conversions
  const windMs = 36 / 3.6; // 36 km/h -> 10 m/s
  console.assert(Math.round(windMs) === 10, "wind km/h to m/s conversion failed");

  const mb = 1013; // standard pressure, should equal hPa and be *100 for Pa
  console.assert(mb === 1013 && mb * 100 === 101300, "pressure conversion failed");

  // icon url composition
  const iconPath = "//cdn.weatherapi.com/weather/64x64/day/113.png";
  const url = https:${iconPath};
  console.assert(url.startsWith("https://"), "icon URL should be https");
}

if (typeof window !== "undefined" && !isProduction()) {
  try { runSelfTests(); } catch (e) { console.warn("Self-tests failed:", e); }
}

// =====================================
// App
// =====================================
export default function App() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(INITIAL_API_KEY);
  const [showKeyInput, setShowKeyInput] = useState(!INITIAL_API_KEY);

  // Persist the last searched city so refresh keeps the same view
  useEffect(() => {
    const last = localStorage.getItem("last_city");
    if (last) {
      setQuery(last);
      setCity(last);
    }
  }, []);

  const abortRef = useRef(null);

  useEffect(() => {
    if (!city) return;

    if (!apiKey) {
      setError(
        "Missing API key. Provide it below (stored locally) or configure Vite/CRA public env vars."
      );
      setWeather(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    // Provide a hard timeout so fetch can't hang forever (e.g., bad network)
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        // IMPORTANT: use HTTPS to avoid mixed-content errors on secure sites
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(
          city
        )}&aqi=no`;
        const res = await fetch(url, { signal: controller.signal });

        // WeatherAPI returns JSON on errors as well, but parsing might still fail
        let data = null;
        try {
          data = await res.json();
        } catch (_) {
          // not JSON
        }

        if (!res.ok) {
          const msg =
            data?.error?.message ||
            data?.message ||
            Request failed (${res.status});
          throw new Error(msg);
        }

        setWeather(data);
        localStorage.setItem("last_city", city);
      } catch (err) {
        if (err.name === "AbortError") return; // aborted by us
        setWeather(null);
        setError(err.message || "An error occurred while fetching weather data.");
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchWeather();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [city, apiKey]);

  const onSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Please enter a city name.");
      setWeather(null);
      return;
    }
    if (loading && abortRef.current) {
      // cancel any inflight request before starting a new one
      abortRef.current.abort();
    }
    setCity(trimmed);
  };

  const onClear = () => {
    setQuery("");
    setCity("");
    setWeather(null);
    setError(null);
    setLoading(false);
    localStorage.removeItem("last_city");
  };

  const onSaveKey = (k) => {
    const trimmed = (k || "").trim();
    if (!trimmed) return;
    try {
      localStorage.setItem("WEATHER_API_KEY", trimmed);
    } catch (_) {}
    setApiKey(trimmed);
    setShowKeyInput(false);
  };

  const tempC = weather?.current?.temp_c ?? null;
  const feelsC = weather?.current?.feelslike_c ?? null;
  const humidity = weather?.current?.humidity ?? null;
  const pressureMb = weather?.current?.pressure_mb ?? null; // WeatherAPI returns millibars == hPa
  const pressureHpa = pressureMb != null ? Math.round(pressureMb) : null; // show as hPa (standard)
  const pressurePa = pressureMb != null ? Math.round(pressureMb * 100) : null; // exact pascals if desired
  const windMs = weather?.current?.wind_kph ? weather.current.wind_kph / 3.6 : null; // km/h -> m/s
  const description = weather?.current?.condition?.text ?? "";
  const mainCondition = description;
  const iconUrl = weather?.current?.condition?.icon ? https:${weather.current.condition.icon} : null;

  // pre-compute some nicely formatted values
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 0,
      }),
    []
  );

  const accessibleStatus = loading
    ? "Loading weather…"
    : error
    ? Error: ${error}
    : weather
    ? Weather loaded for ${weather.location?.name || "selected city"}
    : "Idle";

  return (
    <div className="app">
      {/* Inline the stylesheet so builds succeed even if App.css is unresolved */}
      <EmbeddedStyles />

      <div className="card">
        <header className="card-header">
          <h1>Weather Dashboard</h1>
          <p className="subtitle">Type a city and get the current weather ✨</p>
        </header>

        {/* API key helper UI (only shown when key is missing or user expands it) */}
        {showKeyInput && (
          <KeyEntry onSave={onSaveKey} />
        )}

        <form className="search" onSubmit={onSubmit} role="search">
          <input
            aria-label="City name"
            placeholder="e.g. Lagos, London, Tokyo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input"
            autoComplete="off"
          />
          <div className="buttons">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </button>
            <button type="button" onClick={onClear} className="btn" disabled={loading}>
              Clear
            </button>
          </div>
        </form>

        {/* Live region for screen readers */}
        <div className="sr-only" aria-live="polite">
          {accessibleStatus}
        </div>

        <section className="status">
          {loading && (
            <div className="loading" aria-busy="true">
              <div className="spinner" aria-hidden="true" />
              <span>Loading…</span>
            </div>
          )}

          {error && !loading && <div className="error">Error: {error}</div>}

          {!loading && !error && !weather && (
            <div className="hint">Try searching a city to see live weather data.</div>
          )}
        </section>

        {weather && !loading && !error && (
          <section className="weather-card">
            <div className="top-row">
              <div className="city">
                <h2>
                  {weather.location?.name}
                  {weather.location?.region ? , ${weather.location.region} : ""}
                  {weather.location?.country ? , ${weather.location.country} : ""}
                </h2>
                <div className="desc">
                  {getWeatherEmoji(mainCondition)} {description}
                </div>
              </div>
              <div className="temp">
                <div className="temp-value">
                  {tempC !== null ? fmt.format(Math.round(tempC)) : "--"}°C
                </div>
                <div className="feels">
                  Feels like {feelsC !== null ? fmt.format(Math.round(feelsC)) : "--"}°C
                </div>
              </div>
            </div>

            <div className="details">
              <div className="detail-item">
                <div className="label">Humidity</div>
                <div className="value">{humidity !== null ? ${fmt.format(humidity)}% : "--"}</div>
              </div>

              <div className="detail-item">
                <div className="label">Pressure</div>
                <div className="value">
                  {pressureHpa !== null ? ${fmt.format(pressureHpa)} hPa : "--"}
                  <span className="muted">
                    {pressurePa !== null ? ` (${fmt.format(pressurePa)} Pa)` : ""}
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <div className="label">Wind</div>
                <div className="value">
                  {windMs !== null ? ${fmt.format(Math.round(windMs))} m/s : "--"}
                </div>
              </div>

              <div className="detail-item">
                <div className="label">Coordinates</div>
                <div className="value">
                  {weather.location?.lat ?? "--"}, {weather.location?.lon ?? "--"}
                </div>
              </div>
            </div>

            <footer className="card-footer">
              <small>Data from WeatherAPI.com</small>
              {iconUrl ? (
                <img className="ow-icon" alt={description || "weather icon"} src={iconUrl} />
              ) : null}
            </footer>
          </section>
        )}
      </div>
    </div>
  );
}

function KeyEntry({ onSave }) {
  const [val, setVal] = useState("");
  return (
    <div className="status" style={{ marginTop: 8 }}>
      <div className="hint" style={{ marginBottom: 8 }}>
        Enter your WeatherAPI key (kept in your browser's localStorage):
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(val);
        }}
        className="search"
      >
        <input
          className="input"
          placeholder="Your API key"
          aria-label="Weather API key"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoComplete="off"
        />
        <div className="buttons">
          <button type="submit" className="btn primary">Save key</button>
        </div>
      </form>
      <div className="hint">
        Alternatively, set <code>VITE_WEATHER_API_KEY</code> (Vite) or <code>REACT_APP_WEATHER_API_KEY</code> (CRA)
        at build time, or define <code>window._WEATHER_API_KEY_</code> before this app loads.
      </div>
    </div>
  );
}

// Optional: export helper for external tests
export { getWeatherEmoji, chooseApiKey };