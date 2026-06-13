import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import StartScreen from './components/StartScreen'
import ConfigScreen from './components/ConfigScreen'
import PaymentScreen from './components/PaymentScreen'
import CaptureScreen from './components/CaptureScreen'
import PreviewScreen from './components/PreviewScreen'
import './index.css'


export default function App() {
  const [screen, setScreen] = useState('start')
  const [totalPhotos,    setTotalPhotos]    = useState(4)
  const [capturedPhotos, setCapturedPhotos] = useState([])

  const goTo = (next) => setScreen(next)

  const handleConfigDone = ({ photos }) => {
    setTotalPhotos(photos)
    goTo('payment')
  }

  const handleCapturesDone = (photos) => {
    setCapturedPhotos(photos)
    goTo('preview')
  }

  const handleRestart = () => {
    setTotalPhotos(4)
    setCapturedPhotos([])
    goTo('start')
  }

  return (
    <div className="relative w-full h-full bg-[#0d0d0f] overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === 'start' && (
          <StartScreen key="start" onStart={() => goTo('config')} />
        )}
        {screen === 'config' && (
          <ConfigScreen key="config" onDone={handleConfigDone} />
        )}
        {screen === 'payment' && (
          <PaymentScreen
            key="payment"
            totalPhotos={totalPhotos}
            onSuccess={() => goTo('capture')}
          />
        )}
        {screen === 'capture' && (
          <CaptureScreen
            key="capture"
            totalPhotos={totalPhotos}
            onDone={handleCapturesDone}
          />
        )}
        {screen === 'preview' && (
          <PreviewScreen
            key="preview"
            photos={capturedPhotos}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
