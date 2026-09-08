import { useState } from 'react'
import './index.css'
import TopBar from './components/chassis/TopBar'
import { LuLayoutDashboard } from "react-icons/lu";
import NavButton from './components/chassis/NavButton'
import StatScreen from './components/display/StatScreen';

function App() {
  return (
    <div className="silver-body min-h-screen flex flex-col justify-center p-6 select-none">
      <div className="mx-auto w-full">
        <TopBar/>
      </div>
      <div className="flex flex-row">
        <div className="flex flex-col gap-1.5">
          <NavButton icon={LuLayoutDashboard} active={true} label={'navi'} />
        </div>
        
        <div className=""></div>

        <div className="flex flex-col gap-1">
          <StatScreen label={'test'} value={'22'} />
        </div>
        
      </div>
      
    </div>
  )
}

export default App
