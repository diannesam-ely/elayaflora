import { useMemo } from "react";
import { Platform, View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "@/src/theme";
import { BACKEND_URL } from "@/src/api";

/**
 * Self-updating live delivery map. Polls the public /tracking endpoint and
 * smoothly animates the rider pin toward the customer. The map itself stays
 * mounted (no tile reloads / flicker) because all updates happen inside the
 * embedded Leaflet script. Works in Expo Go (WebView) and web (iframe).
 */
export default function LiveTrackMap({
  orderId,
  riderEmoji = "🛵",
  height = "100%",
}: {
  orderId: string;
  riderEmoji?: string;
  height?: number | string;
}) {
  const html = useMemo(() => {
    const trackUrl = `${BACKEND_URL}/api/orders/${orderId}/tracking`;
    return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{height:100%;margin:0;padding:0;background:#FDE8EE;}
.pin{font-size:30px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));transition:transform .2s}</style>
</head><body><div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var URLT=${JSON.stringify(trackUrl)};
var map=L.map('m',{zoomControl:false,attributionControl:false}).setView([14.3419,121.0803],14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
var riderIcon=L.divIcon({html:'<div class="pin">${riderEmoji}</div>',className:'',iconSize:[32,32],iconAnchor:[16,30]});
var destIcon=L.divIcon({html:'<div class="pin">📍</div>',className:'',iconSize:[30,30],iconAnchor:[15,28]});
var rider=null,destM=null,line=null,cur=null,dest=null,fitted=false;
function ease(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}
function moveTo(target){
  if(!rider)return;
  if(!cur){cur={lat:target.lat,lng:target.lng};rider.setLatLng([cur.lat,cur.lng]);return;}
  var from={lat:cur.lat,lng:cur.lng},start=performance.now(),dur=2600;
  function step(now){var t=Math.min(1,(now-start)/dur),e=ease(t);
    var la=from.lat+(target.lat-from.lat)*e,ln=from.lng+(target.lng-from.lng)*e;
    cur={lat:la,lng:ln};rider.setLatLng([la,ln]);
    if(line&&dest){line.setLatLngs([[la,ln],[dest.lat,dest.lng]]);}
    if(t<1)requestAnimationFrame(step);}
  requestAnimationFrame(step);
}
function poll(){
  fetch(URLT).then(function(r){return r.json();}).then(function(d){
    if(d.lat==null)return;
    if(!dest){
      dest={lat:d.dest_lat,lng:d.dest_lng};
      destM=L.marker([dest.lat,dest.lng],{icon:destIcon}).addTo(map).bindPopup('Delivery address');
      rider=L.marker([d.lat,d.lng],{icon:riderIcon}).addTo(map).bindPopup('Rider');
      line=L.polyline([[d.lat,d.lng],[dest.lat,dest.lng]],{color:'#FF758C',weight:4,dashArray:'8,8'}).addTo(map);
      cur={lat:d.lat,lng:d.lng};
    }else{moveTo({lat:d.lat,lng:d.lng});}
    if(!fitted){try{var g=L.featureGroup([L.marker([d.lat,d.lng]),L.marker([dest.lat,dest.lng])]);map.fitBounds(g.getBounds().pad(0.6));}catch(e){}fitted=true;}
  }).catch(function(e){});
}
poll();setInterval(poll,3500);
</script></body></html>`;
  }, [orderId, riderEmoji]);

  return (
    <View style={[styles.wrap, { height: height as any }]}>
      {Platform.OS === "web" ? (
        <iframe title="live-map" srcDoc={html} style={{ width: "100%", height: "100%", border: 0 }} />
      ) : (
        <WebView originWhitelist={["*"]} source={{ html }} style={{ flex: 1, backgroundColor: colors.surfaceTertiary }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { width: "100%", backgroundColor: colors.surfaceTertiary, overflow: "hidden" } });
