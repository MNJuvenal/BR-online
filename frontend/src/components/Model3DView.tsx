import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'three/examples/jsm/libs/stats.module';

// ***** IMPORT DU MOTEUR PHYSIQUE cannon-es *****
import * as CANNON from 'cannon-es';

interface Model3DViewProps {
  modelPath: string;
}

const Model3DView: React.FC<Model3DViewProps> = ({ modelPath }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pour l'affichage des stats
  const [isLoading, setIsLoading] = useState(true);
  const [fps, setFps] = useState<number>(0);
  const [triangles, setTriangles] = useState<number>(0);
  const [drawCalls, setDrawCalls] = useState<number>(0);

  // Pour le calcul du FPS
  const frameCountRef = useRef(0);
  const lastTimeCheckRef = useRef(performance.now());

  // Refs
  const statsRef = useRef<Stats>();

  // ---- Refs pour la 3D
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const necklaceMeshRef = useRef<THREE.Group | null>(null);

  // ---- Dimensions du modèle (après mise à l'échelle)
  const modelDimensionsRef = useRef<{
    scaledHeight: number;
    scaledSize: THREE.Vector3;
  }>({ scaledHeight: 0, scaledSize: new THREE.Vector3() });

  // ---- Refs pour la physique (Cannon)
  const worldRef = useRef<CANNON.World | null>(null);
  const necklaceBodiesRef = useRef<CANNON.Body[]>([]);
  const necklaceConstraintsRef = useRef<CANNON.DistanceConstraint[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    let isComponentMounted = true;

    // -------------------------
    // 1) Initialisation SCENE 3D
    // -------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x232323);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      2000
    );
    camera.position.set(2, 2, 4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Stats
    const stats = new Stats();
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '10px';
    stats.dom.style.right = '10px';
    containerRef.current.appendChild(stats.dom);
    statsRef.current = stats;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enablePan = false;

    // Grid
    const gridSize = 100;
    const divisions = 100;
    const gridHelper = new THREE.GridHelper(gridSize, divisions);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.6;
    scene.add(gridHelper);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x232323,
      transparent: true,
      opacity: 1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.001;
    scene.add(ground);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // -------------------------
    // 2) Initialisation Cannon-es
    // -------------------------
    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });
    // Pour une simulation plus stable
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = true;
    world.solver.iterations = 15;
    worldRef.current = world;

    // -------------------------
    // 3) Chargement du modèle principal
    // -------------------------
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Activer les ombres
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Centrer + scaler
        const boundingBox = new THREE.Box3().setFromObject(model);
        const size = boundingBox.getSize(new THREE.Vector3());
        const center = boundingBox.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.set(scale, scale, scale);

        // Recalculer bounding box après scale
        const scaledBoundingBox = new THREE.Box3().setFromObject(model);
        const scaledSize = scaledBoundingBox.getSize(new THREE.Vector3());
        const scaledHeight = scaledSize.y;

        modelDimensionsRef.current = {
          scaledHeight,
          scaledSize
        };

        // Placer au sol
        model.position.sub(center.multiplyScalar(scale));
        model.position.y = scaledHeight / 2;

        // Ajuster caméra
        const maxModelDim = Math.max(scaledSize.x, scaledSize.z);
        const distance = maxModelDim * 2;
        camera.position.set(0, scaledHeight / 2, distance);
        camera.lookAt(0, scaledHeight / 2, 0);
        controls.target.set(0, scaledHeight / 2, 0);
        controls.minDistance = maxModelDim;
        controls.maxDistance = maxModelDim * 4;

        // -------------------------
        // 4) Sphère pour le cou/épaules
        // -------------------------
        // On descend un peu la sphère et on l'élargit
        // + friction très haute => collier glisse moins
        const neckCenter = new CANNON.Vec3(0, scaledHeight * 0.12, 0);
        const neckRadius = 0.5;

        const neckBody = new CANNON.Body({
          type: CANNON.BODY_TYPES.STATIC,
          shape: new CANNON.Sphere(neckRadius),
          position: neckCenter,
          material: new CANNON.Material({
            friction: 100.0,   // friction maxi
            restitution: 0.05,
          }),
        });
        world.addBody(neckBody);

        // -------------------------
        // 5) Chargement du collier
        // -------------------------
        const necklacePath = '/assets/necklaxcetest.glb';
        loader.load(
          necklacePath,
          (necklaceGltf) => {
            const necklaceModel = necklaceGltf.scene.clone();

            // Mesh standard
            necklaceModel.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.geometry) {
                  mesh.geometry = mesh.geometry.clone().toNonIndexed();
                }
                if (mesh.material) {
                  mesh.material = new THREE.MeshStandardMaterial({
                    metalness: 0.3,
                    roughness: 0.7,
                    flatShading: true,
                    dithering: false
                  });
                }
              }
            });

            necklaceModel.scale.set(0.35, 0.35, 0.35);
            scene.add(necklaceModel);
            necklaceMeshRef.current = necklaceModel;

            // -------------------------
            // 6) Créer la chaîne du collier (physique)
            // -------------------------
            const chainSize = 15;
            const chainRadius = 0.05;
            // On démarre un peu plus haut => 0.7
            const offsetHeight = scaledHeight * 0.7;
            const centerX = 0;
            const centerZ = 0;

            const bodies: CANNON.Body[] = [];
            const constraints: CANNON.DistanceConstraint[] = [];

            for (let i = 0; i < chainSize; i++) {
              // Disposition initiale en cercle
              const angle = (i / chainSize) * Math.PI * 2;
              const x = centerX + Math.cos(angle) * 0.3;
              const z = centerZ + Math.sin(angle) * 0.3;
              const y = offsetHeight + 0.5;

              const shape = new CANNON.Sphere(chainRadius);
              const body = new CANNON.Body({
                mass: 0.1,
                shape,
                position: new CANNON.Vec3(x, y, z),
                material: new CANNON.Material({
                  friction: 0.6,
                  restitution: 0.0,
                }),
                linearDamping: 0.3,
                angularDamping: 0.3,
              });

              world.addBody(body);
              bodies.push(body);

              if (i > 0) {
                const prevBody = bodies[i - 1];
                const restDistance = chainRadius * 2;
                const c = new CANNON.DistanceConstraint(body, prevBody, restDistance);
                world.addConstraint(c);
                constraints.push(c);
              }
            }

            // Fermer la chaîne en boucle
            const dist = chainRadius * 2;
            const firstBody = bodies[0];
            const lastBody = bodies[chainSize - 1];
            const loopConstraint = new CANNON.DistanceConstraint(firstBody, lastBody, dist);
            world.addConstraint(loopConstraint);
            constraints.push(loopConstraint);

            // Impulsion vers le bas
            bodies.forEach((b) => {
              b.applyImpulse(new CANNON.Vec3(0, -0.5, 0), b.position);
            });

            necklaceBodiesRef.current = bodies;
            necklaceConstraintsRef.current = constraints;

            setIsLoading(false);
          },
          undefined,
          (error) => {
            console.error('Erreur chargement collier:', error);
          }
        );
      },
      undefined,
      (error) => {
        console.error('Erreur chargement modèle principal:', error);
      }
    );

    // -------------------------
    // BOUCLE D’ANIMATION
    // -------------------------
    let frameId: number;
    // On déclare une variable pour accumuler le temps écoulé depuis le démarrage
    let timeAccumulated = 0;

    const animate = () => {
      if (!isComponentMounted) return;
      frameId = requestAnimationFrame(animate);

      const now = performance.now();
      const deltaTimeSec = (now - lastTimeCheckRef.current) / 1000;
      lastTimeCheckRef.current = now;

      // --- On incrémente le temps accumulé ---
      timeAccumulated += deltaTimeSec;

      // Mise à jour de la physique
      if (worldRef.current) {
        // On avance la physique
        worldRef.current.step(1/60, deltaTimeSec, 3);

        // Si plus de 2 secondes se sont écoulées, on fige les corps du collier
        if (timeAccumulated > 1.0) {
          necklaceBodiesRef.current.forEach((b) => {
            b.velocity.set(0, 0, 0);
            b.angularVelocity.set(0, 0, 0);
            b.sleep();
          });
        }

        // Mettre à jour la position du mesh en fonction de la moyenne
        const bodies = necklaceBodiesRef.current;
        if (bodies.length > 0 && necklaceMeshRef.current) {
          const center = new THREE.Vector3();
          bodies.forEach((body) => {
            center.x += body.position.x;
            center.y += body.position.y;
            center.z += body.position.z;
          });
          center.multiplyScalar(1 / bodies.length);

          necklaceMeshRef.current.position.copy(center);
        }
      }

      // Stats + FPS
      if (statsRef.current) statsRef.current.update();
      frameCountRef.current++;

      // Triangles + draw calls (optionnel)
      if (frameCountRef.current % 10 === 0 && sceneRef.current) {
        let totalTriangles = 0;
        let totalDrawCalls = 0;
        sceneRef.current.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            if (mesh.geometry) {
              totalTriangles += mesh.geometry.index
                ? mesh.geometry.index.count / 3
                : mesh.geometry.attributes.position.count / 3;
            }
            totalDrawCalls++;
          }
        });
        setTriangles(totalTriangles);
        setDrawCalls(totalDrawCalls);
      }

      // Calcul FPS ~1x/s
      if (now - lastTimeCheckRef.current >= 1000) {
        const currentFps = Math.round(
          frameCountRef.current * 1000 / (now - lastTimeCheckRef.current)
        );
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeCheckRef.current = now;
      }

      // Rendu
      if (cameraRef.current && rendererRef.current && sceneRef.current) {
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // -------------------------
    // GESTION DU RESIZE
    // -------------------------
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // -------------------------
    // CLEANUP
    // -------------------------
    return () => {
      isComponentMounted = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);

      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [modelPath]);

  // ---------------------------------------------------------------------------
  // Rendu du composant (interface)
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full h-full p-4">
      <div className="w-full h-full bg-gradient-to-br from-neutral-900/5 to-neutral-900/10 rounded-3xl border border-white/10 shadow-2xl shadow-black/5 backdrop-blur-sm overflow-hidden relative">
        
        {/* Stats personnalisées à gauche */}
        <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-white text-xs font-mono z-10">
          <div>FPS: {fps}</div>
          <div>Triangles: {triangles.toLocaleString()}</div>
          <div>Draw Calls: {drawCalls}</div>
        </div>
        
        {/* Container 3D */}
        <div ref={containerRef} className="w-full h-full absolute inset-0" />

        {/* Overlay de chargement */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-950/60 backdrop-blur-md flex items-center justify-center"
            >
              <div className="text-center">
                <div className="relative w-16 h-16">
                  <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md animate-pulse" />
                </div>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 text-white/80 font-display text-sm tracking-wide"
                >
                  Chargement du modèle...
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions avec effet de flottement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
        >
          <div className="group relative">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl transform group-hover:scale-110 transition-transform duration-300" />
            <div className="relative px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg shadow-black/5">
              <div className="flex items-center space-x-3 text-white/70">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1C7.03 1 3 5.03 3 10v4c0 4.97 4.03 9 9 9s9-4.03 9-9v-4c0-4.97-4.03-9-9-9zm0 2c3.86 0 7 3.14 7 7v4c0 3.86-3.14 7-7 7s-7-3.14-7-7v-4c0-3.86 3.14-7 7-7zm1 3v4h3l-4 6-4-6h3V6h2z"/>
                </svg>
                <span className="font-display text-sm tracking-wide transform group-hover:scale-105 transition-transform duration-300">
                  Cliquez et glissez pour faire pivoter • Molette pour zoomer
                </span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Model3DView;
