import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import Map, {
  Source,
  Layer,
  Marker,
  NavigationControl,
  ScaleControl,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// ══════════════════════════════════════════════════════
//  Mont Blanc — Goûter Route (Voie Royale)
//  Real GPS waypoints plotted on high-res terrain tiles,
//  Strava-style.
// ══════════════════════════════════════════════════════

const WAYPOINTS = [
  { name: "Nid d'Aigle",       alt: 2372, lat: 45.8650, lon: 6.7950, type: "start"   },
  { name: "Tête Rousse Hut",   alt: 3167, lat: 45.8570, lon: 6.8170, type: "hut"     },
  { name: "Grand Couloir",     alt: 3340, lat: 45.8545, lon: 6.8230, type: "danger"   },
  { name: "Goûter Refuge",     alt: 3817, lat: 45.8520, lon: 6.8290, type: "hut"     },
  { name: "Dôme du Goûter",    alt: 4304, lat: 45.8400, lon: 6.8450, type: "peak"    },
  { name: "Vallot Refuge",     alt: 4362, lat: 45.8370, lon: 6.8520, type: "hut"     },
  { name: "Bosses Ridge",      alt: 4547, lat: 45.8345, lon: 6.8580, type: "ridge"   },
  { name: "Mont Blanc Summit", alt: 4808, lat: 45.8326, lon: 6.8652, type: "summit"  },
];

// Full route line (more points for a smoother path between waypoints)
const ROUTE_COORDS: [number, number][] = [
  [6.7950, 45.8650], // Nid d'Aigle
  [6.7990, 45.8640],
  [6.8030, 45.8625],
  [6.8060, 45.8610],
  [6.8095, 45.8600],
  [6.8130, 45.8585],
  [6.8170, 45.8570], // Tête Rousse
  [6.8190, 45.8560],
  [6.8210, 45.8555],
  [6.8230, 45.8545], // Grand Couloir
  [6.8245, 45.8540],
  [6.8260, 45.8535],
  [6.8275, 45.8530],
  [6.8290, 45.8520], // Goûter Refuge
  [6.8310, 45.8505],
  [6.8340, 45.8485],
  [6.8370, 45.8465],
  [6.8400, 45.8445],
  [6.8430, 45.8425],
  [6.8450, 45.8400], // Dôme du Goûter
  [6.8470, 45.8390],
  [6.8490, 45.8380],
  [6.8520, 45.8370], // Vallot
  [6.8540, 45.8362],
  [6.8560, 45.8355],
  [6.8580, 45.8345], // Bosses Ridge
  [6.8600, 45.8340],
  [6.8620, 45.8335],
  [6.8640, 45.8330],
  [6.8652, 45.8326], // Summit
];

// GeoJSON for the full route
const routeGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "LineString", coordinates: ROUTE_COORDS },
      properties: { section: "full" },
    },
  ],
};

// Danger section GeoJSON (Grand Couloir area)
const dangerGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: ROUTE_COORDS.slice(6, 13), // Tête Rousse → Goûter
      },
      properties: { section: "danger" },
    },
  ],
};

// Interpolate a point along the route at a given altitude
function getPointAtAltitude(alt: number): [number, number] {
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = WAYPOINTS[i], b = WAYPOINTS[i + 1];
    if (alt >= a.alt && alt <= b.alt) {
      const t = (alt - a.alt) / (b.alt - a.alt);
      return [a.lon + (b.lon - a.lon) * t, a.lat + (b.lat - a.lat) * t];
    }
  }
  if (alt <= WAYPOINTS[0].alt) return [WAYPOINTS[0].lon, WAYPOINTS[0].lat];
  const last = WAYPOINTS[WAYPOINTS.length - 1];
  return [last.lon, last.lat];
}

// Marker colors by type
const TYPE_COLORS: Record<string, string> = {
  start: "#22c55e",
  hut: "#f59e0b",
  danger: "#ef4444",
  peak: "#a3a3a3",
  ridge: "#a3a3a3",
  summit: "#60a5fa",
};

// Dark outdoor map style — using OpenFreeMap (free, no API key)
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// ── Waypoint dot component ────────────────────────────

