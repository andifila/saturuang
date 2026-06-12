import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import StartScreen from './components/StartScreen'
import ConfigScreen from './components/ConfigScreen'
import PaymentScreen from './components/PaymentScreen'
import CaptureScreen from './components/CaptureScreen'
import PreviewScreen from './components/PreviewScreen'
import './index.css'

const SCREENS = ['start', 'config', 'payment', 'capture', 'preview']

export default function App() {
  const [screen, setScreen] = useState('start')
  const [totalPhotos, setTotalPhotos] = useState(4)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [capturedPhotos, setCapturedPhotos] = useState([])

  const goTo = (next) => setScreen(next)

  const handleConfigDone = ({ photos, template }) => {
    setTotalPhotos(photos)
    setSelectedTemplate(template)
    goTo('payment')
  }

  const handleCapturesDone = (photos) => {
    setCapturedPhotos(photos)
    goTo('preview')
  }

  const handleRestart = () => {
    setTotalPhotos(4)
    setSelectedTemplate(null)
    setCapturedPhotos([])
    goTo('start')
  }

  return (
    <div className="relative w-screen h-screen bg-[#0d0d0f] overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === 'start' && (
          <StartScreen key="start" onStart={() => goTo('config')} />
        )}
        {screen === 'config' && (
          <ConfigScreen key="config" onDone={handleConfigDone} />
        )}
        {screen === 'payment' && (
          <PaymentScreen key="payment" onSuccess={() => goTo('capture')} />
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
            template={selectedTemplate}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
