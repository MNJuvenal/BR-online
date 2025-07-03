import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    ZPR: any;
  }
}

interface ZprViewerProps {
  modelPath: string;
}

const ZprViewer: React.FC<ZprViewerProps> = ({ modelPath }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadZPR = async () => {
      if (!containerRef.current || !canvasRef.current) return;

      try {
        // Assurez-vous que le script ZPR est chargé
        if (!window.ZPR) {
          const script = document.createElement('script');
          script.src = '/zpr/zpr.js'; // Assurez-vous que ce chemin est correct
          script.async = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        // Configuration du canvas
        const canvas = canvasRef.current;
        const container = containerRef.current;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Initialisation de ZPR
        if (window.ZPR) {
          const viewer = new window.ZPR.Viewer({
            canvas: canvas,
            model: modelPath,
            backgroundColor: '#111111',
          });

          // Gestion du redimensionnement
          const handleResize = () => {
            if (container && canvas) {
              canvas.width = container.clientWidth;
              canvas.height = container.clientHeight;
              viewer.resize();
            }
          };

          window.addEventListener('resize', handleResize);

          // Nettoyage
          return () => {
            window.removeEventListener('resize', handleResize);
            viewer.dispose();
          };
        }
      } catch (error) {
        console.error('Erreur lors du chargement du modèle ZPR:', error);
      }
    };

    loadZPR();
  }, [modelPath]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[600px] relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* Contrôles de navigation */}
      <div className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-md rounded-xl p-2 flex space-x-2">
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Réinitialiser la vue">
          <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Zoom avant">
          <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Zoom arrière">
          <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
      </div>

      {/* Instructions d'utilisation */}
      <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md rounded-xl p-3">
        <p className="text-white/70 text-sm font-display">
          🖱️ Clic gauche + déplacer : Rotation
          <br />
          🖱️ Clic droit + déplacer : Zoom
          <br />
          🖱️ Clic du milieu + déplacer : Translation
        </p>
      </div>
    </div>
  );
};

export default ZprViewer;
