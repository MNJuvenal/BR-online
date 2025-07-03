import React, { useEffect, useRef } from 'react';
import '@mediapipe/face_mesh';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  onLandmarksDetected?: (landmarks: any) => void;
}

const FaceLandmarksDetector: React.FC<Props> = ({ videoRef, onLandmarksDetected }) => {
  const detectorRef = useRef<any>(null);
  const isRunningRef = useRef(false);
  const frameCountRef = useRef(0);
  const consecutiveNoFaceRef = useRef(0);

  useEffect(() => {
    const initializeDetector = async () => {
      try {
        // Vérifie si WebGL est dispo (optionnel, déjà fait en partie dans CameraView)
        await tf.setBackend('webgl');
        await tf.ready();

        console.log('TFJS backend initialized');

        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1,
          shouldLoadIrisModel: false,
        };

        detectorRef.current = await faceLandmarksDetection.createDetector(model, detectorConfig);
        console.log('Face detector initialized successfully');
      } catch (error) {
        console.error('Error initializing face detector:', error);
      }
    };

    initializeDetector();

    return () => {
      isRunningRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) {
      console.warn('No video ref found, skipping detection.');
      return;
    }
    if (!detectorRef.current) {
      console.warn('Detector not initialized yet.');
      return;
    }

    const processVideo = async () => {
      // Si on a arrêté la détection, on ne relance pas
      if (!isRunningRef.current) return;

      // Vérif basique : la vidéo est-elle prête / non 0x0 ?
      const videoEl = videoRef.current;
      if (!videoEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
        // Attendre un peu et retenter
        setTimeout(() => requestAnimationFrame(processVideo), 200);
        return;
      }

      frameCountRef.current += 1;
      // On process 1 frame sur 2 ou 3 (pour limiter la charge)
      const skipFrames = 2; // Nombre de frames à ignorer entre deux détections
      const isKeyFrame = frameCountRef.current % skipFrames === 0;

      if (isKeyFrame && detectorRef.current) {
        try {
          // On ajoute un timeStart pour mesurer la perf
          const timeStart = performance.now();
          console.log('Processing frame:', frameCountRef.current);

          // flipHorizontal = true car la vidéo est miroir côté CSS
          const predictions = await detectorRef.current.estimateFaces(videoEl, {
            flipHorizontal: true,
            staticImageMode: false,
            predictIrises: false,
          });

          const elapsed = performance.now() - timeStart;

          if (predictions && predictions.length > 0) {
            consecutiveNoFaceRef.current = 0;
            console.log('Face detected, keypoints:', predictions[0].keypoints.length);

            // On va calculer un "score de confiance" simple
            let avgConfidence = 0;
            if (predictions[0].keypoints && predictions[0].keypoints.length > 0) {
              // Certain keypoints ont un attribut "score" (selon la version)
              const total = predictions[0].keypoints.reduce(
                (acc: number, kpt: any) => acc + (kpt.score || 0),
                0
              );
              avgConfidence = total / predictions[0].keypoints.length;
            }

            // Normalise les keypoints
            const keypoints = predictions[0].keypoints;
            const normalizedKeypoints = keypoints.map((point: any) => ({
              x: point.x / videoEl.videoWidth,
              y: point.y / videoEl.videoHeight,
              z: point.z || 0,
              name: point.name || '', // parfois c'est null
            }));

            if (onLandmarksDetected) {
              onLandmarksDetected(normalizedKeypoints);
            }

            // On peut log ou renvoyer des metrics, si on veut
            // ...
          } else {
            consecutiveNoFaceRef.current += 1;
            console.log('No face detected (#', consecutiveNoFaceRef.current, ')');
          }

          // On peut renvoyer un metric "processing time" pour l’UI
          // ...
        } catch (error) {
          console.error('Error during face detection:', error);
        }
      }

      // Re-boucler (de façon asynchrone) si isRunningRef est toujours vrai
      if (isRunningRef.current) {
        // Au lieu de `requestAnimationFrame`, on peut combiner un setTimeout
        // pour limiter la charge
        setTimeout(() => requestAnimationFrame(processVideo), 10);
      }
    };

    console.log('Starting video processing');
    isRunningRef.current = true;
    requestAnimationFrame(processVideo);

    return () => {
      console.log('Stopping video processing');
      isRunningRef.current = false;
    };
  }, [videoRef, onLandmarksDetected]);

  return null;
};

export default FaceLandmarksDetector;
