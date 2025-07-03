import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Variable globale pour suivre si le chargement initial est terminé
let initialLoadingComplete = false;

const LoadingScreen = () => {
  const [progress, setProgress] = useState(initialLoadingComplete ? 100 : 0);
  const [loadingMessage, setLoadingMessage] = useState('Initialisation...');

  useEffect(() => {
    if (initialLoadingComplete) {
      setProgress(100);
      return;
    }

    const preloadModels = async () => {
      try {
        setLoadingMessage('Chargement des modèles...');
        // Simulation du chargement progressif
        const timer = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(timer);
              initialLoadingComplete = true;
              return 100;
            }
            return prev + 1;
          });
        }, 20);

        return () => clearInterval(timer);
      } catch (error) {
        console.error('Erreur lors du préchargement:', error);
        setLoadingMessage('Erreur de chargement des modèles');
      }
    };

    preloadModels();
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: '#140308' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2364ffa2' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-['TT_Ramillas'] text-4xl sm:text-5xl text-white mb-4"
          >
            BLEUREFLET
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-['Atyp_Display'] text-xl text-[#64ffa2] tracking-wider"
          >
            ESSAYAGE VIRTUEL DE COLLIERS
          </motion.p>
        </motion.div>

        {/* Progress container */}
        <div className="relative">
          {/* Progress bar background */}
          <div className="h-[2px] w-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-[#64ffa2]"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Progress number */}
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-4xl text-white">
                {progress}
              </span>
              <span className="font-display text-white/60 text-sm">%</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#64ffa2] rounded-full animate-pulse" />
              <span className="font-display text-sm text-white/60">
                {loadingMessage}
              </span>
            </div>
          </div>
        </div>

        {/* Loading messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="font-display text-white/40 text-sm">
            {progress < 33 && "Initialisation du système..."}
            {progress >= 33 && progress < 66 && "Chargement des modèles..."}
            {progress >= 66 && progress < 100 && "Configuration finale..."}
            {progress === 100 && "Prêt !"}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;