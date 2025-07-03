import React, { useRef, useState, useEffect, PropsWithChildren } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ShareButtons from './social/ShareButtons';
import NecklaceOverlay from './NecklaceOverlay';
import CameraGuide from './CameraGuide';

import brLogo from '../../public/logo-br-blanc-9ab70a1f.webp';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

const CameraView: React.FC<PropsWithChildren<CameraViewProps>> = ({
  videoRef,
  children,
}) => {
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [metrics, setMetrics] = useState({
    detectedPoints: 0,
    confidence: 0,
    processingTime: 0,
  });

  // Contrôle de l'affichage du guide
  // Ici, on peut le mettre à `true` dès le départ (ou déclencher plus tard)
  const [showGuide, setShowGuide] = useState(false);

  // Optionnel: déclencher l'apparition de la guide quand on arrive
  // dans la section (IntersectionObserver)
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Au bout de 500ms, on affiche la guide
          setTimeout(() => {
            setShowGuide(true);
          }, 500);
        }
      },
      {
        threshold: 0.8, // 80% de la section visible
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Callback quand toutes les étapes du tutoriel sont terminées
  const handleGuideComplete = () => {
    setShowGuide(false);
  };

  // Vérification WebGL (optionnel, pour être sûr que TF.js peut tourner)
  useEffect(() => {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) {
      setError(
        'Erreur : WebGL semble indisponible dans ce navigateur. ' +
          'Veuillez vérifier vos réglages ou utiliser un autre navigateur.'
      );
    }
  }, []);

  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            ?.play()
            .then(() => {
              console.log('Video playback started');
              setIsLoading(false);
              setIsProcessing(true);
              setIsCameraActive(true);
            })
            .catch((err) => {
              console.error('Error starting video playback:', err);
              setError('Failed to start video playback');
            });
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to access camera');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      videoRef.current.srcObject = null;
    }
    setIsProcessing(false);
    setIsCameraActive(false);
    setMetrics({
      detectedPoints: 0,
      confidence: 0,
      processingTime: 0,
    });
    console.log('Camera stopped and state reset');
  };

  const handleMetricsUpdate = (stats: {
    detectedPoints: number;
    confidence: number;
    processingTime: number;
  }) => {
    setMetrics(stats);
  };

  // Gérer le plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      if (isCameraActive) {
        stopCamera();
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isCameraActive]);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen && cameraContainerRef.current) {
        await cameraContainerRef.current.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Erreur de plein écran:', err);
    }
  };

  if (error) {
    return (
      <div className="camera-error text-red-600 p-8 text-center">
        <p>{error}</p>
        <p>Veuillez vérifier votre navigateur ou vos autorisations.</p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/bleureflet/',
      icon: (
        <path
          fillRule="evenodd"
          d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.398.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
          clipRule="evenodd"
        />
      ),
    },
    {
      name: 'Pinterest',
      href: 'https://www.pinterest.fr/bleureflet/',
      icon: (
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"
          clipRule="evenodd"
        />
      ),
    },
  ];

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="relative w-full"
    >
      {/* --- Affichage du tutoriel --- */}
      {showGuide && <CameraGuide onComplete={handleGuideComplete} />}

      <div className="max-w-7xl mx-auto px-4">
        {/* Title Section */}
        <div className="text-left mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-5xl text-black mb-2 text-left max-w-7xl mx-auto"
          >
            Essayez nos colliers virtuellement
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-display text-xl text-black/70 text-left max-w-7xl mx-auto"
          >
            Notre technologie d'IA analyse votre morphologie en temps réel pour un
            essayage virtuel photoréaliste
          </motion.p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Camera Feed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:flex-1"
          >
            <div
              ref={cameraContainerRef}
              className="relative w-full h-[80vh] bg-black rounded-lg overflow-hidden"
            >
              <video
                ref={videoRef}
                className="absolute top-0 left-0 w-full h-full object-cover"
                playsInline
                muted
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Overlay du collier */}
              {isProcessing && videoRef.current && (
                <NecklaceOverlay
                  videoRef={videoRef}
                  onStatsUpdate={handleMetricsUpdate}
                />
              )}

              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
                <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10">
                  <div
                    className={`w-3 h-3 ${
                      isCameraActive ? 'bg-[#64ffa2]' : 'bg-red-500'
                    } rounded-full animate-pulse`}
                  />
                  <span className="font-heading text-xl text-white">
                    {isCameraActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Caméra non activée */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-white/20">
                      <svg
                        className="w-10 h-10 text-white/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-xl text-white/60 font-display">
                      Caméra non activée
                    </p>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div
                className={`absolute ${
                  isFullscreen ? 'bottom-8' : 'bottom-0'
                } left-0 right-0 p-5 transition-all duration-500`}
              >
                <motion.div
                  className="flex justify-between items-center px-1"
                  initial={false}
                  animate={isFullscreen ? { y: 0, opacity: 1 } : { y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{
                        scale: 1.02,
                        backgroundColor: isCameraActive
                          ? 'rgba(239, 68, 68, 0.9)'
                          : 'rgba(100, 255, 162, 0.9)',
                        boxShadow: isCameraActive
                          ? '0 0 20px rgba(239, 68, 68, 0.2)'
                          : '0 0 20px rgba(100, 255, 162, 0.2)',
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => (isCameraActive ? stopCamera() : startCamera())}
                      className={`px-5 py-2 ${
                        isCameraActive ? 'bg-red-500/70' : 'bg-[#64ffa2]/70'
                      } backdrop-blur-sm text-black/90 rounded-full font-display text-sm tracking-wide transition-all duration-300 border ${
                        isCameraActive
                          ? 'border-red-500/20'
                          : 'border-[#64ffa2]/20'
                      }`}
                      id="try-button"
                    >
                      {isCameraActive ? '✕ Arrêter' : '→ Essayer'}
                    </motion.button>

                    {isCameraActive && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center space-x-4"
                      >
                        <div className="flex items-center space-x-1.5 bg-white/5 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                          <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="font-display text-xs text-white/60"
                          >
                            {metrics.detectedPoints} points
                          </motion.span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Right side controls */}
                  <div className="flex items-center space-x-3">
                    {isCameraActive && <ShareButtons />}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={toggleFullscreen}
                      className={`px-4 py-1.5 bg-black/10 backdrop-blur-sm text-white/90 rounded-full font-display text-xs tracking-wide transition-all duration-300 border border-white/10 ${
                        isFullscreen ? 'hover:bg-black/20' : ''
                      }`}
                      id="expand-button"
                    >
                      {isFullscreen ? '← Réduire' : '↗ Agrandir'}
                    </motion.button>

                    {isCameraActive && (
                      <div className="flex items-center space-x-1.5 bg-black/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <div className="w-1 h-1 bg-red-500/80 rounded-full animate-pulse" />
                        <span className="font-display text-xs text-white/50">
                          Live
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {children}
            </div>
          </motion.div>

          {/* Right Column - Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-96 space-y-6"
          >
            {/* Metrics Cards */}
            <div className="grid gap-4">
              <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg text-white/60 mb-2">
                      Points détectés
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <span className="font-heading text-4xl text-[#64ffa2]">
                        {metrics.detectedPoints}
                      </span>
                      <span className="font-display text-white/40">points</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-[#64ffa2]/10 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#64ffa2]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg text-white/60 mb-2">
                      Confiance
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <span className="font-heading text-4xl text-[#64ffa2]">
                        {(metrics.confidence * 100).toFixed(1)}
                      </span>
                      <span className="font-display text-white/40">%</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-[#64ffa2]/10 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#64ffa2]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg text-white/60 mb-2">
                      Temps de traitement
                    </p>
                    <div className="flex items-baseline space-x=2">
                      <span className="font-heading text-4xl text-[#64ffa2]">
                        {Math.round(metrics.processingTime)}
                      </span>
                      <span className="font-display text-white/40">ms</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-[#64ffa2]/10 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#64ffa2]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-[#64ffa2]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-[#64ffa2]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="font-display text-sm text-white/60 leading-relaxed">
                  Notre système utilise des algorithmes avancés de deep learning
                  et MediaPipe pour analyser la morphologie du cou et des
                  épaules, permettant un placement précis et réaliste des colliers
                  virtuels.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo et Description */}
          <div className="col-span-1 lg:col-span-2">
            <Link to="/" className="block mb-6">
              <motion.img
                src={brLogo}
                alt="Bleu Reflet Logo"
                className="h-16"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
            </Link>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              Un projet innovant alliant technologie et bijouterie, développé dans
              le cadre du projet Engineering d'EFREI Paris-Panthéon-Assas.
            </p>
            {/* Réseaux sociaux */}
            <div className="flex space-x-6">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="sr-only">{link.name}</span>
                  <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                    {link.icon}
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Projet */}
          <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-8">
            <h3 className="text-white font-semibold text-xl mb-6">Le Projet</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-[#64ffa2]/50 rounded-full group-hover:bg-[#64ffa2]" />
                  <span>À propos</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/team"
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-[#64ffa2]/50 rounded-full group-hover:bg-[#64ffa2]" />
                  <span>L'équipe</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://www.efrei.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-[#64ffa2]/50 rounded-full group-hover:bg-[#64ffa2]" />
                  <span>EFREI Paris-Panthéon-Assas</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-8">
            <h3 className="text-white font-semibold text-xl mb-6">Contact</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="mailto:contact@bleureflet.fr"
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-[#64ffa2]/50 rounded-full group-hover:bg-[#64ffa2]" />
                  <span>contact@bleureflet.fr</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/bleu-reflet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-[#64ffa2]/50 rounded-full group-hover:bg-[#64ffa2]" />
                  <span>LinkedIn</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-white/10 mt-20 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-6 md:mb-0">
              {currentYear} Bleu Reflet × Engineering Project EFREI {currentYear - 1}/
              {currentYear}
            </p>
            <div className="flex space-x-8">
              <motion.a
                href="https://gitlab.com/bleu-reflet/efrei/bleu-reflet-collier/-/tree/test?ref_type=heads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="w-1.5 h-1.5 bg-[#64ffa2]/50 rounded-full group-hover:bg-[#64ffa2]" />
                <span>GitHub</span>
              </motion.a>
              <motion.a
                href="https://www.efrei.fr/programme-grande-ecole/le-cycle-ingenieur/ingenieur-big-data/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="w-1.5 h-1.5 bg-[#64ffa2]/50 rounded-full group-hover:bg-[#64ffa2]" />
                <span>Programme M2</span>
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CameraView;
