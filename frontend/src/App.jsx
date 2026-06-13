import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import StartScreen    from './components/StartScreen'
import ConfigScreen   from './components/ConfigScreen'
import PaymentScreen  from './components/PaymentScreen'
import CaptureScreen  from './components/CaptureScreen'
import PreviewScreen  from './components/PreviewScreen'
import DeliveryScreen from './components/DeliveryScreen'
import './index.css'


export default function App() {
  const [screen, setScreen] = useState('start')
  const [totalPhotos,    setTotalPhotos]    = useState(4)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [orderId,        setOrderId]        = useState(null)
  const [composite,      setComposite]      = useState(null) // { compositeUrl, filename, filterCss }

  const goTo = (next) => setScreen(next)

  const handleConfigDone = ({ photos }) => {
    setTotalPhotos(photos)
    goTo('payment')
  }

  const handlePaymentSuccess = (oid) => {
    setOrderId(oid)
    goTo('capture')
  }

  const handleCapturesDone = (photos) => {
    setCapturedPhotos(photos)
    goTo('preview')
  }

  const handlePreviewDone = (result) => {
    setComposite(result)
    goTo('delivery')
  }

  const handleRestart = () => {
    setTotalPhotos(4)
    setCapturedPhotos([])
    setOrderId(null)
    setComposite(null)
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
            onSuccess={handlePaymentSuccess}
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
            orderId={orderId}
            onDone={handlePreviewDone}
            onRestart={handleRestart}
          />
        )}
        {screen === 'delivery' && (
          <DeliveryScreen
            key="delivery"
            compositeUrl={composite?.compositeUrl}
            filename={composite?.filename}
            filterCss={composite?.filterCss || 'none'}
            onBack={() => goTo('preview')}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
