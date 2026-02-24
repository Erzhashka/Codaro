import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import {
  Mountain,
  Thermometer,
  TriangleAlert,
  Users,
  Gauge,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react";

const TerrainMap = lazy(() => import("./components/TerrainMap"));

// ── Types ──────────────────────────────────────────────

interface RescueData {
  // Environment
  altitude: string;
  temperature: string;
  windSpeed: string;
  visibility: string;
  weatherCondition: string;
  recentSnowfall: string;
  slopeAngle: string;
  // Patient(s)
  numberOfPeople: string;
  weight: string;
  height: string;
  healthProblems: string;
  estimatedDuration: string;
}

// ── Helpers ────────────────────────────────────────────

function avalancheRisk(snow: number, slope: number, wind: number, temp: number): { level: string; pct: number; color: string } {
  let score = 0;
  if (snow > 30) score += 35;
  else if (snow > 15) score += 22;
  else if (snow > 5) score += 10;
  if (slope >= 35 && slope <= 45) score += 30;
  else if (slope >= 30) score += 20;
  else if (slope >= 25) score += 10;
  if (wind > 60) score += 20;
  else if (wind > 30) score += 12;
  else if (wind > 15) score += 5;
  if (temp > 0) score += 15;
  else if (temp > -5) score += 8;
  score = Math.min(100, Math.max(0, score));

  let level = "LOW";
  let color = "text-green-400";
  if (score >= 75) { level = "EXTREME"; color = "text-red-500"; }
  else if (score >= 50) { level = "HIGH"; color = "text-orange-400"; }
  else if (score >= 25) { level = "MODERATE"; color = "text-yellow-400"; }
  return { level, pct: score, color };
}

function oxygenCalc(altitude: number, people: number, durationMin: number) {
  // Supplemental O₂ needed above ~2400m. Flow rate increases with altitude.
  if (altitude < 2400) return { flowRate: 0, totalLiters: 0, note: "Not required below 2400m" };
  let flowRate = 2; // L/min base
  if (altitude > 5000) flowRate = 6;
  else if (altitude > 4000) flowRate = 4;
  else if (altitude > 3000) flowRate = 3;
  const totalLiters = flowRate * durationMin * people;
  return { flowRate, totalLiters, note: `${flowRate} L/min × ${people} per × ${durationMin} min` };
}

// ── Components ─────────────────────────────────────────

function Field({ label, unit, value, onChange, id }: { label: string; unit?: string; value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-neutral-500 text-xs uppercase tracking-wider shrink-0">{label}</label>
      <div className="flex items-center gap-1">
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-right tabular-nums"
          step="any"
        />
        {unit && <span className="text-neutral-600 text-xs w-8">{unit}</span>}
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children, accent = "border-neutral-800" }: { title: string; icon: typeof Mountain; children: React.ReactNode; accent?: string }) {
  return (
    <div className={`border ${accent} bg-neutral-900/60 rounded-lg p-3 space-y-3`}>
      <div className="flex items-center gap-2 text-neutral-400 border-b border-neutral-800 pb-2">
        <Icon size={14} />
        <span className="text-xs font-semibold uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  );
}

function RiskBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          color === "text-red-500" ? "bg-red-500" :
          color === "text-orange-400" ? "bg-orange-400" :
          color === "text-yellow-400" ? "bg-yellow-400" : "bg-green-400"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Stat({ label, value, unit, color = "text-white" }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div>
      <div className="text-neutral-500 text-[10px] uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${color}`}>
        {value}{unit && <span className="text-xs font-normal text-neutral-500 ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────

export default function App() {
  const [data, setData] = useState<RescueData>({
    altitude: "3200",
    temperature: "-8",
    windSpeed: "25",
    visibility: "200",
    weatherCondition: "snow",
    recentSnowfall: "20",
    slopeAngle: "32",
    numberOfPeople: "1",
    weight: "75",
    height: "175",
    healthProblems: "",
    estimatedDuration: "45",
  });

  const set = (key: keyof RescueData) => (value: string) => setData((d) => ({ ...d, [key]: value }));

  const avRisk = useMemo(() =>
    avalancheRisk(
      parseFloat(data.recentSnowfall) || 0,
      parseFloat(data.slopeAngle) || 0,
      parseFloat(data.windSpeed) || 0,
      parseFloat(data.temperature) || 0,
    ), [data.recentSnowfall, data.slopeAngle, data.windSpeed, data.temperature]
  );

  const o2 = useMemo(() =>
    oxygenCalc(
      parseFloat(data.altitude) || 0,
      parseInt(data.numberOfPeople) || 1,
      parseFloat(data.estimatedDuration) || 30,
    ), [data.altitude, data.numberOfPeople, data.estimatedDuration]
  );

  // ── Audio narration ──
  const [audioOn, setAudioOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [intervalSec, setIntervalSec] = useState(15);

  const buildNarration = useCallback(() => {
    const lines: string[] = [];
    lines.push(`Altitude is ${data.altitude} meters.`);
    lines.push(`Temperature is ${data.temperature} degrees celsius.`);
    lines.push(`Wind speed is ${data.windSpeed} kilometers per hour.`);
    lines.push(`Visibility is ${data.visibility} meters.`);
    lines.push(`Weather conditions are ${data.weatherCondition}.`);
    lines.push(`Avalanche risk is ${avRisk.level}, at ${avRisk.pct} percent.`);
    lines.push(`There ${parseInt(data.numberOfPeople) === 1 ? "is" : "are"} ${data.numberOfPeople} ${parseInt(data.numberOfPeople) === 1 ? "person" : "people"}.`);
    lines.push(`Weight is ${data.weight} kilograms, height is ${data.height} centimeters.`);
    if (data.healthProblems.trim()) lines.push(`Health problems include ${data.healthProblems}.`);
    lines.push(`Oxygen required is ${o2.totalLiters} liters, at a flow rate of ${o2.flowRate} liters per minute.`);
    return lines.join(" ");
  }, [data, avRisk, o2]);

  const speak = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(buildNarration());
    // Natural female voice
    utterance.rate = 1;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    // Pick a female English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /samantha/i.test(v.name) && /en/i.test(v.lang))
      || voices.find(v => /victoria|karen|tessa|fiona|moira|kate/i.test(v.name) && /en/i.test(v.lang))
      || voices.find(v => /female/i.test(v.name) && /en/i.test(v.lang))
      || voices.find(v => /en-US|en-GB/i.test(v.lang));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [buildNarration]);

  useEffect(() => {
    if (audioOn) {
      speak();
      intervalRef.current = setInterval(speak, intervalSec * 1000);
    } else {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      window.speechSynthesis?.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [audioOn, intervalSec, speak]);

  const now = new Date();
  const timestamp = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " " + now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const [mapOpen, setMapOpen] = useState(true);

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT: 3D Terrain Map ── */}
      <div className={`transition-all duration-300 shrink-0 ${
        mapOpen ? "w-[420px]" : "w-0"
      } relative`}>
        {mapOpen && (
          <div className="h-screen sticky top-0 p-2 pr-0">
            <div className="h-full relative">
              <Suspense fallback={
                <div className="w-full h-full rounded-lg border border-neutral-800 bg-neutral-950 flex items-center justify-center text-neutral-600 text-xs">
                  Loading 3D terrain...
                </div>
              }>
                <TerrainMap endAltitude={parseFloat(data.altitude) || 3200} />
              </Suspense>
            </div>
          </div>
        )}
        <button
          onClick={() => setMapOpen(!mapOpen)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-30 bg-neutral-800 border border-neutral-700 rounded-full w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-white text-xs transition"
          title={mapOpen ? "Hide map" : "Show map"}
        >
          {mapOpen ? "◀" : "▶"}
        </button>
      </div>

      {/* ── RIGHT: Dashboard ── */}
      <div className="flex-1 min-w-0 p-3 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-4">
        <div className="flex items-center gap-2">
          <Mountain size={18} className="text-amber-500" />
          <h1 className="text-sm font-bold uppercase tracking-widest text-neutral-200">Mountain Rescue Dispatch</h1>
        </div>
        <div className="flex items-center gap-3 text-neutral-500 text-xs tabular-nums">
          <Clock size={12} />
          <span>{timestamp}</span>
        </div>
      </header>

      {/* ── Summary strip (top) ── */}
      <div className="mb-4 border border-neutral-800 rounded-lg bg-neutral-900/60 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <div className="text-neutral-500 text-xs uppercase tracking-wider">Altitude</div>
            <div className={`text-2xl font-bold tabular-nums ${parseFloat(data.altitude) > 4000 ? "text-red-400" : parseFloat(data.altitude) > 3000 ? "text-amber-400" : "text-white"}`}>
              {data.altitude || "—"}<span className="text-sm font-normal text-neutral-500 ml-1">m</span>
            </div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs uppercase tracking-wider">Avalanche</div>
            <div className={`text-2xl font-bold tabular-nums ${avRisk.color}`}>
              {avRisk.level}<span className="text-sm font-normal text-neutral-500 ml-1">{avRisk.pct}%</span>
            </div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs uppercase tracking-wider">People</div>
            <div className="text-2xl font-bold tabular-nums text-white">
              {data.numberOfPeople || "—"}<span className="text-sm font-normal text-neutral-500 ml-1">per</span>
            </div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs uppercase tracking-wider">O2 needed</div>
            <div className={`text-2xl font-bold tabular-nums ${o2.totalLiters > 0 ? "text-cyan-400" : "text-neutral-500"}`}>
              {o2.totalLiters}<span className="text-sm font-normal text-neutral-500 ml-1">L</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid — 3 columns: Patient | Weather (center, large) | Oxygen */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr_1fr] gap-3">

        {/* ── LEFT: Patient ── */}
        <div className="space-y-3">
          <Card title="Patient Information" icon={Users}>
            <Field label="Number of people" unit="per" value={data.numberOfPeople} onChange={set("numberOfPeople")} id="pax" />
            <Field label="Weight" unit="kg" value={data.weight} onChange={set("weight")} id="wt" />
            <Field label="Height" unit="cm" value={data.height} onChange={set("height")} id="ht" />
            <div>
              <label htmlFor="hp" className="text-neutral-500 text-[10px] uppercase tracking-wider block mb-1">Health problems / injuries</label>
              <textarea
                id="hp"
                rows={3}
                value={data.healthProblems}
                onChange={(e) => set("healthProblems")(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 rounded px-2 py-1.5 text-sm font-mono resize-none"
                placeholder="e.g. hypothermia, fractured tibia, AMS..."
              />
            </div>
          </Card>
        </div>

        {/* ── CENTER: Altitude & Weather + Avalanche (bigger) ── */}
        <div className="space-y-3">
          <Card title="Altitude & Weather" icon={Thermometer}>
            <div className="space-y-4">
              <Field label="Altitude" unit="m" value={data.altitude} onChange={set("altitude")} id="alt" />
              <Field label="Temperature" unit="°C" value={data.temperature} onChange={set("temperature")} id="temp" />
              <Field label="Wind speed" unit="km/h" value={data.windSpeed} onChange={set("windSpeed")} id="wind" />
              <Field label="Visibility" unit="m" value={data.visibility} onChange={set("visibility")} id="vis" />
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="wx" className="text-neutral-500 text-xs uppercase tracking-wider shrink-0">Conditions</label>
                <select
                  id="wx"
                  value={data.weatherCondition}
                  onChange={(e) => set("weatherCondition")(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 text-neutral-100 rounded px-2 py-1.5 text-sm font-mono"
                >
                  <option value="clear">Clear</option>
                  <option value="cloudy">Cloudy</option>
                  <option value="rain">Rain</option>
                  <option value="snow">Snow</option>
                  <option value="blizzard">Blizzard</option>
                  <option value="fog">Fog</option>
                </select>
              </div>
            </div>
          </Card>

          <Card title="Avalanche Assessment" icon={TriangleAlert} accent={
            avRisk.pct >= 75 ? "border-red-500/50" :
            avRisk.pct >= 50 ? "border-orange-400/50" :
            avRisk.pct >= 25 ? "border-yellow-400/50" : "border-neutral-800"
          }>
            <Field label="Recent snowfall" unit="cm" value={data.recentSnowfall} onChange={set("recentSnowfall")} id="snow" />
            <Field label="Slope angle" unit="°" value={data.slopeAngle} onChange={set("slopeAngle")} id="slope" />
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-neutral-500 text-xs uppercase tracking-wider">Risk level</span>
                <span className={`text-sm font-bold ${avRisk.color}`}>{avRisk.level} ({avRisk.pct}%)</span>
              </div>
              <RiskBar pct={avRisk.pct} color={avRisk.color} />
            </div>
          </Card>
        </div>

        {/* ── RIGHT: Oxygen ── */}
        <div className="space-y-3">
          <Card title="Oxygen Requirements" icon={Gauge} accent="border-cyan-500/30">
            <Field label="Est. rescue duration" unit="min" value={data.estimatedDuration} onChange={set("estimatedDuration")} id="dur" />
            <div className="grid grid-cols-3 gap-3 pt-1 border-t border-neutral-800">
              <Stat label="Flow rate" value={o2.flowRate} unit="L/min" color={o2.flowRate > 0 ? "text-cyan-400" : "text-neutral-500"} />
              <Stat label="Total O₂" value={o2.totalLiters} unit="L" color={o2.totalLiters > 0 ? "text-cyan-400" : "text-neutral-500"} />
              <Stat label="Bottles (~)" value={o2.totalLiters > 0 ? Math.ceil(o2.totalLiters / 660) : 0} unit="x D" color={o2.totalLiters > 0 ? "text-cyan-400" : "text-neutral-500"} />
            </div>
            <div className="text-neutral-600 text-[10px]">{o2.note}</div>
          </Card>
        </div>
      </div>

      {/* ── Audio narration panel ── */}
      <div className="fixed right-4 bottom-4 z-50">
        <div className={`border border-neutral-800 rounded-lg bg-neutral-900/95 backdrop-blur-sm p-4 space-y-3 transition-all ${
          audioOn ? "w-52" : "w-auto"
        }`}>
          <button
            onClick={() => setAudioOn(!audioOn)}
            className={`w-full flex items-center justify-center gap-3 rounded-lg p-4 text-sm font-bold uppercase tracking-wider transition ${
              audioOn
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-neutral-200"
            }`}
            title={audioOn ? "Stop audio" : "Start audio narration"}
          >
            {audioOn ? <VolumeX size={24} /> : <Volume2 size={24} />}
            {audioOn && <span>Stop</span>}
          </button>

          {audioOn && (
            <>
              <button
                onClick={speak}
                className="w-full flex items-center justify-center gap-2 rounded p-2 text-xs bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition"
              >
                {speaking ? <Pause size={12} /> : <Play size={12} />}
                <span>{speaking ? "Speaking..." : "Play now"}</span>
              </button>

              <div>
                <label className="text-neutral-500 text-[10px] uppercase tracking-wider block mb-1">Repeat every</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Math.max(5, parseInt(e.target.value) || 15))}
                    className="w-14 text-center text-xs"
                  />
                  <span className="text-neutral-600 text-[10px]">sec</span>
                </div>
              </div>

              <div className={`w-2 h-2 rounded-full mx-auto ${
                speaking ? "bg-green-400 animate-pulse" : "bg-neutral-600"
              }`} />
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
