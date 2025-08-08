import { useState, useEffect } from 'react';

export interface AssetItem {
  name: string;
  path: string;
  original_name: string;
}

export interface AssetsData {
  examples: AssetItem[];
  colliers: AssetItem[];
  total_examples: number;
  total_colliers: number;
  scan_timestamp: number;
  scan_info?: {
    mode: string;
    examples_path: string;
    colliers_path: string;
    dist_available: boolean;
    force_dev?: boolean;
  };
}

export const useAssets = () => {
  const [assets, setAssets] = useState<AssetsData>({
    examples: [],
    colliers: [],
    total_examples: 0,
    total_colliers: 0,
    scan_timestamp: 0,
    scan_info: {
      mode: 'unknown',
      examples_path: '',
      colliers_path: '',
      dist_available: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔍 Scan des assets via API...");
      
      const response = await fetch('/api/scan-assets');
      
      console.log("📡 Réponse reçue:", {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Réponse d'erreur:", errorText);
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      // Vérifier que c'est bien du JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error("❌ Réponse non-JSON reçue:", responseText);
        throw new Error(`Réponse non-JSON reçue. Content-Type: ${contentType}`);
      }
      
      const data: AssetsData = await response.json();
      
      console.log("✅ Assets chargés:", {
        examples: data.total_examples,
        colliers: data.total_colliers,
        mode: data.scan_info?.mode || 'unknown',
        paths: {
          examples: data.scan_info?.examples_path,
          colliers: data.scan_info?.colliers_path
        }
      });
      
      // Afficher les informations de mode pour debug
      if (data.scan_info) {
        console.log(`🔧 Mode détecté: ${data.scan_info.mode}`);
        console.log(`📁 Dossiers utilisés:
  - Examples: ${data.scan_info.examples_path}
  - Colliers: ${data.scan_info.colliers_path}
  - Dist disponible: ${data.scan_info.dist_available ? '✅' : '❌'}`);
      }
      
      setAssets(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error("❌ Erreur lors du chargement des assets:", errorMessage);
      setError(errorMessage);
      
      // Fallback avec des données par défaut si l'API échoue
      console.log("🔄 Utilisation des données de fallback...");
      setAssets({
        examples: [
          { name: "Example 1", path: "example1.jpeg", original_name: "example1.jpeg" },
          { name: "Example 2", path: "example2.jpeg", original_name: "example2.jpeg" },
          { name: "Example 3", path: "example3.jpeg", original_name: "example3.jpeg" }
        ],
        colliers: [
          { name: "Collier 1", path: "collier1.png", original_name: "collier1.png" },
          { name: "Collier 2", path: "collier2.png", original_name: "collier2.png" },
          { name: "Collier 3", path: "collier3.png", original_name: "collier3.png" }
        ],
        total_examples: 3,
        total_colliers: 3,
        scan_timestamp: Date.now(),
        scan_info: {
          mode: 'fallback',
          examples_path: 'fallback/examples',
          colliers_path: 'fallback/colliers',
          dist_available: false
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return {
    assets,
    loading,
    error,
    refetch: fetchAssets,
    totalExamples: assets.total_examples,
    totalColliers: assets.total_colliers
  };
};
