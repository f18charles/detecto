import { useState } from 'react'
import './index.css'
import TopBar from './components/chassis/TopBar'
import { LuLayoutDashboard } from "react-icons/lu";
import NavButton from './components/chassis/NavButton'
import StatScreen from './components/display/StatScreen';

function App() {
  return (
    <div className="silver-body min-h-screen w-full flex flex-col items-center justify-center p-6 select-none">
      <TopBar/>
      <NavButton icon={LuLayoutDashboard} active={true} label={'navi'} />
      <StatScreen label={'test'} value={'22'} />
    </div>
  )
}

export default App
