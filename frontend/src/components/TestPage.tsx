import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
// import NecklaceOverlay from './NecklaceOverlay'; // À inclure si vous utilisez un overlay temps réel
// import ShareButtons from './social/ShareButtons'; // À inclure si vous avez un composant de partage

const TestPage = () => {
  // Références pour le flux vidéo et le canvas
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // État pour la caméra
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState(null);

  // État pour l'image capturée ou uploadée
  const [selectedFile, setSelectedFile] = useState(null);
  // État pour l'image renvoyée du backend
  const [processedImageUrl, setProcessedImageUrl] = useState(null);
  // État de chargement
  const [isLoading, setIsLoading] = useState(false);

  // Démarrer la caméra
  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            .play()
            .then(() => {
              console.log('Video playback started');
              setIsCameraActive(true);
              setStream(mediaStream);
            })
            .catch((err) => {
              console.error('Error starting video playback:', err);
            });
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Impossible d’accéder à la caméra. Vérifiez vos autorisations.');
    }
  };

  // Arrêter la caméra
  const stopCamera = () => {
    console.log('Stopping camera...');
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setStream(null);
  };

  // Capture d’image depuis la vidéo
  const takePhoto = () => {
    if (!isCameraActive || !videoRef.current) return;

    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    if (width && height) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      const ctx = canvasRef.current.getContext('2d');
      // Dessiner la frame vidéo dans le canvas
      ctx.drawImage(videoRef.current, 0, 0, width, height);

      // Transformer le canvas en blob
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          // On assigne ce fichier capturé à selectedFile
          setSelectedFile(file);
          console.log('Photo capturée !');
        }
      }, 'image/jpeg');
    }
  };

  // Gestion de l’upload local
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Facultatif : on arrête la caméra si un fichier est choisi
      stopCamera();
    }
  };

  // Envoi au backend
  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('Veuillez sélectionner ou prendre une photo avant d’envoyer.');
      return;
    }
    setIsLoading(true);
    setProcessedImageUrl(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Adaptation : utilisez l’URL de votre backend
      const response = await fetch('http://localhost:5000/apply-necklace', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur du serveur lors de la réception de la photo traitée.');
      }

      // Récupérer le blob de l'image traitée
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);
      setProcessedImageUrl(objectURL);
    } catch (error) {
      console.error('Erreur lors de l’envoi ou la réception de l’image:', error);
      alert('Une erreur est survenue lors du traitement.');
    } finally {
      setIsLoading(false);
    }
  };

  // Nettoyage caméra quand on quitte la page
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white text-black flex flex-col items-center p-4"
    >
      {/* Bouton retour */}
      <Link
        to="/"
        className="self-start mb-4 p-2 rounded-full hover:bg-black/5 transition-colors"
      >
        <svg
          className="w-6 h-6 text-black"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </Link>

      <h1 className="text-2xl font-bold mb-6">
        TestPage – Essai Collier 2D
      </h1>

      {/* Bloc principal : Caméra + Upload */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Contrôles Caméra */}
        <div className="flex flex-col items-center gap-4 bg-gray-50 p-4 rounded-md">
          <h2 className="font-semibold">Caméra</h2>

          <div className="relative w-full h-48 bg-black overflow-hidden rounded-md flex justify-center items-center">
            {/* Flux vidéo */}
            <video
              ref={videoRef}
              className="absolute top-0 left-0 w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Message si caméra non active */}
            {!isCameraActive && (
              <div className="text-white/60 text-sm">Caméra non activée</div>
            )}
          </div>

          <div className="flex gap-2">
            {!isCameraActive ? (
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={startCamera}
              >
                Démarrer Caméra
              </button>
            ) : (
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={stopCamera}
              >
                Arrêter Caméra
              </button>
            )}
            {isCameraActive && (
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={takePhoto}
              >
                Prendre une photo
              </button>
            )}
          </div>
        </div>

        {/* Upload local */}
        <div className="flex flex-col items-center gap-4 bg-gray-50 p-4 rounded-md">
          <h2 className="font-semibold">Téléverser une image</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-sm"
          />

          <p className="text-sm text-gray-500 text-center">
            Vous pouvez prendre une photo avec la caméra
            <br /> ou choisir un fichier local.
          </p>
        </div>
      </div>

      {/* Zone de bouton d'envoi */}
      <div className="mb-6">
        <button
          onClick={handleSubmit}
          className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600 transition-colors"
        >
          Envoyer au Backend
        </button>
      </div>

      {/* Barre de chargement */}
      {isLoading && (
        <div className="relative w-64 h-2 bg-gray-200 rounded mb-6">
          <div className="absolute left-0 top-0 h-2 w-1/2 bg-purple-500 animate-pulse"></div>
        </div>
      )}

      {/* Affichage de l'image traitée */}
      {processedImageUrl && !isLoading && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Résultat :</h2>
          <img
            src={processedImageUrl}
            alt="Processed"
            className="max-w-xs border border-gray-300 rounded shadow"
          />
        </div>
      )}

      {/* Canvas caché pour la capture de la vidéo */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </motion.div>
  );
};

export default TestPage;
