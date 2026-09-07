import { useState } from 'react'
import './index.css'
import TopBar from './components/TopBar'

function App() {
  return (
    <div className="silver-body min-h-screen w-full flex flex-col items-center justify-center p-6 select-none">
      <TopBar />
    </div>
  )
}

export default App
