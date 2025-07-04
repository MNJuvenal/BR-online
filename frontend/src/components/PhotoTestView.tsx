import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";



const NECKLACES = [
  { name: "Collier 1", path: "collier1.png" },
  { name: "Collier 2", path: "collier2.png" },
  { name: "Collier 3", path: "collier3.png" },
  { name: "Collier 4", path: "collier4.png" },
];
const EXAMPLES = [
  { name: "Mannequin 1", src: "/assets/examples/example1.jpeg" },
  { name: "Mannequin 2", src: "/assets/examples/example2.jpg" },
];

const PhotoTestView: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedNecklace, setSelectedNecklace] = useState(NECKLACES[0].path);
  const [mode, setMode] = useState<"photo">("photo");
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);

  // Vérifier si MediaPipe est chargé
  useEffect(() => {
    const checkMediaPipe = () => {
      console.log("Vérification de MediaPipe...");
      console.log("window.FaceMesh:", (window as any).FaceMesh);
      
      if (typeof (window as any).FaceMesh !== 'undefined') {
        console.log("MediaPipe FaceMesh chargé avec succès");
        setIsMediaPipeReady(true);
      } else {
        console.log("Attente du chargement de MediaPipe...");
        setTimeout(checkMediaPipe, 500);
      }
    };
    
    // Attendre un peu pour que les scripts se chargent
    setTimeout(checkMediaPipe, 1000);
  }, []);

  async function detectLandmarks(imageElement: HTMLImageElement) {
  return new Promise<{ left_ear: [number, number], right_ear: [number, number], chin: [number, number] }>((resolve, reject) => {
    // Vérifier si MediaPipe est chargé
    if (typeof (window as any).FaceMesh === 'undefined') {
      reject(new Error("MediaPipe FaceMesh n'est pas chargé. Veuillez attendre le chargement de la page."));
      return;
    }

    try {
      const faceMesh = new (window as any).FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results: any) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          reject(new Error("Aucun visage détecté."));
          return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        const leftEar = landmarks[234];
        const rightEar = landmarks[454];
        const chin = landmarks[152];

        resolve({
          left_ear: [leftEar.x * imageElement.width, leftEar.y * imageElement.height],
          right_ear: [rightEar.x * imageElement.width, rightEar.y * imageElement.height],
          chin: [chin.x * imageElement.width, chin.y * imageElement.height],
        });
      });

      faceMesh.send({ image: imageElement });
    } catch (error) {
      console.error("Erreur lors de l'initialisation de FaceMesh:", error);
      reject(new Error("Erreur lors de l'initialisation de MediaPipe FaceMesh"));
    }
  });
}

  // Handle drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setProcessedImage(null);
        setErrorMessage(null);
      };
      reader.readAsDataURL(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    multiple: false,
  });

  
  // Process image upload
  useEffect(() => {
    if (mode !== "photo" || !image || !isMediaPipeReady) return;

    const processImage = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        let blob: Blob;

        const img = new Image();
        img.src = image;
        await img.decode();

        // Détection des landmarks
        const detectedLandmarks = await detectLandmarks(img);

        // Générer le blob
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);

        blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error("Impossible de générer le blob."));
          }, "image/jpeg")
        );

        const formData = new FormData();
        formData.append("image", new File([blob], "photo.jpg"));
        formData.append("necklace", selectedNecklace);
        formData.append("landmarks", JSON.stringify(detectedLandmarks));

        const res = await fetch("https://br-online.onrender.com/apply-necklace", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || "Erreur lors du traitement.");
        }

        const processedBlob = await res.blob();
        setProcessedImage(URL.createObjectURL(processedBlob));
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || "Erreur lors du traitement.");
      } finally {
        setIsLoading(false);
      }
    };

    processImage();
  }, [image, selectedNecklace, mode, isMediaPipeReady]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 relative">
      {/* Vérification du chargement de MediaPipe */}
      {!isMediaPipeReady && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-lg font-semibold mb-2">Chargement de MediaPipe...</p>
            <p className="text-gray-600">Veuillez patienter pendant le chargement des modèles.</p>
          </div>
        </div>
      )}

      {/* Titre principal */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Essayage Virtuel de Colliers
        </h1>
        <p className="text-lg text-gray-600">
          Choisissez un collier et découvrez comment il vous va
        </p>
      </div>

      {/* Mode selection */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button
          onClick={() => setMode("photo")}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white"
        >
          Photo
        </button>
      </div>

      {mode === "photo" && !image && (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 cursor-pointer text-center ${
              isDragActive ? "border-emerald-400" : "border-gray-300"
            }`}
          >
            <input {...getInputProps()} />
            <p>Cliquez ou glissez une photo pour essayer un collier virtuellement</p>
          </div>

          {/* Affichage des colliers disponibles */}
          <div className="mt-8 w-full max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
              Colliers disponibles
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {NECKLACES.map((necklace) => (
                <div
                  key={necklace.path}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedNecklace === necklace.path
                      ? "border-emerald-500 bg-emerald-50 shadow-lg"
                      : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-md"
                  }`}
                  onClick={() => setSelectedNecklace(necklace.path)}
                >
                  <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={`/data/usefull_necklace/${necklace.path}`}
                      alt={necklace.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-center font-medium text-gray-700">{necklace.name}</p>
                  {selectedNecklace === necklace.path && (
                    <div className="mt-2 text-center">
                      <span className="inline-block px-2 py-1 bg-emerald-500 text-white text-sm rounded-full">
                        Sélectionné
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {mode === "photo" && (
        <div className="mt-8 w-full max-w-4xl">
          <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">
            Ou essayez avec nos mannequins
          </h2>
          <div className="flex gap-6 justify-center">
            {EXAMPLES.map((ex) => (
              <div key={ex.name} className="flex flex-col items-center">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => {
                    setImage(ex.src);
                    setProcessedImage(null);
                    setErrorMessage(null);
                  }}
                >
                  <img
                    src={ex.src}
                    alt={ex.name}
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-emerald-400 group-hover:scale-105 transition-all duration-200 shadow-md"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 font-semibold text-sm bg-black/50 px-2 py-1 rounded">
                      Essayer
                    </span>
                  </div>
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700">{ex.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "photo" && image && (
        <div className="relative mt-4 w-full max-w-xl bg-white rounded-xl shadow-lg p-4">
          <img
            src={processedImage || image}
            alt="Prévisualisation"
            className="w-full rounded-lg border"
          />
          {/* Necklace selection */}
          <div className="flex gap-2 mt-4 justify-center">
            {NECKLACES.map((necklace) => (
              <button
                key={necklace.path}
                onClick={() => setSelectedNecklace(necklace.path)}
                className={`p-1 rounded border-2 ${
                  selectedNecklace === necklace.path
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-300 bg-white"
                }`}
              >
                <img
                  src={`/data/usefull_necklace/${necklace.path}`}
                  alt={necklace.name}
                  className="w-16 h-16 object-contain rounded"
                />
              </button>
            ))}
          </div>
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white">Traitement en cours...</p>
            </div>
          )}
          {errorMessage && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 text-center">
              <p className="text-white">{errorMessage}</p>
            </div>
          )}
          <button
            onClick={() => {
              setImage(null);
              setProcessedImage(null);
              setErrorMessage(null);
            }}
            className="absolute top-2 right-2 px-3 py-1 bg-black/70 text-white text-sm rounded"
          >
            Changer
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoTestView;
