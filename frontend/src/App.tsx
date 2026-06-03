import { useState } from 'react'
import Globe from './components/Globe'
import Map from './pages/Map'

function App() {
    const [page, setPage] = useState<'globe' | 'map'>('globe')

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            {page === 'globe' ? <Globe /> : <Map />}

            <div style={{
                position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: '4px', background: 'rgba(8,14,26,0.85)',
                border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '4px',
                backdropFilter: 'blur(8px)', zIndex: 200,
            }}>
                {(['globe', 'map'] as const).map(p => (
                    <button key={p} onClick={() => setPage(p)} style={{
                        padding: '6px 18px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
                        background: page === p ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: page === p ? '#fff' : 'rgba(255,255,255,0.4)',
                        textTransform: 'capitalize',
                    }}>
                        {p}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default App