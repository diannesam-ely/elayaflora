import { Platform, View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "@/src/theme";

export type MapMarker = { lat: number; lng: number; emoji?: string; label?: string };

/** Lightweight map (OpenStreetMap via Leaflet) that works in Expo Go, native and web.
 * Swap the tile layer / add a Google Maps key later without touching callers. */
export default function MapView({
  markers = [],
  line,
  height = "100%",
  zoom = 14,
}: {
  markers?: MapMarker[];
  line?: { from: MapMarker; to: MapMarker };
  height?: number | string;
  zoom?: number;
}) {
  const pts = markers.length ? markers : [{ lat: 14.3419, lng: 121.0803, emoji: "📍" }];
  const centerLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const centerLng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;

  const markersJs = pts
    .map(
      (m) =>
        `L.marker([${m.lat},${m.lng}],{icon:L.divIcon({html:'<div style="font-size:28px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">${m.emoji || "📍"}</div>',className:'',iconSize:[30,30],iconAnchor:[15,28]})})` +
        `.addTo(map)${m.label ? `.bindPopup(${JSON.stringify(m.label)})` : ""};`,
    )
    .join("\n");

  const lineJs = line
    ? `var pl=L.polyline([[${line.from.lat},${line.from.lng}],[${line.to.lat},${line.to.lng}]],{color:'#FF758C',weight:4,dashArray:'8,8'}).addTo(map);map.fitBounds(pl.getBounds().pad(0.5));`
    : `var g=L.featureGroup([${pts.map((p) => `L.marker([${p.lat},${p.lng}])`).join(",")}]);map.fitBounds(g.getBounds().pad(0.4));`;

  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{height:100%;margin:0;padding:0;background:#FDE8EE;}</style></head><body>
<div id="m"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
var map=L.map('m',{zoomControl:false,attributionControl:false}).setView([${centerLat},${centerLng}],${zoom});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
${markersJs}
try{${lineJs}}catch(e){}
</script></body></html>`;

  return (
    <View style={[styles.wrap, { height: height as any }]}>
      {Platform.OS === "web" ? (
        <iframe title="map" srcDoc={html} style={{ width: "100%", height: "100%", border: 0 }} />
      ) : (
        <WebView originWhitelist={["*"]} source={{ html }} style={{ flex: 1, backgroundColor: colors.surfaceTertiary }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { width: "100%", backgroundColor: colors.surfaceTertiary, overflow: "hidden" } });
