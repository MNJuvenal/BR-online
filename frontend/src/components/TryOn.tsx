import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import NecklaceOverlay from './NecklaceOverlay';

interface TryOnProps {
  selectedNecklace: string | null;
}

const TryOn = ({ selectedNecklace }: TryOnProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setIsLoading(false);
          };
        }
      } catch (error) {
        console.error('Erreur accès caméra:', error);
        setCameraError('Impossible d\'accéder à la caméra. Veuillez vérifier vos permissions.');
        setIsLoading(false);
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <section id="try-on" className="py-20 min-h-screen bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Essayage Virtuel
          </h2>
          <p className="text-gray-400">
            Utilisez votre caméra pour essayer les colliers en temps réel
          </p>
        </motion.div>

        <div className="relative max-w-2xl mx-auto">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/80 rounded-xl z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
            </div>
          )}

          {cameraError && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl mb-4">
              {cameraError}
            </div>
          )}

          <div className="relative aspect-video rounded-xl overflow-hidden bg-glass-bg backdrop-blur-sm">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isLoading && <NecklaceOverlay videoRef={videoRef} />}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button 
              className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              onClick={() => {
                // Fonctionnalité de capture à implémenter si nécessaire
                console.log('Capture photo');
              }}
            >
              Prendre une Photo
            </button>
            <button 
              className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              onClick={() => {
                // Fonctionnalité de partage à implémenter si nécessaire
                console.log('Partager');
              }}
            >
              Partager
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TryOn;