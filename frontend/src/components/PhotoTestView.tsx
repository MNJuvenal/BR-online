import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FaChevronDown,
} from "react-icons/fa";
import { useAssets, AssetItem } from "../hooks/useAssets";

// Nouveaux composants d'icônes utilisant les images fournies
const UserIcon = ({ size = 20 }: { size?: number }) => (
  <img 
    src="/assets/icons/model.jpeg" 
    alt="Modèles" 
    width={size} 
    height={size} 
    className="rounded object-cover" 
  />
);

const UploadIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <img 
    src="/assets/icons/upload.jpeg" 
    alt="Prendre photo" 
    width={size} 
    height={size} 
    className={`rounded object-cover ${className}`} 
  />
);

const NecklaceIcon = ({ size = 20 }: { size?: number }) => (
  <img 
    src="/assets/icons/collier.jpeg" 
    alt="Collier" 
    width={size} 
    height={size} 
    className="rounded object-cover" 
  />
);

const SaveIcon = ({ size = 20 }: { size?: number }) => (
  <img 
    src="/assets/icons/telechargement.jpeg" 
    alt="Télécharger" 
    width={size} 
    height={size} 
    className="rounded object-cover" 
  />
);

const WaitingIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <img 
    src="/assets/icons/waiting.jpeg" 
    alt="En attente" 
    width={size} 
    height={size} 
    className={`rounded object-cover ${className}`} 
  />
);

const ProcessIcon = ({ size = 20 }: { size?: number }) => (
  <img 
    src="/assets/icons/waiting.jpeg" 
    alt="Traiter" 
    width={size} 
    height={size} 
    className="rounded object-cover" 
  />
);

const CameraIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <path d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z"/>
  </svg>
);

