import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Importation des images des colliers
const necklaceImages = Array.from({ length: 11 }, (_, i) =>
  `/assets/Photoroom/soo-${String(i).padStart(4, '0')}-Photoroom.png`
);

interface Props {
  modelPath: string;
}

const ThreeViewer: React.FC<Props> = ({ modelPath }) => {
  console.log('[ThreeViewer] Composant monté avec modelPath:', modelPath);

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const necklaceModelRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const previousMouseXRef = useRef(0);
  const rotationRef = useRef(0);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Plane pour le collier
  const necklaceMeshRef = useRef<THREE.Mesh | null>(null);

  // État de chargement
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Index de collier actuel
  const [currentNecklaceIndex, setCurrentNecklaceIndex] = useState(0);

  // Stockage des textures de colliers
  const necklaceTexturesRef = useRef<THREE.Texture[]>([]);

  /************************************************
   *               CRÉATION DU PLANE
   ***********************************************/
  const createNecklacePlane = (texture: THREE.Texture) => {
    console.log('[createNecklacePlane] Création du plane pour la texture:', texture.image.src);

    const aspectRatio = texture.image.width / texture.image.height;
    const width = 1.0; // Taille de base
    const height = width / aspectRatio;

    const geometry = new THREE.PlaneGeometry(width, height);

    // Rétablir la couleur originale et activer la transparence
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0xffffff, // Couleur originale
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      alphaTest: 0.1, // Ajusté pour plus de détails
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.renderOrder = 999; // Assure que le plane est rendu après le modèle
    return plane;
  };

  /************************************************
   *           MISE À JOUR DE LA TEXTURE
   ***********************************************/
  const updateNecklaceTexture = () => {
    if (
      !cameraRef.current ||
      !modelRef.current ||
      !necklaceMeshRef.current ||
      necklaceTexturesRef.current.length === 0
    ) {
      return;
    }

    const camera = cameraRef.current;
    const model = modelRef.current;
    const modelPosition = new THREE.Vector3();
    model.getWorldPosition(modelPosition);
    const cameraPosition = camera.position.clone();

    // Calculer l'angle horizontal (yaw) entre la caméra et le modèle
    const direction = new THREE.Vector3().subVectors(cameraPosition, modelPosition);
    const angle = Math.atan2(direction.x, direction.z);

    // Convertir l'angle de [-π, π] à [0, 360] degrés
    const normalizedAngle = ((angle + Math.PI) / (2 * Math.PI)) * 360;
    let newIndex = Math.floor((normalizedAngle / 360) * necklaceImages.length);
    newIndex = Math.max(0, Math.min(necklaceImages.length - 1, newIndex));

    if (newIndex !== currentNecklaceIndex) {
      console.log('[updateNecklaceTexture] Switch collier index:', currentNecklaceIndex, '->', newIndex);
      setCurrentNecklaceIndex(newIndex);

      // Mise à jour du map
      const material = necklaceMeshRef.current.material as THREE.MeshBasicMaterial;
      material.map = necklaceTexturesRef.current[newIndex];
      material.needsUpdate = true;
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    isDraggingRef.current = true;
    previousMouseXRef.current = e.clientX;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !cameraRef.current) return;

    const deltaX = e.clientX - previousMouseXRef.current;
    previousMouseXRef.current = e.clientX;

    // Convertir le mouvement de la souris en rotation (en radians)
    const rotationDelta = (deltaX * 0.01);
    
    // Calculer la nouvelle rotation potentielle
    const newRotation = rotationRef.current + rotationDelta;
    
    // Limiter la rotation à ±40 degrés (±0.698 radians)
    const maxRotation = (40 * Math.PI) / 180;
    
    if (newRotation >= -maxRotation && newRotation <= maxRotation) {
      rotationRef.current = newRotation;
      
      // Calculer la nouvelle position de la caméra
      const radius = 2; // Distance de la caméra au centre
      const x = radius * Math.sin(rotationRef.current);
      const z = radius * Math.cos(rotationRef.current);
      
      cameraRef.current.position.x = x;
      cameraRef.current.position.z = z;
      cameraRef.current.lookAt(0, 1.5, 0);
      
      console.log('Rotation (degrés):', (rotationRef.current * 180) / Math.PI);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    /**** SCENE ****/
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    sceneRef.current = scene;

    /**** CAMERA ****/
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 2);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    /**** RENDERER ****/
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    /**** EVENT LISTENERS ****/
    const container = containerRef.current;
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    /**** LUMIÈRES ****/
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(0, 2, 2);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-2, 0, -2);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backLight.position.set(0, 2, -2);
    scene.add(backLight);

    /**** CHARGEMENTS ****/
    console.log('[ThreeViewer] Début du chargement :', modelPath);
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    Promise.all([
      // 1) Le modèle principal
      new Promise<THREE.Group>((resolve, reject) => {
        console.log('[ThreeViewer] Début du chargement du modèle principal:', modelPath);
        loader.load(
          modelPath,
          (gltf) => {
            console.log('[ThreeViewer] Modèle principal chargé avec succès:', modelPath);
            resolve(gltf.scene);
          },
          (progress) => {
            console.log('[ThreeViewer] Progression du chargement:', Math.round((progress.loaded / progress.total) * 100) + '%');
          },
          (error) => {
            console.error('[ThreeViewer] Erreur lors du chargement du modèle principal:', error);
            reject(error);
          }
        );
      }),
      // 2) Le modèle du collier
      new Promise<THREE.Group>((resolve, reject) => {
        const necklacePath = window.location.origin + '/assets/necklaxcetest.glb';
        console.log('[ThreeViewer] Début du chargement du collier:', necklacePath);
        loader.load(
          necklacePath,
          (gltf) => {
            console.log('[ThreeViewer] Collier chargé avec succès');
            
            // Analyser la structure du modèle
            console.log('[ThreeViewer] Structure du modèle du collier:');
            gltf.scene.traverse((child) => {
              console.log('- Objet trouvé:', {
                name: child.name,
                type: child.type,
                isVisible: child.visible,
                position: child.position,
                scale: child.scale
              });
            });
            
            resolve(gltf.scene);
          },
          (progress) => {
            console.log('[ThreeViewer] Progression du chargement du collier:', Math.round((progress.loaded / progress.total) * 100) + '%');
          },
          (error) => {
            console.error('[ThreeViewer] Erreur lors du chargement du collier:', error);
            reject(error);
          }
        );
      }),
      // 3) Les textures
      ...necklaceImages.map((path) => {
        return new Promise<THREE.Texture>((resolve, reject) => {
          console.log('[ThreeViewer] Chargement texture collier :', path);
          textureLoader.load(
            path,
            (texture) => {
              console.log('[ThreeViewer] Texture collier chargée :', path);
              texture.colorSpace = THREE.SRGBColorSpace;
              resolve(texture);
            },
            undefined,
            (err) => {
              console.error('[ThreeViewer] Erreur chargement texture', path, err);
              reject(err);
            }
          );
        });
      }),
    ])
      .then(([mainModel, necklaceModel, ...textures]) => {
        console.log('[ThreeViewer] Toutes les ressources ont été chargées.');
        
        // Configurer le modèle principal
        modelRef.current = mainModel;
        scene.add(mainModel);
        console.log('[ThreeViewer] Modèle principal ajouté à la scène');

        // Configurer le collier
        necklaceModelRef.current = necklaceModel;
        
        // Ajuster l'échelle et la position du collier
        necklaceModel.scale.set(0.1, 0.1, 0.1); // Réduire l'échelle
        necklaceModel.position.set(0, 1.4, 0.1); // Positionner au niveau du cou
        
        scene.add(necklaceModel);
        console.log('[ThreeViewer] Collier ajouté à la scène');

        // Stocker les textures
        necklaceTexturesRef.current = textures as THREE.Texture[];

        // Mettre à jour la world matrix
        mainModel.updateWorldMatrix(true, true);
        necklaceModel.updateWorldMatrix(true, true);

        setIsLoading(false);

        // Animation
        const animate = () => {
          if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

          // Mettre à jour les contrôles
          if (controlsRef.current) {
            controlsRef.current.update();
          }

          // Si le modèle principal tourne, faire tourner le collier aussi
          if (modelRef.current && necklaceModelRef.current) {
            necklaceModelRef.current.rotation.y = modelRef.current.rotation.y;
          }

          // Mettre à jour la texture du collier
          updateNecklaceTexture();
          
          rendererRef.current.render(sceneRef.current, cameraRef.current);
          requestAnimationFrame(animate);
        };

        animate();
      })
      .catch((err) => {
        console.error('[ThreeViewer] Erreur globale :', err);
        setError(`Erreur lors du chargement : ${err}`);
        setIsLoading(false);
      });

    /**** CLEANUP ****/
    const cleanup = () => {
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };

    /**** RESIZE ****/
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [modelPath]);

  /************************************************
   *                EFFET PRINCIPAL
   ***********************************************/
  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    
    // Mettre à jour la rotation du modèle si nécessaire
    if (modelRef.current) {
      // updateModelRotation();
    }
    
    updateNecklaceTexture();
    // updateNecklacePosition();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    animate();
  }, []);

  /************************************************
   *                 RENDU JSX
   ***********************************************/
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full cursor-grab active:cursor-grabbing relative"
      style={{ 
        touchAction: 'none',
        position: 'relative',
        minHeight: '500px'
      }}
    >
      {isLoading && <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>}
      {error && <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>}
    </div>
  );
};

export default ThreeViewer;