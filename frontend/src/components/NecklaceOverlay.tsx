import React, { useState, useEffect, useRef } from 'react';
import * as faceMesh from '@mediapipe/face_mesh';
import * as pose from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

// Importer vos images...
import necklace0 from '../assets/dataset/soo-0000-Photoroom.png';
import necklace1 from '../assets/dataset/soo-0001-Photoroom.png';
import necklace2 from '../assets/dataset/soo-0002-Photoroom.png';
import necklace3 from '../assets/dataset/soo-0003-Photoroom.png';
import necklace4 from '../assets/dataset/soo-0004-Photoroom.png';
import necklace5 from '../assets/dataset/soo-0005-Photoroom.png';
import necklace6 from '../assets/dataset/soo-0006-Photoroom.png';
import necklace7 from '../assets/dataset/soo-0007-Photoroom.png';
import necklace8 from '../assets/dataset/soo-0008-Photoroom.png';
import necklace9 from '../assets/dataset/soo-0009-Photoroom.png';
import necklace10 from '../assets/dataset/soo-0010-Photoroom.png';

const necklaceImages = [
  necklace0, necklace1, necklace2, necklace3, necklace4,
  necklace5, necklace6, necklace7, necklace8, necklace9, necklace10
];

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  onStatsUpdate?: (stats: {
    detectedPoints: number;
    confidence: number;
    processingTime: number;
  }) => void;
}

