import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Hero from './components/Hero'
import Navbar from './components/Navbar'
import CameraView from './components/CameraView'
import WhySection from './components/WhySection'
import ShopSection from './components/ShopSection'
import TestingSection from './components/TestingSection'
import LoadingScreen from './components/LoadingScreen'
import NecklaceOverlay from './components/NecklaceOverlay'
import TestPage from './components/TestPage'
import * as tf from '@tensorflow/tfjs';
import PhotoTestView from './components/PhotoTestView'  

// Désactiver les logs TensorFlow
tf.env().set('DEBUG', false);
tf.env().set('WEBGL_VERSION', 2);
tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
tf.env().set('WEBGL_PACK', true);
tf.setBackend('webgl').then(() => {
  console.log('TensorFlow.js initialized');
});

const NECKLACES = [
  { name: "Collier 1", path: "collier1.png" },
  { name: "Collier 2", path: "collier2.png" },
  { name: "Collier 3", path: "collier3.png" },
  { name: "Collier 4", path: "collier4.png" },
];


type NecklaceSelectorProps = {
  onSelect: (path: string) => void;
};

function NecklaceSelector({ onSelect }: NecklaceSelectorProps) {
  const [selected, setSelected] = useState(NECKLACES[0].path);

  return (
    <div>
      <label>Choisir un collier :</label>
      <select
        value={selected}
        onChange={e => {
          setSelected(e.target.value);
          onSelect(e.target.value);
        }}
      >
        {NECKLACES.map(n => (
          <option key={n.path} value={n.path}>{n.name}</option>
        ))}
      </select>
      <div style={{ marginTop: 16 }}>
        <img src={selected} alt="Collier sélectionné" height={60} />
      </div>
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedNecklace, setSelectedNecklace] = useState(NECKLACES[0].path);

  useEffect(() => {
    const initTF = async () => {
      await tf.ready();
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };
    initTF();
  }, []);

  return (
    <Router>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" />
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-white text-gray-900 relative"
          >
            <div className="relative z-10">
              <Routes>
                <Route path="/" element={
                  <main>
                    <Navbar />
                    <Hero />
                    {/* Section Pourquoi */}
                    <section id="why" className="relative">
                      <WhySection />
                    </section>
                    
                    {/* Section Magasin */}
                    <section id="shop" className="relative">
                      <ShopSection />
                    </section>

                    {/* Section Test */}
                    <section id="test" className="relative">
                      <TestingSection />
                    </section>

                    {/* Section Caméra */}
                    <section id="demo" className="py-20 bg-gradient-to-b from-transparent to-gray-900">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <CameraView videoRef={videoRef}>
                          {videoRef.current && (
                            <NecklaceOverlay videoRef={videoRef} />
                          )}
                        </CameraView>
                      </div>
                    </section>
                    <NecklaceSelector onSelect={setSelectedNecklace} />
                  </main>
                } />
                <Route path="/test" element={<TestPage />} />
                <Route path="/photo" element={<PhotoTestView />} />
              </Routes>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Router>
  )
}

export default App
