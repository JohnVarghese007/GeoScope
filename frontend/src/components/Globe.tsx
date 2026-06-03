import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'
import type { FeatureCollection, Feature, Geometry, Polygon, MultiPolygon } from 'geojson'


declare global {
    interface Window {
        __buildMarkers?: (layer: Layer) => void
    }
}

// ── Border drawing ───────────────────────────────────────────────
function addBorders(group: THREE.Group, geojson: FeatureCollection) {
    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
    })
    geojson.features.forEach((feature) => {
        const geom = feature.geometry
        const polys =
            geom.type === 'Polygon'
                ? [geom.coordinates]
                : geom.type === 'MultiPolygon'
                    ? geom.coordinates
                    : []
        polys.forEach((poly) =>
            poly.forEach((ring) => {
                const pts = ring.map(([lng, lat]) => latLngToVec3(lat, lng, 1.002))
                group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material))
            })
        )
    })
}

//  Coordinate helper
function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    )
}

function vec3ToLatLng(v: THREE.Vector3): { lat: number; lng: number } {
    const lat = 90 - Math.acos(v.y) * (180 / Math.PI)
    const lng = (Math.atan2(v.z, -v.x) * (180 / Math.PI)) - 180
    return { lat, lng: lng < -180 ? lng + 360 : lng }
}

function getCountryAtPoint(
    lat: number,
    lng: number,
    features: Feature<Geometry>[]
): string | null {
    const pt = point([lng, lat])
    for (const feature of features) {
        const geom = feature.geometry
        if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') continue
        try {
            const typedFeature = feature as Feature<Polygon | MultiPolygon>
            if (booleanPointInPolygon(pt, typedFeature)) {
                return (
                    (feature.properties?.NAME as string | undefined) ??
                    (feature.properties?.name as string | undefined) ??
                    null
                )
            }
        } catch {
            continue
        }
    }
    return null
}

//  Layer data
type Layer = 'crime' | 'weather' | 'economy'

const MOCK_DATA: Record<Layer, { lat: number; lng: number; intensity: number }[]> = {
    crime: [
        { lat: 40.7, lng: -74.0, intensity: 0.9 },
        { lat: 51.5, lng: -0.1, intensity: 0.6 },
        { lat: 19.4, lng: -99.1, intensity: 0.85 },
        { lat: -23.5, lng: -46.6, intensity: 0.75 },
        { lat: 28.6, lng: 77.2, intensity: 0.7 },
        { lat: -26.2, lng: 28.0, intensity: 0.95 },
        { lat: 6.5, lng: 3.4, intensity: 0.8 },
        { lat: 33.9, lng: -6.9, intensity: 0.5 },
        { lat: 14.1, lng: -87.2, intensity: 0.65 },
        { lat: -34.6, lng: -58.4, intensity: 0.6 },
        { lat: 9.0, lng: 38.7, intensity: 0.72 },
        { lat: 3.8, lng: 11.5, intensity: 0.68 },
    ],
    weather: [
        { lat: 64.1, lng: -21.9, intensity: 0.95 },
        { lat: 71.2, lng: 25.8, intensity: 0.9 },
        { lat: -77.8, lng: 166.6, intensity: 1.0 },
        { lat: 25.2, lng: 55.3, intensity: 0.88 },
        { lat: 23.1, lng: 113.3, intensity: 0.7 },
        { lat: 35.7, lng: 139.7, intensity: 0.65 },
        { lat: -33.9, lng: 151.2, intensity: 0.75 },
        { lat: 52.5, lng: 13.4, intensity: 0.5 },
        { lat: 1.3, lng: 103.8, intensity: 0.8 },
        { lat: 30.0, lng: 31.2, intensity: 0.85 },
        { lat: -22.9, lng: -43.2, intensity: 0.6 },
        { lat: 55.7, lng: 37.6, intensity: 0.55 },
    ],
    economy: [
        { lat: 37.8, lng: -122.4, intensity: 0.95 },
        { lat: 48.9, lng: 2.3, intensity: 0.85 },
        { lat: 35.7, lng: 139.7, intensity: 0.9 },
        { lat: 51.5, lng: -0.1, intensity: 0.88 },
        { lat: 22.3, lng: 114.2, intensity: 0.92 },
        { lat: 1.3, lng: 103.8, intensity: 0.87 },
        { lat: 52.5, lng: 13.4, intensity: 0.8 },
        { lat: 40.4, lng: -3.7, intensity: 0.7 },
        { lat: 45.5, lng: -73.6, intensity: 0.82 },
        { lat: -33.9, lng: 151.2, intensity: 0.78 },
        { lat: 55.7, lng: 37.6, intensity: 0.65 },
        { lat: 28.6, lng: 77.2, intensity: 0.75 },
    ],
}

