/* ------------------------------------------------------------------ */
/*  Weather Dashboard Card – standalone demo with fake data            */
/* ------------------------------------------------------------------ */

interface ForecastDay {
  name: string;
  icon: string;
  high: number;
  low: number;
}

interface WeatherData {
  city: string;
  date: string;
  temp: number;
  feelsLike: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  visibility: number;
  pressure: number;
  forecast: ForecastDay[];
}

const WEATHER_DATA: WeatherData = {
  city: '上海',
  date: '7月21日 周一',
  temp: 32,
  feelsLike: 36,
  condition: '多云转晴',
  icon: 'sun-cloud',
  humidity: 68,
  windSpeed: 14,
  uvIndex: 7,
  visibility: 12,
  pressure: 1013,
  forecast: [
    { name: '周二', icon: 'sun', high: 34, low: 25 },
    { name: '周三', icon: 'cloud-sun', high: 31, low: 24 },
    { name: '周四', icon: 'rain', high: 28, low: 22 },
    { name: '周五', icon: 'thunder', high: 27, low: 21 },
    { name: '周六', icon: 'sun', high: 33, low: 24 },
  ],
};

/* ── Inline SVG icons (no external deps) ────────────────────────── */

function SunIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="14" fill="#fbbf24" />
      <g stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round">
        <line x1="32" y1="4" x2="32" y2="12" />
        <line x1="32" y1="52" x2="32" y2="60" />
        <line x1="4" y1="32" x2="12" y2="32" />
        <line x1="52" y1="32" x2="60" y2="32" />
        <line x1="12.2" y1="12.2" x2="17.9" y2="17.9" />
        <line x1="46.1" y1="46.1" x2="51.8" y2="51.8" />
        <line x1="12.2" y1="51.8" x2="17.9" y2="46.1" />
        <line x1="46.1" y1="17.9" x2="51.8" y2="12.2" />
      </g>
    </svg>
  );
}

function SunCloudIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="48" cy="28" r="12" fill="#fbbf24" />
      <g stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
        <line x1="48" y1="8" x2="48" y2="13" />
        <line x1="48" y1="43" x2="48" y2="48" />
        <line x1="28" y1="28" x2="33" y2="28" />
        <line x1="63" y1="28" x2="68" y2="28" />
        <line x1="33.8" y1="13.8" x2="37.4" y2="17.4" />
        <line x1="58.6" y1="38.6" x2="62.2" y2="42.2" />
        <line x1="33.8" y1="42.2" x2="37.4" y2="38.6" />
        <line x1="58.6" y1="17.4" x2="62.2" y2="13.8" />
      </g>
      <path
        d="M20 58 C20 48, 28 40, 38 40 C40 34, 48 30, 54 34 C60 30, 70 34, 70 42 C76 44, 78 52, 72 56 L20 56 C14 56, 14 48, 20 58Z"
        fill="rgba(255,255,255,0.85)"
      />
    </svg>
  );
}

function CloudSunIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="34" cy="14" r="7" fill="#fbbf24" />
      <g stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round">
        <line x1="34" y1="3" x2="34" y2="6" />
        <line x1="34" y1="22" x2="34" y2="25" />
        <line x1="23" y1="14" x2="26" y2="14" />
        <line x1="42" y1="14" x2="45" y2="14" />
      </g>
      <path
        d="M12 40 C12 33, 18 28, 25 28 C26 24, 32 21, 36 24 C40 21, 47 24, 47 30 C50 31, 52 36, 48 39 L12 39 C8 39, 8 34, 12 40Z"
        fill="rgba(255,255,255,0.9)"
      />
    </svg>
  );
}

function RainIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M12 32 C12 24, 18 19, 26 19 C27 14, 34 10, 40 14 C44 10, 48 14, 48 20 C51 21, 52 26, 49 30 L12 30 C8 30, 8 25, 12 32Z"
        fill="rgba(200,210,230,0.9)"
      />
      <g stroke="#60a5fa" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="34" x2="16" y2="40" />
        <line x1="26" y1="34" x2="24" y2="42" />
        <line x1="34" y1="34" x2="32" y2="40" />
      </g>
    </svg>
  );
}

function ThunderIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M12 30 C12 22, 18 17, 26 17 C27 12, 34 8, 40 12 C44 8, 48 12, 48 18 C51 19, 52 24, 49 28 L12 28 C8 28, 8 23, 12 30Z"
        fill="rgba(160,174,210,0.9)"
      />
      <polygon points="28,30 22,38 26,38 24,46 34,36 29,36 32,30" fill="#fbbf24" />
    </svg>
  );
}

const ICON_MAP: Record<string, (props: { size?: number }) => JSX.Element> = {
  sun: SunIcon,
  'sun-cloud': SunCloudIcon,
  'cloud-sun': CloudSunIcon,
  rain: RainIcon,
  thunder: ThunderIcon,
};

function WeatherIcon({ type, size }: { type: string; size?: number }) {
  const Icon = ICON_MAP[type] ?? SunIcon;
  return <Icon size={size} />;
}

/* ── Metric icons (emoji) ───────────────────────────────────────── */

const METRICS = [
  { icon: '💧', label: '湿度', value: (d: WeatherData) => `${d.humidity}%` },
  { icon: '🌬️', label: '风速', value: (d: WeatherData) => `${d.windSpeed}` , unit: 'km/h' },
  { icon: '☀️', label: '紫外线', value: (d: WeatherData) => `${d.uvIndex}` , unit: '强' },
  { icon: '👁️', label: '能见度', value: (d: WeatherData) => `${d.visibility}` , unit: 'km' },
  { icon: '🧭', label: '气压', value: (d: WeatherData) => `${d.pressure}` , unit: 'hPa' },
  { icon: '🌡️', label: '体感', value: (d: WeatherData) => `${d.feelsLike}°` },
];

/* ── Component ──────────────────────────────────────────────────── */

export default function WeatherCard() {
  const d = WEATHER_DATA;

  return (
    <div className="weather-scene">
      <div className="weather-card">
        {/* Header */}
        <div className="weather-card-header">
          <div className="weather-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {d.city}
          </div>
          <div className="weather-date">{d.date}</div>
        </div>

        {/* Current */}
        <div className="weather-current">
          <div className="weather-current-left">
            <div className="weather-temp">
              <span className="weather-temp-num">{d.temp}</span>
              <span className="weather-temp-deg">°C</span>
            </div>
            <div className="weather-condition">{d.condition}</div>
            <div className="weather-feels">体感温度 {d.feelsLike}°C</div>
          </div>
          <div className="weather-current-right">
            <div className="weather-icon-large">
              <WeatherIcon type={d.icon} size={96} />
            </div>
          </div>
        </div>

        <div className="weather-divider" />

        {/* 5-Day Forecast */}
        <div className="weather-forecast">
          {d.forecast.map((day) => (
            <div className="weather-forecast-day" key={day.name}>
              <span className="weather-forecast-name">{day.name}</span>
              <span className="weather-forecast-icon">
                <WeatherIcon type={day.icon} size={28} />
              </span>
              <div className="weather-forecast-temps">
                <span className="weather-forecast-high">{day.high}°</span>
                <span className="weather-forecast-low">{day.low}°</span>
              </div>
            </div>
          ))}
        </div>

        <div className="weather-divider" />

        {/* Details Grid */}
        <div className="weather-details">
          {METRICS.map((m) => (
            <div className="weather-metric" key={m.label}>
              <span className="weather-metric-icon">{m.icon}</span>
              <span className="weather-metric-label">{m.label}</span>
              <span className="weather-metric-value">
                {m.value(d)}
                {m.unit && <span className="weather-metric-unit">{m.unit}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
