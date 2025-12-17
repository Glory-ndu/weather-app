import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

// ===========================
// API Key Utilities
// ===========================
function chooseApiKey(sources) {
  const order = ["vite","viteAlt","cra","next","windowGlobal","localStorage"];
  for (const key of order) {
    const val = sources[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

function resolveApiKey() {
  let local = "";
  try { local = localStorage.getItem("WEATHER_API_KEY") || ""; } catch(_) {}
  
  const viteEnv = (typeof import.meta !== "undefined" && import.meta.env && 
      (import.meta.env.VITE_WEATHER_API_KEY || import.meta.env.VITE_APP_WEATHER_API_KEY || import.meta.env.PUBLIC_WEATHER_API_KEY)) || "";

  const craEnv = (typeof process !== "undefined" && process.env && process.env.REACT_APP_WEATHER_API_KEY) || "";
  const nextEnv = (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_WEATHER_API_KEY) || "";
  const winGlobal = (typeof window !== "undefined" && window._WEATHER_API_KEY_) || "";

  return chooseApiKey({ vite: viteEnv, viteAlt:"", cra: craEnv, next: nextEnv, windowGlobal: winGlobal, localStorage: local });
}

const INITIAL_API_KEY = resolveApiKey();

// ===========================
// Emoji Helper
// ===========================
function getWeatherEmoji(condition){
  if(!condition) return "🌤";
  const m = String(condition).toLowerCase();
  if(m.includes("sunny") || m.includes("clear")) return "☀";
  if(m.includes("cloud")) return "☁";
  if(m.includes("rain")) return "🌧";
  if(m.includes("drizzle")) return "🌦";
  if(m.includes("thunder")) return "⛈";
  if(m.includes("snow")) return "❄";
  if(["mist","fog","haze","smoke"].some(x=>m.includes(x))) return "🌫";
  return "🌤";
}

// ===========================
// KeyEntry Component
// ===========================
function KeyEntry({onSave}){
  const [val,setVal] = useState("");
  return (
    <div className="status" style={{marginTop:8}}>
      <div className="hint" style={{marginBottom:8}}>
        Enter your WeatherAPI key (stored in localStorage):
      </div>
      <form className="search" onSubmit={e=>{ e.preventDefault(); onSave(val); }}>
        <input className="input" placeholder="Your API key" aria-label="Weather API key"
          value={val} onChange={e=>setVal(e.target.value)} autoComplete="off"/>
        <div className="buttons">
          <button type="submit" className="btn primary">Save key</button>
        </div>
      </form>
      <div className="hint">
        Or set <code>VITE_WEATHER_API_KEY</code> (Vite) / <code>REACT_APP_WEATHER_API_KEY</code> (CRA) at build time or define <code>window._WEATHER_API_KEY_</code> before app loads.
      </div>
    </div>
  );
}

// ===========================
// Main App
// ===========================
export default function App(){
  const [query,setQuery] = useState("");
  const [city,setCity] = useState("");
  const [weather,setWeather] = useState(null);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState(null);
  const [apiKey,setApiKey] = useState(INITIAL_API_KEY);
  const [showKeyInput,setShowKeyInput] = useState(!INITIAL_API_KEY);

  const abortRef = useRef(null);

  useEffect(()=>{
    const last = localStorage.getItem("last_city");
    if(last){ setQuery(last); setCity(last); }
  },[]);

  useEffect(()=>{
    if(!city) return;
    if(!apiKey){ setError("Missing API key."); setWeather(null); return; }

    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(()=>controller.abort(),10000);

    const fetchWeather = async()=>{
      try{
        setLoading(true);
        setError(null);
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&aqi=no`;
        const res = await fetch(url,{signal:controller.signal});
        let data=null;
        try{ data = await res.json(); }catch(_){}
        if(!res.ok){ const msg=data?.error?.message||`Request failed (${res.status})`; throw new Error(msg); }
        setWeather(data);
        localStorage.setItem("last_city",city);
      }catch(err){
        if(err.name==="AbortError") return;
        setWeather(null);
        setError(err.message||"Error fetching weather data.");
      }finally{ clearTimeout(timeoutId); setLoading(false); }
    };
    fetchWeather();
    return ()=>{ clearTimeout(timeoutId); controller.abort(); };
  },[city,apiKey]);

  const onSubmit = e=>{
    e.preventDefault();
    const trimmed=query.trim();
    if(!trimmed){ setError("Please enter a city name."); setWeather(null); return; }
    if(loading && abortRef.current) abortRef.current.abort();
    setCity(trimmed);
  };

  const onClear = ()=>{
    setQuery(""); setCity(""); setWeather(null); setError(null); setLoading(false);
    localStorage.removeItem("last_city");
  };

  const onSaveKey = k=>{
    const trimmed=(k||"").trim();
    if(!trimmed) return;
    try{ localStorage.setItem("WEATHER_API_KEY",trimmed);}catch(_){}
    setApiKey(trimmed); setShowKeyInput(false);
  };

  const tempC = weather?.current?.temp_c ?? null;
  const feelsC = weather?.current?.feelslike_c ?? null;
  const humidity = weather?.current?.humidity ?? null;
  const pressureMb = weather?.current?.pressure_mb ?? null;
  const pressureHpa = pressureMb != null ? Math.round(pressureMb) : null;
  const pressurePa = pressureMb != null ? Math.round(pressureMb*100) : null;
  const windMs = weather?.current?.wind_kph ? weather.current.wind_kph/3.6 : null;
  const description = weather?.current?.condition?.text ?? "";
  const mainCondition = description;
  const iconUrl = weather?.current?.condition?.icon ? `https:${weather.current.condition.icon}` : null;

  const fmt = useMemo(()=>new Intl.NumberFormat(undefined,{maximumFractionDigits:0}),[]);

  const accessibleStatus = loading ? "Loading weather…" : error ? `Error: ${error}` : weather ? `Weather loaded for ${weather.location?.name||"selected city"}` : "Idle";

  return (
    <div className="app">
      <div className="card">
        <header className="card-header">
          <h1>Weather Dashboard</h1>
          <p className="subtitle">Type a city and get the current weather ✨</p>
        </header>

        {showKeyInput && <KeyEntry onSave={onSaveKey}/>}

        <form className="search" onSubmit={onSubmit} role="search">
          <input aria-label="City name" placeholder="e.g. Lagos, London, Tokyo"
            value={query} onChange={e=>setQuery(e.target.value)} className="input" autoComplete="off"/>
          <div className="buttons">
            <button type="submit" className="btn primary" disabled={loading}>{loading?"Searching…":"Search"}</button>
            <button type="button" onClick={onClear} className="btn" disabled={loading}>Clear</button>
          </div>
        </form>

        <div className="sr-only" aria-live="polite">{accessibleStatus}</div>

        <section className="status">
          {loading && <div className="loading" aria-busy="true"><div className="spinner" aria-hidden="true"/><span>Loading…</span></div>}
          {error && !loading && <div className="error">Error: {error}</div>}
          {!loading && !error && !weather && <div className="hint">Try searching a city to see live weather data.</div>}
        </section>

        {weather && !loading && !error && (
          <section className="weather-card">
            <div className="top-row">
              <div className="city">
                <h2>
                  {weather.location?.name}
                  {weather.location?.region ? `, ${weather.location.region}`:""}
                  {weather.location?.country ? `, ${weather.location.country}`:""}
                </h2>
                <div className="desc">{getWeatherEmoji(mainCondition)} {description}</div>
              </div>
              <div className="temp">
                <div className="temp-value">{tempC!==null?fmt.format(Math.round(tempC)):"--"}°C</div>
                <div className="feels">Feels like {feelsC!==null?fmt.format(Math.round(feelsC)):"--"}°C</div>
              </div>
            </div>

            <div className="details">
              <div className="detail-item"><div className="label">Humidity</div><div className="value">{humidity!==null?`${fmt.format(humidity)}%`:"--"}</div></div>
              <div className="detail-item"><div className="label">Pressure</div><div className="value">{pressureHpa!==null?`${fmt.format(pressureHpa)} hPa`:"--"}<span className="muted">{pressurePa!==null?` (${fmt.format(pressurePa)} Pa)`:""}</span></div></div>
              <div className="detail-item"><div className="label">Wind</div><div className="value">{windMs!==null?`${fmt.format(Math.round(windMs))} m/s`:"--"}</div></div>
              <div className="detail-item"><div className="label">Coordinates</div><div className="value">{weather.location?.lat??"--"}, {weather.location?.lon??"--"}</div></div>
            </div>

            <footer className="card-footer">
              <small>Data from WeatherAPI.com</small>
              {iconUrl && <img className="ow-icon" alt={description||"weather icon"} src={iconUrl}/>}
            </footer>
          </section>
        )}
      </div>
    </div>
  );
}
