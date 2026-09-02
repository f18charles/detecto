import { useState } from 'react'
import DetectionView from './pages/DetectionView'
import HistoryView from './pages/HistoryView'
import './App.css'

// Plain tab switch for now (no router dependency yet) — swap for
// react-router if/when the app needs real URLs per page.
function App() {
  const [page, setPage] = useState('detection')

  return (
    <>
      <nav>
        <button type="button" onClick={() => setPage('detection')}>
          Detection
        </button>
        <button type="button" onClick={() => setPage('history')}>
          History
        </button>
      </nav>

      {page === 'detection' ? <DetectionView /> : <HistoryView />}
    </>
  )
}

export default App