const NecklaceOverlay: React.FC<Props> = ({ videoRef, onStatsUpdate }) => {
  const [necklaceIndex, setNecklaceIndex] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0, scale: 1 });
  const [debugInfo, setDebugInfo] = useState<string>('Initialisation...');
  const [showGuide, setShowGuide] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // -- Refs Mediapipe --
  const faceMeshRef = useRef<faceMesh.FaceMesh | null>(null);
  const poseRef = useRef<pose.Pose | null>(null);

  // Derniers résultats
  const faceMeshResultsRef = useRef<faceMesh.Results | null>(null);
  const poseResultsRef = useRef<pose.Results | null>(null);

  // Mémoire du collier
  const lastValidPositionRef = useRef({ x: 0, y: 0, scale: 1, angle: 0 });

  // Filtrage exponentiel avec facteur de lissage plus faible pour plus de réactivité
  const smoothingFactor = 0.3;
  const smoothValue = (current: number, previous: number) =>
    previous + (current - previous) * smoothingFactor;

  // Timestamps
  const timeStatsRef = useRef<{
    tFrameStart: number;
    tAfterFaceMesh: number;
    tBeforeOverlay: number;
    tPoseStart: number;
    tPoseBeforeInference: number;
    tPoseEnd: number;
  }>({
    tFrameStart: 0,
    tAfterFaceMesh: 0,
    tBeforeOverlay: 0,
    tPoseStart: 0,
    tPoseBeforeInference: 0,
    tPoseEnd: 0,
  });

  // Pour sauter des frames
  let frameCounter = 0;
  const frameSkip = 2; // Traiter 1 frame sur 2 pour Pose

  // Refs pour le calcul de confiance
  const lastPositionsRef = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const lastConfidenceRef = useRef<number>(0);
  const MAX_POSITIONS = 15; // Augmenté pour plus de lissage
  const SMOOTHING_FACTOR = 0.15; // Facteur de lissage pour la confiance
  const POSITION_THRESHOLD = 50; // Seuil de distance en pixels pour considérer un mouvement comme important
  const LATENCY_THRESHOLD = 100; // Seuil de latence en ms

  const calculateConfidence = (
    currentX: number,
    currentY: number,
    neckY: number,
    shoulderDistance: number,
    processingTime: number
  ): number => {
    const now = performance.now();

    // Ajouter la position actuelle à l'historique
    lastPositionsRef.current.push({ x: currentX, y: currentY, time: now });
    if (lastPositionsRef.current.length > MAX_POSITIONS) {
      lastPositionsRef.current.shift();
    }

    // 1. Score de latence (0-100, progressif)
    const latencyScore = Math.max(0, Math.min(100, 100 * (1 - processingTime / 200)));

    // 2. Score de position verticale (0-100, progressif)
    const idealNeckDistance = shoulderDistance * 0.2; // Distance idéale basée sur la largeur des épaules
    const currentNeckDistance = Math.abs(currentY - neckY);
    const positionScore = Math.max(0, Math.min(100, 100 * (1 - currentNeckDistance / (idealNeckDistance * 2))));

    // 3. Score de stabilité (0-100, progressif)
    let stabilityScore = 100;
    if (lastPositionsRef.current.length >= 2) {
      const positions = lastPositionsRef.current;
      let velocities: number[] = [];

      // Calculer les vélocités instantanées
      for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i-1].x;
        const dy = positions[i].y - positions[i-1].y;
        const dt = positions[i].time - positions[i-1].time;
        const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
        velocities.push(velocity);
      }

      // Calculer la variance des vélocités pour détecter les mouvements irréguliers
      const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
      const variance = velocities.reduce((a, b) => a + Math.pow(b - avgVelocity, 2), 0) / velocities.length;
      
      // Pénaliser les mouvements irréguliers de manière progressive
      stabilityScore = Math.max(0, Math.min(100, 100 * (1 - variance / 5)));
    }

    // Combiner les scores avec pondération
    const rawScore = (
      latencyScore * 0.3 +
      positionScore * 0.4 +
      stabilityScore * 0.3
    ) / 100;

    // Appliquer un lissage temporel pour éviter les changements brusques
    const smoothedScore = lastConfidenceRef.current +
      (rawScore - lastConfidenceRef.current) * SMOOTHING_FACTOR;
    
    lastConfidenceRef.current = smoothedScore;
    
    return smoothedScore;
  };

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    let camera: Camera | null = null;
    let isRunning = true;

    const initializeMediaPipe = async () => {
      try {
        setDebugInfo('Chargement FaceMesh & Pose...');

        // 1) FaceMesh
        const faceMeshInstance = new faceMesh.FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
          },
        });
        faceMeshInstance.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          enableFaceGeometry: false, // Désactiver les fonctionnalités non utilisées
        });

        faceMeshInstance.onResults((results) => {
          if (!isRunning) return;
          const deltaFaceMesh = performance.now() - timeStatsRef.current.tFrameStart;
          timeStatsRef.current.tAfterFaceMesh = performance.now();

          faceMeshResultsRef.current = results;

          // Calculer les statistiques
          const faceLandmarks = results.multiFaceLandmarks?.[0];
          
          // Si on a déjà des résultats Pose, on peut appeler updateOverlay
          if (poseResultsRef.current) {
            timeStatsRef.current.tBeforeOverlay = performance.now();
            updateOverlay(results, poseResultsRef.current, deltaFaceMesh);
          }
        });
        faceMeshRef.current = faceMeshInstance;

        // 2) Pose
        const poseInstance = new pose.Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.4.1633558788/${file}`;
          },
        });
        poseInstance.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          enableSegmentation: false, // Désactiver la segmentation non utilisée
        });

        poseInstance.onResults((results) => {
          if (!isRunning) return;

          timeStatsRef.current.tPoseBeforeInference = performance.now();
          timeStatsRef.current.tPoseEnd = performance.now();

          const deltaPose = performance.now() - timeStatsRef.current.tAfterFaceMesh;
          timeStatsRef.current.tBeforeOverlay = performance.now();

          poseResultsRef.current = results;

          if (faceMeshResultsRef.current) {
            updateOverlay(faceMeshResultsRef.current, results, undefined, deltaPose);
          }
        });
        poseRef.current = poseInstance;

        setDebugInfo('FaceMesh & Pose initialisés');

        // 3) Caméra avec résolution encore plus réduite
        camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (!isRunning) return;
            try {
              timeStatsRef.current.tFrameStart = performance.now();

              // FaceMesh avec frame skipping léger
              if (faceMeshRef.current && frameCounter % 2 === 0) {
                await faceMeshRef.current.send({ image: videoRef.current });
              }

              // Pose avec frame skipping plus agressif
              frameCounter++;
              if (frameCounter % 3 === 0) {
                timeStatsRef.current.tPoseStart = performance.now();
                if (poseRef.current) {
                  await poseRef.current.send({ image: videoRef.current });
                }
              }
            } catch (error: any) {
              if (!isRunning) return;
              console.error('Erreur frame:', error);
              setDebugInfo(`Erreur frame: ${error.message}`);
            }
          },
          width: 480, // Réduit de 640 à 480
          height: 270, // Réduit de 360 à 270
        });

        await camera.start();
        setDebugInfo('Caméra démarrée (480x270, skip 1/2 frames pour Pose)');
      } catch (error: any) {
        console.error('Erreur init:', error);
        setDebugInfo(`Erreur init: ${error.message}`);
      }
    };

    initializeMediaPipe();

    return () => {
      isRunning = false;
      camera?.stop();
      faceMeshRef.current?.close();
      poseRef.current?.close();
    };
  }, [videoRef]);

  const updateOverlay = (
    faceResults: faceMesh.Results,
    poseResults: pose.Results,
    deltaFaceMesh?: number,
    deltaPose?: number
  ) => {
    const tStartOverlay = performance.now();

    const faceLandmarks = faceResults.multiFaceLandmarks?.[0];
    const poseLandmarks = poseResults.poseLandmarks;
    if (!faceLandmarks || !poseLandmarks) return;

    // Points visage
    const leftEye = faceLandmarks[33];
    const rightEye = faceLandmarks[263];
    const chin = faceLandmarks[152];

    // Épaules
    const leftShoulder = poseLandmarks[11];
    const rightShoulder = poseLandmarks[12];

    const displayWidth = videoRef.current?.offsetWidth || 1;
    const displayHeight = videoRef.current?.offsetHeight || 1;

    // Calcul angle visage
    const rawAngle = -Math.atan2(
      rightEye.y - leftEye.y,
      rightEye.x - leftEye.x
    );
    const smoothedAngle = smoothValue(rawAngle, lastValidPositionRef.current.angle);

    // Position cou (70% épaules / 30% menton)
    const shouldersMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shouldersMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const shouldersMidXPx = shouldersMidX * displayWidth;
    const shouldersMidYPx = shouldersMidY * displayHeight;
    const chinX = chin.x * displayWidth;
    const chinY = chin.y * displayHeight;

    const neckX = 0.7 * shouldersMidXPx + 0.3 * chinX;
    const neckY = 0.7 * shouldersMidYPx + 0.3 * chinY;

    // Offsets
    const verticalOffset = 10;
    const horizontalOffset = 5;
    const newX = (displayWidth - neckX) + horizontalOffset;
    const newY = neckY + verticalOffset;

    // Échelle
    const shoulderDist = Math.hypot(
      (rightShoulder.x - leftShoulder.x) * displayWidth,
      (rightShoulder.y - leftShoulder.y) * displayHeight
    );
    const faceWidth = Math.abs(leftEye.x - rightEye.x) * displayWidth;

    const rawScale = (shoulderDist + faceWidth) / 620 + 0.08;
    const smoothedScale = smoothValue(rawScale, lastValidPositionRef.current.scale);

    // Index collier
    let index = Math.round(smoothedAngle * 11 / (2 * Math.PI));
    if (Math.abs(smoothedAngle) < 0.3) {
      index = 10;
    }
    index = Math.max(0, Math.min(10, index));

    // Calcul du score de confiance avec les nouvelles positions
    const confidence = calculateConfidence(
      newX,
      newY,
      neckY,
      shoulderDist, // Ajouter la distance des épaules
      deltaFaceMesh || 0
    );

    const stats = {
      detectedPoints: faceLandmarks.length,
      confidence: confidence,
      processingTime: deltaFaceMesh || 0
    };
    onStatsUpdate?.(stats);

    // Mise à jour
    const smoothedPosX = smoothValue(newX, lastValidPositionRef.current.x);
    const smoothedPosY = smoothValue(newY, lastValidPositionRef.current.y);

    lastValidPositionRef.current = {
      x: smoothedPosX,
      y: smoothedPosY,
      scale: smoothedScale,
      angle: smoothedAngle,
    };

    setNecklaceIndex(index);
    setPosition({ x: smoothedPosX, y: smoothedPosY, scale: smoothedScale });

    // Temps overlay
    const deltaOverlay = performance.now() - tStartOverlay;

    // Timestamps Pose
    const { tPoseStart, tPoseBeforeInference, tPoseEnd } = timeStatsRef.current;
    const poseStartToBeforeInference = (tPoseBeforeInference - tPoseStart).toFixed(1);
    const poseInferenceToEnd = (tPoseEnd - tPoseBeforeInference).toFixed(1);

    // Format final
    const dFM = deltaFaceMesh?.toFixed(1) ?? '0';
    const dP = deltaPose?.toFixed(1) ?? '0';
    const dO = deltaOverlay.toFixed(1);

    // MàJ debug – 1 seul setState
    setDebugInfo(
      `FaceMesh: ${dFM} ms | Pose: ${dP} ms | Overlay: ${dO} ms | ` +
        `PoseDetails: start->beforeInf:${poseStartToBeforeInference}ms, ` +
        `beforeInf->end:${poseInferenceToEnd}ms`
    );
  };

  const NecklaceControlsGuide: React.FC<{ isVisible: boolean; onClose: () => void }> = ({ 
    isVisible, 
    onClose 
  }) => {
    const [activeControl, setActiveControl] = useState<string | null>(null);

    const controls = {
      position: {
        title: "Le collier apparaît automatiquement!    Positionnez vous bien au centre de l'image pour faire apparaitre le collier rapidement",
      }
    };

    if (!isVisible) return null;

    return (
      <div className="absolute right-4 top-4 w-72 bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-white/20 overflow-hidden"
           style={{ pointerEvents: 'auto', zIndex: 1000 }}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Contrôles du Collier
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {Object.entries(controls).map(([key, control]) => (
            <div
              key={key}
              className="p-4 hover:bg-emerald-50 transition-colors cursor-help"
              onMouseEnter={() => setActiveControl(key)}
              onMouseLeave={() => setActiveControl(null)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{control.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {control.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {control.shortcut}
                    </span>
                  </div>
                </div>
              </div>
              
              {activeControl === key && (
                <p className="mt-2 text-sm text-gray-600 animate-fadeIn">
                  {control.description}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg
                     hover:bg-emerald-600 transition-colors text-sm font-medium"
          >
            Compris !
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <NecklaceControlsGuide 
        isVisible={showGuide} 
        onClose={() => setShowGuide(false)} 
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Le collier */}
      <img
        src={necklaceImages[necklaceIndex]}
        alt="Collier"
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${position.scale}) rotate(${lastValidPositionRef.current.angle}rad)`,
          maxWidth: '300px',
          opacity: 0.9,
        }}
      />

      {/* Zone debug */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000,
        }}
      >
        État: {debugInfo}
      </div>
    </div>
  );
};

export default NecklaceOverlay;
