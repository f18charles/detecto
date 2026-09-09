import './index.css'  
import { useKeyboardNav } from './hooks/useKeyboardNav'
import ConsoleShell from './components/chassis/ConsoleShell';

function App() {
  useKeyboardNav()
  return <ConsoleShell />
}

export default App
