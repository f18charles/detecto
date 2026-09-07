import { useState } from 'react'
import './index.css'
import TopBar from './components/TopBar'
import { LuLayoutDashboard } from "react-icons/lu";
import NavButton from './components/NavButton'

function App() {
  return (
    <div className="silver-body min-h-screen w-full flex flex-col items-center justify-center p-6 select-none">
      <TopBar/>
      <NavButton icon={LuLayoutDashboard} active={true} label={'navi'} />
    </div>
  )
}

export default App
