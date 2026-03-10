import { useState } from 'react'
import Nav from './components/Nav'
import Landscape from './components/landscape/Landscape'
import SignatoryNetwork from './components/signatories/SignatoryNetwork'
import KeyFigures from './components/keyfigures/KeyFigures'
import './index.css'

type Section = 'landscape' | 'signatories' | 'keyfigures'

export default function App() {
  const [active, setActive] = useState<Section>('landscape')

  return (
    <div className="app">
      <Nav active={active} setActive={setActive} />
      <main className="main">
        {active === 'landscape' && <Landscape />}
        {active === 'signatories' && <SignatoryNetwork />}
        {active === 'keyfigures' && <KeyFigures />}
      </main>
    </div>
  )
}