function WaypointDot({
  wp,
  isHovered,
  onHover,
  onLeave,
}: {
  wp: (typeof WAYPOINTS)[0];
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const color = TYPE_COLORS[wp.type] || "#a3a3a3";
  const isBig = wp.type === "start" || wp.type === "summit";

  return (
    <Marker longitude={wp.lon} latitude={wp.lat} anchor="center">
      <div
        className="relative cursor-pointer"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        {/* Outer glow */}
        <div
          className="absolute rounded-full opacity-30 animate-ping"
          style={{
            width: isBig ? 24 : 16,
            height: isBig ? 24 : 16,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: color,
            display: wp.type === "danger" || isBig ? "block" : "none",
          }}
        />
        {/* Main dot */}
        <div
          className="rounded-full border-2 border-neutral-900 shadow-lg transition-transform"
          style={{
            width: isBig ? 16 : wp.type === "danger" ? 14 : 10,
            height: isBig ? 16 : wp.type === "danger" ? 14 : 10,
            backgroundColor: color,
            transform: isHovered ? "scale(1.5)" : "scale(1)",
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
        {/* Label tooltip */}
        {isHovered && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 rounded px-2 py-1 text-[10px] text-neutral-200 shadow-xl z-50 pointer-events-none">
            <div className="font-bold" style={{ color }}>{wp.name}</div>
            <div className="text-neutral-400">{wp.alt.toLocaleString()} m</div>
          </div>
        )}
      </div>
    </Marker>
  );
}

// ── Main export ───────────────────────────────────────

interface TerrainMapProps {
  startAltitude?: number;
  endAltitude?: number;
}

export default function TerrainMap({ endAltitude = 3200 }: TerrainMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoveredWp, setHoveredWp] = useState<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const rescuePoint = useMemo(() => getPointAtAltitude(endAltitude), [endAltitude]);

  // Fly to rescue point when altitude changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.flyTo({
      center: rescuePoint,
      zoom: 14,
      duration: 1200,
      essential: true,
    });
  }, [rescuePoint, mapLoaded]);

  const onLoad = useCallback(() => setMapLoaded(true), []);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 relative">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 6.835,
          latitude: 45.848,
          zoom: 13.2,
          pitch: 55,
          bearing: -30,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        terrain={{ source: "terrain", exaggeration: 1.5 }}
        maxPitch={75}
        onLoad={onLoad}
      >
        {/* Terrain source for 3D relief */}
        <Source
          id="terrain"
          type="raster-dem"
          tiles={["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"]}
          encoding="terrarium"
          tileSize={256}
          maxzoom={15}
        />

        {/* Hillshade for depth */}
        <Source
          id="hillshade-src"
          type="raster-dem"
          tiles={["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"]}
          encoding="terrarium"
          tileSize={256}
          maxzoom={15}
        >
          <Layer
            id="hillshade"
            type="hillshade"
            paint={{
              "hillshade-exaggeration": 0.5,
              "hillshade-shadow-color": "#1a1a2e",
              "hillshade-highlight-color": "#ffffff",
              "hillshade-accent-color": "#4a90d9",
            }}
          />
        </Source>

        {/* Full route line */}
        <Source id="route" type="geojson" data={routeGeoJSON}>
          {/* Glow layer */}
          <Layer
            id="route-glow"
            type="line"
            paint={{
              "line-color": "#f59e0b",
              "line-width": 8,
              "line-opacity": 0.25,
              "line-blur": 4,
            }}
          />
          {/* Main line */}
          <Layer
            id="route-line"
            type="line"
            paint={{
              "line-color": "#f59e0b",
              "line-width": 3,
              "line-opacity": 0.9,
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
            }}
          />
        </Source>

        {/* Danger section overlay */}
        <Source id="danger" type="geojson" data={dangerGeoJSON}>
          <Layer
            id="danger-line"
            type="line"
            paint={{
              "line-color": "#ef4444",
              "line-width": 4,
              "line-opacity": 0.8,
              "line-dasharray": [2, 1.5],
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
            }}
          />
        </Source>

        {/* Waypoint markers */}
        {WAYPOINTS.map((wp, i) => (
          <WaypointDot
            key={i}
            wp={wp}
            isHovered={hoveredWp === i}
            onHover={() => setHoveredWp(i)}
            onLeave={() => setHoveredWp(null)}
          />
        ))}

        {/* Rescue marker */}
        <Marker longitude={rescuePoint[0]} latitude={rescuePoint[1]} anchor="bottom">
          <div className="flex flex-col items-center animate-bounce">
            <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg mb-1 whitespace-nowrap border border-red-400">
              ⚠ RESCUE · {endAltitude.toLocaleString()}m
            </div>
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" style={{ boxShadow: "0 0 12px #ef4444" }} />
            <div className="w-0.5 h-3 bg-red-500" />
          </div>
        </Marker>

        <NavigationControl position="top-right" showCompass showZoom visualizePitch />
        <ScaleControl position="bottom-right" />
      </Map>

      {/* Route info overlay */}
      <div className="absolute top-2 left-2 bg-neutral-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-[10px] text-neutral-300 leading-relaxed shadow-xl border border-neutral-800">
        <div className="font-bold text-amber-400 text-[12px]">Mont Blanc — Goûter Route</div>
        <div className="text-neutral-500 mt-0.5">4 808 m · Chamonix, France</div>
        <div className="text-neutral-600 mt-1 flex gap-3">
          <span>↑ {(4808 - 2372).toLocaleString()}m gain</span>
          <span>~12 km</span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-2 bg-neutral-900/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-[10px] text-neutral-400 flex flex-wrap gap-x-3 gap-y-1 shadow-xl border border-neutral-800">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block shadow-[0_0_4px_#22c55e]" /> Start
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-[0_0_4px_#f59e0b]" /> Refuge
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-[0_0_4px_#ef4444]" /> Danger
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block shadow-[0_0_4px_#60a5fa]" /> Summit
        </span>
      </div>
    </div>
  );
}