const LAYER_COLORS: Record<Layer, { low: THREE.Color; high: THREE.Color }> = {
    crime:   { low: new THREE.Color(0xf09595), high: new THREE.Color(0xe24b4a) },
    weather: { low: new THREE.Color(0x85b7eb), high: new THREE.Color(0x378add) },
    economy: { low: new THREE.Color(0xfac775), high: new THREE.Color(0xef9f27) },
}

export default function Globe() {
    const mountRef = useRef<HTMLDivElement>(null)
    const [activeLayer, setActiveLayer] = useState<Layer>('crime')
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
    const activeLayerRef = useRef<Layer>('crime')
    const markersGroupRef = useRef<THREE.Group | null>(null)
    const geojsonRef = useRef<FeatureCollection | null>(null)
    const globeGroupRef = useRef<THREE.Group | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const globeMeshRef = useRef<THREE.Mesh | null>(null)

    useEffect(() => {
        const mount = mountRef.current!
        const width = mount.clientWidth
        const height = mount.clientHeight

        // Scene
        const scene = new THREE.Scene()

        // Stars
        const starPos = new Float32Array(8000 * 3)
        for (let i = 0; i < 8000 * 3; i++) starPos[i] = (Math.random() - 0.5) * 2000
        const starGeo = new THREE.BufferGeometry()
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
        scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 })))

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
        camera.position.z = 2.5
        cameraRef.current = camera

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3))
        mount.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Globe group TODO BORDERS + INTERACTIONS
        const globeGroup = new THREE.Group()
        scene.add(globeGroup)
        globeGroupRef.current = globeGroup

        // Globe mesh
        const loader = new THREE.TextureLoader()
        const globeGeo = new THREE.SphereGeometry(1, 64, 64)
        const globeMat = new THREE.MeshPhongMaterial({
            map: loader.load('/textures/earth.jpg'),
            specular: new THREE.Color(0x111111),
            shininess: 5,
        })
        const globe = new THREE.Mesh(globeGeo, globeMat)
        globeGroup.add(globe)
        globeMeshRef.current = globe

        // Atmosphere
        globeGroup.add(new THREE.Mesh(
            new THREE.SphereGeometry(1.02, 64, 64),
            new THREE.MeshPhongMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.08 })
        ))

        // Borders + GeoJSON
        fetch('/data/countries.geojson')
            .then(r => r.json())
            .then((data: FeatureCollection) => {
                geojsonRef.current = data
                addBorders(globeGroup, data)
            })

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.4))
        const sun = new THREE.DirectionalLight(0xfff5e0, 1.4)
        sun.position.set(5, 3, 5)
        scene.add(sun)

        // Markers
        const markersGroup = new THREE.Group()
        scene.add(markersGroup)
        markersGroupRef.current = markersGroup

        const buildMarkers = (layer: Layer) => {
            markersGroup.clear()
            const { low, high } = LAYER_COLORS[layer]
            MOCK_DATA[layer].forEach(({ lat, lng, intensity }) => {
                const pos = latLngToVec3(lat, lng, 1.01)
                const color = low.clone().lerp(high, intensity)
                const ringGeo = new THREE.RingGeometry(0.018, 0.032, 16)
                const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
                    color, transparent: true, opacity: intensity * 0.5, side: THREE.DoubleSide,
                }))
                ring.position.copy(pos)
                ring.lookAt(pos.clone().multiplyScalar(2))
                markersGroup.add(ring)
                const dot = new THREE.Mesh(
                    new THREE.CircleGeometry(0.012, 16),
                    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
                )
                dot.position.copy(pos)
                dot.lookAt(pos.clone().multiplyScalar(2))
                markersGroup.add(dot)
            })
        }

        buildMarkers(activeLayerRef.current)
        ;window.__buildMarkers = buildMarkers

        // Raycaster for hover
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        const globeSphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64))

        const onMouseMove = (e: MouseEvent) => {
            const rect = mount.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
            setTooltipPos({ x: e.clientX, y: e.clientY })

            if (isDragging) return

            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObject(globeSphere)
            if (hits.length > 0 && geojsonRef.current) {
                // Transform hit point into globeGroup local space
                const localPoint = globeGroup.worldToLocal(hits[0].point.clone())
                const { lat, lng } = vec3ToLatLng(localPoint.normalize())
                const name = getCountryAtPoint(lat, lng, geojsonRef.current.features as Feature<Geometry>[])
                setHoveredCountry(name)
            } else {
                setHoveredCountry(null)
            }
        }

        // Drag
        let isDragging = false
        let prevX = 0, prevY = 0
        let userHasTouched = false

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true; userHasTouched = true
            prevX = e.clientX; prevY = e.clientY
        }
        const onMouseUp = () => { isDragging = false }
        const onMouseDrag = (e: MouseEvent) => {
            if (!isDragging) return
            globeGroup.rotation.y += (e.clientX - prevX) * 0.005
            globeGroup.rotation.x += (e.clientY - prevY) * 0.005
            markersGroup.rotation.y = globeGroup.rotation.y
            markersGroup.rotation.x = globeGroup.rotation.x
            prevX = e.clientX; prevY = e.clientY
        }
        const onWheel = (e: WheelEvent) => {
            camera.position.z = Math.max(1.1, Math.min(8, camera.position.z + e.deltaY * 0.003))
        }

        mount.addEventListener('mousedown', onMouseDown)
        mount.addEventListener('mousemove', onMouseMove)
        mount.addEventListener('wheel', onWheel)
        window.addEventListener('mouseup', onMouseUp)
        window.addEventListener('mousemove', onMouseDrag)

        // Animate
        let animId: number
        const animate = () => {
            animId = requestAnimationFrame(animate)
            if (!isDragging && !userHasTouched) {
                globeGroup.rotation.y += 0.0003
                markersGroup.rotation.y = globeGroup.rotation.y
            }
            renderer.render(scene, camera)
        }
        animate()

        // Resize
        const onResize = () => {
            camera.aspect = mount.clientWidth / mount.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(mount.clientWidth, mount.clientHeight)
        }
        window.addEventListener('resize', onResize)

        return () => {
            cancelAnimationFrame(animId)
            mount.removeEventListener('mousedown', onMouseDown)
            mount.removeEventListener('mousemove', onMouseMove)
            mount.removeEventListener('wheel', onWheel)
            window.removeEventListener('mouseup', onMouseUp)
            window.removeEventListener('mousemove', onMouseDrag)
            window.removeEventListener('resize', onResize)
            renderer.dispose()
            if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
            delete window.__buildMarkers
        }
    }, [])

    useEffect(() => {
        activeLayerRef.current = activeLayer
      window.__buildMarkers?.(activeLayer)

    }, [activeLayer])

    const layers: { key: Layer; label: string }[] = [
        { key: 'crime', label: 'Crime' },
        { key: 'weather', label: 'Weather' },
        { key: 'economy', label: 'Economy' },
    ]

    const layerColors: Record<Layer, string> = {
        crime: '#e24b4a',
        weather: '#378add',
        economy: '#ef9f27',
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#080e1a' }}>
            <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

            {/* Country tooltip */}
            {hoveredCountry && (
                <div style={{
                    position: 'fixed',
                    left: tooltipPos.x + 14,
                    top: tooltipPos.y - 10,
                    background: 'rgba(8,14,26,0.92)',
                    border: '0.5px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: '#e8edf5',
                    fontSize: '13px',
                    fontWeight: 500,
                    pointerEvents: 'none',
                    backdropFilter: 'blur(8px)',
                    zIndex: 100,
                }}>
                    {hoveredCountry}
                </div>
            )}

            {/* Layer switcher */}
            <div style={{
                position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: '8px', background: 'rgba(8,14,26,0.85)',
                border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '6px',
                backdropFilter: 'blur(8px)',
            }}>
                {layers.map(({ key, label }) => (
                    <button key={key} onClick={() => setActiveLayer(key)} style={{
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
                border: '0.5px solid rgba(255,255,255,0.08)',
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