const PhotoTestView: React.FC = () => {
  // Chargement dynamique des assets
  const { assets, loading: assetsLoading, error: assetsError, refetch: refetchAssets } = useAssets();
  
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedNecklace, setSelectedNecklace] = useState<string | null>(null);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMannequinDropdown, setShowMannequinDropdown] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Vérification MediaPipe réelle
    const checkMediaPipe = () => {
      if ((window as any).FaceMesh) {
        setIsMediaPipeReady(true);
        console.log("✅ MediaPipe FaceMesh prêt");
      } else {
        console.log("⏳ Attente MediaPipe...");
        setTimeout(checkMediaPipe, 100);
      }
    };
    checkMediaPipe();
  }, []);

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Vérifier si le clic est à l'extérieur des dropdowns
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(false);
        setShowMannequinDropdown(false);
      }
    };

    if (showDropdown || showMannequinDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showMannequinDropdown]);

  // Fonction pour calculer la luminosité moyenne de l'image
  const calculateImageBrightness = (imageElement: HTMLImageElement): Promise<number> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      ctx?.drawImage(imageElement, 0, 0);
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve(0.5);
        return;
      }
      
      let totalBrightness = 0;
      let pixelCount = 0;
      const pixels = imageData.data;
      
      // Analyser les pixels pour déterminer l'éclairage général
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const alpha = pixels[i + 3];
        
        // Ignorer les pixels transparents
        if (alpha > 0) {
          // Formule de luminance perçue améliorée
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          totalBrightness += brightness;
          pixelCount++;
        }
      }
      
      const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0.5;
      resolve(avgBrightness);
    });
  };

  // Fonction pour ajuster automatiquement la luminosité du collier selon l'éclairage de l'image
  const adjustNecklaceBrightness = (imageBrightness: number): number => {
    console.log("💡 Éclairage détecté dans l'image:", (imageBrightness * 100).toFixed(1) + "%");
    
    // Ajustement plus nuancé selon l'éclairage détecté
    if (imageBrightness < 0.2) {
      // Image très sombre (éclairage faible) - éclaircir fortement le collier
      const adjustment = 1.6 + (0.2 - imageBrightness) * 3;
      console.log("🌙 Éclairage très faible détecté - ajustement:", adjustment.toFixed(2));
      return adjustment;
    } else if (imageBrightness < 0.4) {
      // Image sombre (éclairage modéré) - éclaircir le collier
      const adjustment = 1.3 + (0.4 - imageBrightness) * 1.5;
      console.log("🌥️ Éclairage faible détecté - ajustement:", adjustment.toFixed(2));
      return adjustment;
    } else if (imageBrightness > 0.8) {
      // Image très claire (forte luminosité) - assombrir le collier
      const adjustment = 0.8 - (imageBrightness - 0.8) * 1.5;
      console.log("☀️ Éclairage très fort détecté - ajustement:", adjustment.toFixed(2));
      return adjustment;
    } else if (imageBrightness > 0.6) {
      // Image claire (bonne luminosité) - légèrement assombrir
      const adjustment = 0.9 - (imageBrightness - 0.6) * 0.5;
      console.log("🌤️ Bon éclairage détecté - ajustement:", adjustment.toFixed(2));
      return adjustment;
    }
    
    // Éclairage optimal - pas d'ajustement
    console.log("✨ Éclairage optimal détecté - pas d'ajustement");
    return 1;
  };

  // Fonction pour sauvegarder l'image avec collier
  const saveImage = () => {
    if (!processedImage) {
      setErrorMessage("Aucune image traitée à sauvegarder");
      return;
    }

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `collier-essayage-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Message de confirmation
    setErrorMessage("✅ Image sauvegardée avec succès !");
    setTimeout(() => setErrorMessage(null), 3000);
  };

  // Fonction pour sélectionner un collier
  const handleNecklaceSelect = (necklace: AssetItem) => {
    console.log("🔗 Sélection collier:", necklace.name, necklace.path);
    setSelectedNecklace(necklace.path);
    setShowDropdown(false);
    console.log("✅ Collier sélectionné et dropdown fermé");
  };

  // Fonction pour sélectionner un mannequin
  const handleMannequinSelect = (mannequin: AssetItem) => {
    console.log("👤 Sélection mannequin:", mannequin.name, mannequin.path);
    setShowMannequinDropdown(false);
    
    // Charger l'image du mannequin
    setImage(`/assets/examples/${mannequin.path}`);
    setProcessedImage(null);
    setErrorMessage(null);
    
    // Fermer l'écran d'accueil si c'est un mannequin sélectionné
    if (showWelcome) {
      setShowWelcome(false);
    }
    console.log("✅ Mannequin sélectionné et image chargée");
  };

  // Fonction pour rafraîchir la liste des assets
  const handleRefreshAssets = async () => {
    console.log('🔄 Rafraîchissement des assets - DÉBUT...');
    try {
      await refetchAssets();
      console.log('✅ Rafraîchissement terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement:', error);
    }
  };

  // Conversion des landmarks MediaPipe vers le format attendu par le backend
  const convertMediaPipeLandmarks = (landmarks: Array<{x: number, y: number, z: number}>, imageWidth: number, imageHeight: number) => {
    // MediaPipe FaceMesh landmarks indices pour les points d'intérêt
    // Documentation: https://github.com/google/mediapipe/blob/master/docs/solutions/face_mesh.md
    const LANDMARK_INDICES = {
      left_ear: 234,   // Point sur l'oreille gauche
      right_ear: 454,  // Point sur l'oreille droite
      chin: 175,       // Point du menton
      // Pour les épaules, on utilise des estimations basées sur les oreilles
    };

    if (!landmarks || landmarks.length < 468) {
      throw new Error("Landmarks MediaPipe incomplets (attendu 468 points)");
    }

    // Convertir les coordonnées normalisées en pixels
    const convertPoint = (index: number) => {
      const landmark = landmarks[index];
      return [
        Math.round(landmark.x * imageWidth),
        Math.round(landmark.y * imageHeight)
      ];
    };

    const leftEar = convertPoint(LANDMARK_INDICES.left_ear);
    const rightEar = convertPoint(LANDMARK_INDICES.right_ear);
    const chin = convertPoint(LANDMARK_INDICES.chin);

    // Estimation des épaules basée sur les oreilles
    // Les épaules sont généralement 1.5x plus larges que la distance oreille-oreille
    // et environ 100-150px plus bas que les oreilles
    const earDistance = Math.abs(rightEar[0] - leftEar[0]);
    const shoulderOffset = Math.round(earDistance * 0.3); // 30% plus large de chaque côté
    const shoulderDrop = Math.round(earDistance * 0.8); // Descendre proportionnellement

    const leftShoulder = [
      leftEar[0] - shoulderOffset,
      leftEar[1] + shoulderDrop
    ];
    
    const rightShoulder = [
      rightEar[0] + shoulderOffset,
      rightEar[1] + shoulderDrop
    ];

    console.log("🎯 Conversion landmarks MediaPipe:", {
      leftEar,
      rightEar,
      chin,
      leftShoulder,
      rightShoulder,
      earDistance,
      shoulderOffset,
      shoulderDrop
    });

    return {
      left_ear: leftEar,
      right_ear: rightEar,
      chin: chin,
      left_shoulder: leftShoulder,
      right_shoulder: rightShoulder
    };
  };

  const detectLandmarks = async (imageElement: HTMLImageElement) => {
    return new Promise<any>((resolve, reject) => {
      if (!(window as any).FaceMesh) {
        reject(new Error("MediaPipe FaceMesh non chargé"));
        return;
      }

      try {
        const faceMesh = new (window as any).FaceMesh({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
          },
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        let timeoutId: NodeJS.Timeout;

        faceMesh.onResults((results: any) => {
          clearTimeout(timeoutId);
          
          if (!results.multiFaceLandmarks?.length) {
            reject(new Error("Aucun visage détecté"));
            return;
          }
          
          console.log("✅ Landmarks détectés:", results.multiFaceLandmarks[0].length);
          resolve(results.multiFaceLandmarks[0]);
        });

        timeoutId = setTimeout(() => {
          reject(new Error("Timeout détection landmarks"));
        }, 10000);

        faceMesh.send({ image: imageElement });
      } catch (error) {
        console.error("❌ Erreur MediaPipe:", error);
        reject(error);
      }
    });
  };

  const processImage = async () => {
    if (!image || !selectedNecklace) {
      console.log("❌ Conditions manquantes:", {
        image: !!image,
        selectedNecklace: !!selectedNecklace,
        selectedNecklaceValue: selectedNecklace
      });
      setErrorMessage("Veuillez choisir une photo et un collier.");
      return;
    }

    if (!isMediaPipeReady) {
      setErrorMessage("⏳ MediaPipe n'est pas encore chargé, veuillez patienter...");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    console.log("🔄 Début du traitement...");
    
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = image;
      await img.decode();
      
      // 1. Détecter les landmarks côté frontend avec MediaPipe
      console.log("🔍 Détection des landmarks côté frontend...");
      const rawLandmarks = await detectLandmarks(img);
      console.log("✅ Landmarks bruts détectés côté frontend:", rawLandmarks.length);
      
      // 2. Convertir les landmarks au format attendu par le backend
      const landmarks = convertMediaPipeLandmarks(rawLandmarks, img.width, img.height);
      console.log("🔄 Landmarks convertis pour le backend:", landmarks);
      
      // 2. Calculer la luminosité de l'image
      const imageBrightness = await calculateImageBrightness(img);
      const adjustedBrightness = adjustNecklaceBrightness(imageBrightness);
      setBrightness(adjustedBrightness);
      
      console.log("💡 Luminosité collier ajustée:", adjustedBrightness.toFixed(2));
      
      // 3. Créer le canvas avec l'image
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Erreur création blob"))),
          "image/jpeg"
        )
      );
      
      // 4. Préparer les données à envoyer au backend
      const formData = new FormData();
      formData.append("image", new File([blob], "photo.jpg"));
      formData.append("necklace", selectedNecklace);
      formData.append("brightness", adjustedBrightness.toString());
      formData.append("shadowIntensity", "0.6"); // Ombre plus prononcée
      
      // 5. Ajouter les landmarks détectés et convertis côté frontend
      formData.append("landmarks", JSON.stringify(landmarks));

      console.log("🚀 Envoi vers serveur avec landmarks détectés côté frontend...");
      console.log("📦 FormData:", {
        image: "File object",
        necklace: selectedNecklace,
        brightness: adjustedBrightness.toFixed(2),
        shadowIntensity: "0.6",
        landmarks: "Landmarks convertis au format backend"
      });

      const res = await fetch("/api/apply-necklace", {
        method: "POST",
        body: formData,
      });

      console.log("📡 Réponse serveur:", res.status, res.statusText);

      if (!res.ok) {
        try {
          const errorData = await res.json();
          console.error("❌ Erreur détaillée:", errorData);
          throw new Error(errorData.message || `Erreur serveur: ${res.status}`);
        } catch (jsonError) {
          console.error("❌ Impossible de parser l'erreur JSON:", jsonError);
          throw new Error(`Erreur serveur: ${res.status} - ${res.statusText}`);
        }
      }

      const processingInfo = res.headers.get('X-Processing-Info');
      console.log("📊 Info de traitement:", processingInfo);

      const processedBlob = await res.blob();
      console.log("📦 Blob reçu:", processedBlob.size, "bytes, type:", processedBlob.type);
      
      // Vérifier que le blob est valide
      if (processedBlob.size === 0) {
        throw new Error("Image traitée vide reçue du serveur");
      }
      
      if (!processedBlob.type.startsWith('image/')) {
        console.warn("⚠️ Type de blob inattendu:", processedBlob.type);
      }
      
      const processedUrl = URL.createObjectURL(processedBlob);
      console.log("🔗 URL créée:", processedUrl);
      
      setProcessedImage(processedUrl);

      if (processingInfo) {
        switch (processingInfo) {
          case 'error_photo_not_conform':
            setErrorMessage("⚠️ Photo pas conforme - Veuillez utiliser une photo avec le visage bien visible et les épaules droites");
            break;
          case 'error_no_collar':
            setErrorMessage("❌ Erreur - Collier introuvable ou invalide");
            break;
          case 'error_bust_too_short':
            setErrorMessage("⚠️ Buste trop court pour placer le collier");
            break;
          case 'error_face_not_detected':
            setErrorMessage("❌ Aucun visage détecté dans l'image");
            break;
          case 'error_shoulders_not_detected':
            setErrorMessage("⚠️ Épaules non détectées - Assurez-vous que vos épaules sont visibles");
            break;
          case 'error_image_processing':
            setErrorMessage("❌ Erreur lors du traitement de l'image");
            break;
          case 'success':
            console.log("✅ Traitement terminé avec succès!");
            break;
          default:
            console.log("✅ Traitement terminé!");
        }
      }
      
    } catch (err: any) {
      console.error("❌ Erreur complète:", err);
      setErrorMessage(err.message || "Erreur lors du traitement");
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setProcessedImage(null);
        setErrorMessage(null);
        // Fermer l'écran d'accueil si une image est uploadée
        if (showWelcome) {
          setShowWelcome(false);
        }
        console.log("📁 Image uploadée");
      };
      reader.readAsDataURL(acceptedFiles[0]);
    }
  }, [showWelcome]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    multiple: false,
  });

  // Fonction pour démarrer la caméra
  const startCamera = async () => {
    try {
      console.log("📷 Démarrage de la caméra...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setShowWelcome(false);
      console.log("✅ Caméra démarrée");
    } catch (error) {
      console.error("❌ Erreur d'accès à la caméra:", error);
      setErrorMessage("❌ Impossible d'accéder à la caméra");
    }
  };

  // Fonction pour arrêter la caméra
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    console.log("🛑 Caméra arrêtée");
  };

  // Fonction pour prendre une photo
  const takePhoto = () => {
    if (!videoRef) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.videoWidth;
    canvas.height = videoRef.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const photoUrl = URL.createObjectURL(blob);
        setImage(photoUrl);
        setProcessedImage(null);
        setErrorMessage(null);
        stopCamera();
        console.log("📸 Photo prise avec succès");
      }
    }, 'image/jpeg', 0.9);
  };

  // Nettoyer la caméra au démontage
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Affichage du loading pendant le scan des assets
  if (assetsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Scan des assets en cours...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur si le scan a échoué
  if (assetsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl mb-2"></i>
            <p className="text-lg font-semibold">Erreur lors du chargement des assets</p>
            <p className="text-sm text-gray-600 mt-2">{assetsError}</p>
          </div>
          <button
            onClick={handleRefreshAssets}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <i className="fas fa-refresh mr-2"></i>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black text-white overflow-hidden">
      {/* Interface caméra */}
      {showCamera && (
        <div className="absolute inset-0 z-50 bg-black">
          <video
            ref={(ref) => {
              setVideoRef(ref);
              if (ref && stream) {
                ref.srcObject = stream;
                ref.play();
              }
            }}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          
          {/* Contrôles caméra */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-4">
            <button
              onClick={takePhoto}
              className="bg-white hover:bg-gray-200 p-4 rounded-full shadow-2xl transition-all transform hover:scale-105"
            >
              <CameraIcon size={32} />
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Écran d'accueil avec image de message01 */}
      {showWelcome && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div 
            className="relative w-full h-full flex items-center justify-center"
            style={{
              backgroundImage: "url('/assets/message01.jpeg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute bottom-20">
              <button 
                className="bg-white/90 hover:bg-white px-10 py-5 rounded-full transition-all transform hover:scale-105 text-xl font-bold shadow-2xl text-black"
                onClick={() => setShowWelcome(false)}
              >
                <UploadIcon size={28} className="inline mr-4" />
                Commencer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header de statut fixe */}
      {!showWelcome && !showCamera && (
        <div className="fixed top-4 left-4 right-4 z-30 flex items-center justify-between">
          <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-images text-blue-400"></i>
              <span className="text-sm font-medium">{assets.examples.length} Modèles</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-gem text-purple-400"></i>
              <span className="text-sm font-medium">{assets.colliers.length} Colliers</span>
            </div>
          </div>
          
          <button
            onClick={handleRefreshAssets}
            disabled={assetsLoading}
            className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-black/80 transition-colors disabled:opacity-50 flex items-center space-x-2"
            title="Actualiser les assets"
          >
            <i className={`fas fa-refresh ${assetsLoading ? 'fa-spin' : ''}`}></i>
            <span className="text-sm hidden md:block">Actualiser</span>
          </button>
        </div>
      )}

      {/* Indicateur de statut */}
      {!isMediaPipeReady && !showWelcome && (
        <div className="fixed top-20 left-4 bg-orange-500 text-white px-3 py-1 rounded-lg text-sm z-20">
          🔄 Chargement MediaPipe...
        </div>
      )}

      {/* Image principale - taille réduite */}
      {!showWelcome && (
        <div className="absolute inset-0 flex justify-center items-center">
          {image ? (
            <img
              src={processedImage || image}
              alt="Prévisualisation"
              className="w-[90%] h-[90%] min-w-[600px] min-h-[500px] max-w-6xl max-h-[90vh] object-contain rounded-lg shadow-2xl"
              style={{
                filter: processedImage 
                  ? `brightness(${brightness}) drop-shadow(0 6px 12px rgba(0,0,0,0.6))` 
                  : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}
              onError={(e) => {
                console.error("❌ Erreur de chargement de l'image:", e);
                console.log("📸 Image source:", processedImage || image);
              }}
              onLoad={() => {
                console.log("✅ Image chargée avec succès:", processedImage ? "Image traitée" : "Image originale");
              }}
            />
          ) : (
            <div {...getRootProps()} className="border-2 border-dashed border-white/30 p-16 rounded-2xl cursor-pointer text-center bg-black/20 backdrop-blur-sm hover:border-white/50 transition-all">
              <input {...getInputProps()} />
              <UploadIcon size={64} className="mx-auto mb-6 opacity-70" />
              <p className="text-xl text-white/80 mb-2">Cliquez ou déposez une photo</p>
              <p className="text-sm text-white/60">Formats acceptés: JPG, PNG</p>
            </div>
          )}
          
          {/* Overlay de traitement - fond noir, logo Blue Reflet animé au centre */}
          {isLoading && image && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80">
              <video
                src="/assets/animation.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-40 h-40 object-contain drop-shadow-2xl"
              />
            </div>
          )}
          
          {errorMessage && (
            <div className={`absolute bottom-32 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl max-w-lg text-center shadow-2xl border ${
              errorMessage.includes('✅') ? 'bg-green-600 border-green-400' : 'bg-red-600 border-red-400'
            } text-white backdrop-blur-sm`}>
              <div className="flex items-center gap-3 justify-center">
                <span className="text-xl">{errorMessage.includes('✅') ? '✅' : '⚠️'}</span>
                <span className="text-sm font-medium">{errorMessage}</span>
              </div>
            </div>
          )}
          
          {/* Notification pour commencer le traitement */}
          {image && selectedNecklace && !isLoading && !processedImage && (
            <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-xl bg-blue-600/90 border border-blue-400 text-white backdrop-blur-sm animate-pulse">
              <div className="flex items-center gap-3 justify-center">
                <ProcessIcon size={24} />
                <span className="text-sm font-medium">Cliquez sur le bouton "Commencer" pour traiter votre image</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay SVG "en avant-plan" pendant le traitement déclenché par "Commencer" */}
      {!showWelcome && isLoading && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 99999 }}>
          <img
            src="/assets/BR-LogoA5.svg"
            alt="Animation Blue Reflet"
            className="w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] object-contain animate-grow-shrink"
            style={{
              opacity: 0.9,
              background: "transparent",
              filter: "drop-shadow(0 0 110px rgba(0,0,0,0.4))",
              zIndex: 99999,
              position: "relative"
            }}
          />
          <style>
            {`
              @keyframes grow-shrink {
                0% { transform: scale(1);}
                50% { transform: scale(1.25);}
                100% { transform: scale(1);}
              }
              .animate-grow-shrink {
                animation: grow-shrink 2s ease-in-out infinite;
              }
              @keyframes spin-slow {
                0% { transform: rotate(0deg);}
                100% { transform: rotate(360deg);}
              }
              @keyframes spin-reverse {
                0% { transform: rotate(0deg);}
                100% { transform: rotate(-360deg);}
              }
              @keyframes spin-tilt {
                0% { transform: rotate3d(1,1,0,0deg);}
                100% { transform: rotate3d(1,1,0,360deg);}
              }
              /* Pour utiliser une autre rotation, changez la classe ci-dessus par l'une de celles-ci :
                 animation: spin-reverse 6s linear infinite;
                 animation: spin-tilt 6s linear infinite;
              */
            `}
          </style>
        </div>
      )}

      {/* Barre du bas - agrandie pour plus de visibilité */}
      {!showWelcome && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[40%] min-w-[500px] max-w-[600px]">
          <div className="flex justify-between items-center px-6 py-4 bg-black/85 backdrop-blur-lg rounded-full border border-white/30 shadow-2xl">
            {/* Mannequins */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  console.log("🎯 Clic sur bouton mannequins, état actuel:", showMannequinDropdown);
                  setShowMannequinDropdown(!showMannequinDropdown);
                  setShowDropdown(false);
                }}
                className="flex items-center gap-2 px-2 py-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <UserIcon size={24} />
                <FaChevronDown size={10} className={`transition-transform text-white/50 ${showMannequinDropdown ? "rotate-180" : ""}`} />
              </button>
              
              {showMannequinDropdown && (
                <div className="absolute bottom-full left-0 mb-2 bg-white text-black rounded-lg shadow-lg min-w-[200px] max-w-[300px] max-h-[60vh] overflow-hidden z-[110]">
                  <div className="p-2 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Modèles ({assets.examples.length})</span>
                      {assetsLoading && <span className="text-xs text-gray-500 ml-2">(Chargement...)</span>}
                      {assetsError && <span className="text-xs text-red-500 ml-2">(Erreur)</span>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefreshAssets();
                      }}
                      className="text-gray-500 hover:text-indigo-600 transition-colors text-xs"
                      title="Actualiser la liste"
                    >
                      <i className="fas fa-refresh"></i>
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[50vh]">
                    {assets?.examples.map((m) => (
                      <div
                        key={m.path}
                        onClick={(e) => {
                          console.log("🎯 Clic détecté sur mannequin:", m.name);
                          e.stopPropagation();
                          handleMannequinSelect(m);
                        }}
                        className="flex gap-3 items-center p-3 hover:bg-gray-100 w-full transition-colors cursor-pointer"
                      >
                        <img src={`/assets/examples/${m.path}`} alt={m.name} className="w-8 h-8 rounded object-cover" />
                        <span className="text-sm">{m.name}</span>
                      </div>
                    )) || (
                      <div className="p-6 text-center text-gray-500">
                        {assetsLoading ? (
                          <div>
                            <i className="fas fa-spinner fa-spin text-xl mb-2"></i>
                            <p className="text-sm">Chargement...</p>
                          </div>
                        ) : (
                          <div>
                            <i className="fas fa-images text-2xl mb-2"></i>
                            <p className="text-sm font-medium">Aucun modèle trouvé</p>
                            <p className="text-xs mt-1">Ajoutez des images dans /assets/examples/</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Upload et Caméra */}
            <div className="flex items-center gap-2">
              {/* Upload fichier */}
              <div className="cursor-pointer">
                <input {...getInputProps()} id="file-upload" style={{ display: 'none' }} />
                <button 
                  className="flex items-center gap-2 px-2 py-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={(e) => {
                    console.log("📁 Clic sur bouton upload");
                    e.stopPropagation();
                    document.getElementById('file-upload')?.click();
                  }}
                >
                  <UploadIcon size={24} />
                </button>
              </div>
              
              {/* Caméra */}
              <button
                onClick={() => {
                  console.log("📷 Clic sur bouton caméra");
                  startCamera();
                }}
                className="flex items-center gap-2 px-2 py-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <CameraIcon size={24} />
              </button>
            </div>

            {/* Indicateur de traitement en cours */}
            {isLoading && (
              <div className="flex items-center gap-2 px-2 py-2">
                <video
                  key={isLoading ? "loading" : "not-loading"}
                  src="/assets/1.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-8 h-8 object-contain"
                  style={{ background: "transparent" }}
                />
                <span className="text-xs text-white/70 hidden md:block">Traitement...</span>
              </div>
            )}

            {/* Bouton de traitement - agrandi et plus visible */}
            {image && selectedNecklace && !isLoading && (
              <button
                onClick={() => {
                  console.log("🚀 Clic sur bouton Commencer - Lancement du traitement");
                  processImage();
                }}
                className="flex items-center gap-3 px-6 py-3 rounded-full hover:bg-blue-600 transition-all bg-blue-500 text-white font-bold shadow-2xl transform hover:scale-105 border-2 border-blue-300/50"
                title="Commencer le traitement"
              >
                <span className="text-base">Commencer</span>
              </button>
            )}

            {/* Bouton de sauvegarde */}
            {processedImage && (
              <button
                onClick={saveImage}
                className="flex items-center gap-2 px-2 py-2 rounded-full hover:bg-white/10 transition-colors"
                title="Sauvegarder l'image"
              >
                <SaveIcon size={24} />
              </button>
            )}

            {/* Colliers */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  console.log("🎯 Clic sur bouton colliers, état actuel:", showDropdown);
                  setShowDropdown(!showDropdown);
                  setShowMannequinDropdown(false);
                }}
                className="flex items-center gap-2 px-2 py-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <NecklaceIcon size={24} />
                <span className="text-xs text-white/70 hidden md:block">
                  {selectedNecklace ? 
                    assets?.colliers.find(n => n.path === selectedNecklace)?.name || "Collier" 
                    : "Collier"
                  }
                </span>
                <FaChevronDown size={10} className={`transition-transform text-white/50 ${showDropdown ? "rotate-180" : ""}`} />
              </button>
              
              {showDropdown && (
                <div className="absolute bottom-full right-0 mb-2 bg-white text-black rounded-lg shadow-lg min-w-[200px] max-w-[300px] max-h-[60vh] overflow-hidden z-[110]">
                  <div className="p-2 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Colliers ({assets.colliers.length})</span>
                      {assetsLoading && <span className="text-xs text-gray-500 ml-2">(Chargement...)</span>}
                      {assetsError && <span className="text-xs text-red-500 ml-2">(Erreur)</span>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefreshAssets();
                      }}
                      className="text-gray-500 hover:text-indigo-600 transition-colors text-xs"
                      title="Actualiser la liste"
                    >
                      <i className="fas fa-refresh"></i>
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[50vh]">
                    {assets?.colliers.map((n) => (
                      <div
                        key={n.path}
                        onClick={(e) => {
                          console.log("🎯 Clic détecté sur collier:", n.name);
                          e.stopPropagation();
                          handleNecklaceSelect(n);
                        }}
                        className="flex gap-3 items-center p-3 hover:bg-gray-100 w-full transition-colors cursor-pointer"
                      >
                        <img src={`/assets/colliers/${n.path}`} alt={n.name} className="w-8 h-8 object-contain" />
                        <span className="text-sm">{n.name}</span>
                        {selectedNecklace === n.path && (
                          <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    )) || (
                      <div className="p-6 text-center text-gray-500">
                        {assetsLoading ? (
                          <div>
                            <i className="fas fa-spinner fa-spin text-xl mb-2"></i>
                            <p className="text-sm">Chargement...</p>
                          </div>
                        ) : (
                          <div>
                            <i className="fas fa-gem text-2xl mb-2"></i>
                            <p className="text-sm font-medium">Aucun collier trouvé</p>
                            <p className="text-xs mt-1">Ajoutez des images dans /assets/colliers/</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      onClick={(e) => {
                        console.log("🎯 Clic détecté sur 'Aucun collier'");
                        e.stopPropagation();
                        setSelectedNecklace(null);
                        setShowDropdown(false);
                      }}
                      className="text-sm text-gray-500 p-3 hover:bg-gray-100 w-full text-left border-t border-gray-200 cursor-pointer sticky bottom-0 bg-white"
                    >
                      Aucun collier
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pas d'overlay - les dropdowns se ferment automatiquement */}
    </div>
  );
};

export default PhotoTestView;


