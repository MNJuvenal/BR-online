import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const FullscreenButton: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (!isFullscreen) {
        await elem.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Erreur de plein écran:', err);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleFullscreen}
      className="p-2 bg-black/10 backdrop-blur-sm rounded-full hover:bg-black/20 transition-all duration-300"
    >
      {isFullscreen ? (
        <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9h6m-6 6h6M5 5h14v14H5z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7V5a2 2 0 012-2h2m4 0h2m4 0h2a2 2 0 012 2v2m0 4v2m0 4v2a2 2 0 01-2 2h-2m-4 0H9m-4 0H5a2 2 0 01-2-2v-2" />
        </svg>
      )}
    </motion.button>
  );
};

export default FullscreenButton;
