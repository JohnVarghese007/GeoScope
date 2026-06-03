import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Layer = 'crime' | 'weather' | 'economy'

//TODO IMPLEMENT HOVER COUNTRIES AND BORDERS

const LAYER_COLORS: Record<Layer, [string, string]> = {
    crime:   ['#f09595', '#e24b4a'],
    weather: ['#85b7eb', '#378add'],
    economy: ['#fac775', '#ef9f27'],
}

const MOCK_DATA: Record<Layer, Record<string, number>> = {
    crime: {
        'United States of America': 0.9, 'United Kingdom': 0.6, 'Mexico': 0.85,
        'Brazil': 0.75, 'India': 0.7, 'South Africa': 0.95,
        'Nigeria': 0.8, 'Morocco': 0.5, 'Honduras': 0.65,
        'Argentina': 0.6, 'Ethiopia': 0.72, 'Cameroon': 0.68,
    },
    weather: {
        'Iceland': 0.95, 'Norway': 0.9, 'United Arab Emirates': 0.88,
        'China': 0.7, 'Japan': 0.65, 'Australia': 0.75,
        'Germany': 0.5, 'Singapore': 0.8, 'Egypt': 0.85,
        'Brazil': 0.6, 'Russia': 0.55, 'Canada': 0.78,
    },
    economy: {
        'United States of America': 0.95, 'France': 0.85, 'Japan': 0.9,
        'United Kingdom': 0.88, 'China': 0.92, 'Singapore': 0.87,
        'Germany': 0.8, 'Spain': 0.7, 'Canada': 0.82,
        'Australia': 0.78, 'Russia': 0.65, 'India': 0.75,
    },
}

function interpolateColor(low: string, high: string, t: number): string {
    const r1 = parseInt(low.slice(1, 3), 16)
    const g1 = parseInt(low.slice(3, 5), 16)
    const b1 = parseInt(low.slice(5, 7), 16)
    const r2 = parseInt(high.slice(1, 3), 16)
    const g2 = parseInt(high.slice(3, 5), 16)
    const b2 = parseInt(high.slice(5, 7), 16)
    return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`
}

export default function Map() {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const geojsonLayerRef = useRef<L.GeoJSON | null>(null)
    const [activeLayer, setActiveLayer] = useState<Layer>('crime')
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
    const activeLayerRef = useRef<Layer>('crime')

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return

        const map = L.map(mapRef.current, {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 8,
            zoomControl: false,
        })
        mapInstanceRef.current = map

        // Dark tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '©OpenStreetMap ©CartoDB',
            subdomains: 'abcd',
        }).addTo(map)

        // Load GeoJSON borders
        fetch('/data/countries.geojson')
            .then(r => r.json())
            .then(data => {
                const geojsonLayer = L.geoJSON(data, {
                    style: () => ({
                        fillColor: '#1a2a3a',
                        fillOpacity: 0.6,
                        color: 'rgba(255,255,255,0.25)',
                        weight: 0.8,
                    }),
                    onEachFeature: (feature, layer) => {
                        const name =
                            feature.properties?.NAME ??
                            feature.properties?.name ??
                            'Unknown'

                        layer.on('mouseover', (e) => {
                            setHoveredCountry(name)
                            const l = e.target as L.Path
                            l.setStyle({ fillOpacity: 0.9, weight: 1.5, color: 'rgba(255,255,255,0.6)' })
                            l.bringToFront()
                        })

                        layer.on('mouseout', (e) => {
                            setHoveredCountry(null)
                            geojsonLayer.resetStyle(e.target)
                            applyHeatmapStyle(geojsonLayer, activeLayerRef.current)
                        })
                    },
                }).addTo(map)

                geojsonLayerRef.current = geojsonLayer
                applyHeatmapStyle(geojsonLayer, activeLayerRef.current)
            })

        return () => {
            map.remove()
            mapInstanceRef.current = null
        }
    }, [])

    const applyHeatmapStyle = (layer: L.GeoJSON, activeLayer: Layer) => {
        const data = MOCK_DATA[activeLayer]
        const [low, high] = LAYER_COLORS[activeLayer]

        layer.eachLayer((l) => {
            const feature = (l as L.GeoJSON & { feature: GeoJSON.Feature }).feature
            const name =
                feature?.properties?.NAME ??
                feature?.properties?.name ??
                ''
            const intensity = data[name]
            const fillColor = intensity != null
                ? interpolateColor(low, high, intensity)
                : '#1a2a3a'
            ;(l as L.Path).setStyle({
                fillColor,
                fillOpacity: intensity != null ? 0.75 : 0.3,
                color: 'rgba(255,255,255,0.2)',
                weight: 0.8,
            })
        })
    }

    const switchLayer = (layer: Layer) => {
        setActiveLayer(layer)
        activeLayerRef.current = layer
        if (geojsonLayerRef.current) {
            applyHeatmapStyle(geojsonLayerRef.current, layer)
        }
    }

    const layerColors: Record<Layer, string> = {
        crime: '#e24b4a',
        weather: '#378add',
        economy: '#ef9f27',
    }

    const layers: { key: Layer; label: string }[] = [
        { key: 'crime', label: 'Crime' },
        { key: 'weather', label: 'Weather' },
        { key: 'economy', label: 'Economy' },
    ]

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {/* Country tooltip */}
            {hoveredCountry && (
                <div style={{
                    position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(8,14,26,0.92)', border: '0.5px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px', padding: '6px 16px', color: '#e8edf5',
                    fontSize: '14px', fontWeight: 500, pointerEvents: 'none',
                    backdropFilter: 'blur(8px)', zIndex: 1000,
                }}>
                    {hoveredCountry}
                </div>
            )}

            {/* Layer switcher */}
            <div style={{
                position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: '8px', background: 'rgba(8,14,26,0.85)',
                border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '6px',
                backdropFilter: 'blur(8px)', zIndex: 1000,
            }}>
                {layers.map(({ key, label }) => (
                    <button key={key} onClick={() => switchLayer(key)} style={{
                        padding: '8px 20px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
                        background: activeLayer === key ? layerColors[key] : 'transparent',
                        color: activeLayer === key ? '#fff' : 'rgba(255,255,255,0.4)',
                    }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Legend */}
            <div style={{
                position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(8,14,26,0.7)', padding: '6px 14px', borderRadius: '99px',
                border: '0.5px solid rgba(255,255,255,0.08)', zIndex: 1000,
            }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Low</span>
                <div style={{
                    width: '80px', height: '5px', borderRadius: '99px',
                    background: `linear-gradient(to right, ${layerColors[activeLayer]}44, ${layerColors[activeLayer]})`,
                }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>High</span>
            </div>
        </div>
    )
}