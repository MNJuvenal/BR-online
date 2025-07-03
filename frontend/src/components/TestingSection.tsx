import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Model3DView from './Model3DView';
import PhotoTestView from './PhotoTestView';

const TestingSection: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<'photo' | '3d' | null>('photo');
  const [selectedGender, setSelectedGender] = useState<'homme' | 'femme' | 'femme2'>('femme');
  const [selectedFemaleModel, setSelectedFemaleModel] = useState<1 | 2>(1);

  // Fonction pour obtenir le chemin du modèle
  const getModelPath = () => {
    if (selectedGender === 'homme') return '/assets/man3.glb';
    return selectedFemaleModel === 1 ? '/assets/woman2.glb' : '/models/modelwoman2.glb';
  };

  return (
    <div className="w-full px-12 py-8">
      <div className="w-full rounded-3xl bg-[rgb(20,3,8)] shadow-2xl shadow-black/20 overflow-hidden">
        <div className="flex min-h-[800px]">
          {/* Section de gauche (20%) */}
          <div className="w-1/5 border-r border-white/10 p-8">
            <h2 className="text-white/90 text-2xl font-display mb-8">Essayage Virtuel</h2>
            {/* Mode Selection */}
            <div className="space-y-6 mb-12">
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMode('photo')}
                className={`w-full px-6 py-4 rounded-xl text-left transition-all duration-300 ${
                  selectedMode === 'photo'
                    ? 'bg-[rgb(100,255,162)]/10 border border-[rgb(100,255,162)]/30'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedMode === 'photo'
                      ? 'bg-[rgb(100,255,162)]/20'
                      : 'bg-white/5'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      selectedMode === 'photo'
                        ? 'text-[rgb(100,255,162)]'
                        : 'text-white/40'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-heading text-sm text-white/80">Mode Photo</p>
                    <p className="text-xs text-white/40">Essayez avec votre photo</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMode('3d')}
                className={`w-full px-6 py-4 rounded-xl text-left transition-all duration-300 ${
                  selectedMode === '3d'
                    ? 'bg-[rgb(100,255,162)]/10 border border-[rgb(100,255,162)]/30'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedMode === '3d'
                      ? 'bg-[rgb(100,255,162)]/20'
                      : 'bg-white/5'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      selectedMode === '3d'
                        ? 'text-[rgb(100,255,162)]'
                        : 'text-white/40'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-heading text-sm text-white/80">Mode 3D</p>
                    <p className="text-xs text-white/40">Visualisation sur modèle</p>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Gender Selection - Only visible in 3D mode */}
            <AnimatePresence>
              {selectedMode === '3d' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mb-12"
                >
                  <p className="text-sm text-white/40 mb-4 font-display">Choisir le modèle</p>
                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedGender('homme')}
                      className={`flex-1 py-3 rounded-xl transition-all duration-300 ${
                        selectedGender === 'homme'
                          ? 'bg-[rgb(100,255,162)]/10 border border-[rgb(100,255,162)]/30'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <span className={`text-sm font-display ${
                        selectedGender === 'homme' ? 'text-white/80' : 'text-white/40'
                      }`}>Pour homme</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedGender('femme')}
                      className={`flex-1 py-3 rounded-xl transition-all duration-300 ${
                        selectedGender === 'femme'
                          ? 'bg-[rgb(100,255,162)]/10 border border-[rgb(100,255,162)]/30'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <span className={`text-sm font-display ${
                        selectedGender === 'femme' ? 'text-white/80' : 'text-white/40'
                      }`}>Pour femme</span>
                    </motion.button>
                  </div>

                  {/* Sélection du modèle féminin */}
                  {selectedGender === 'femme' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-4"
                    >
                      <p className="text-sm text-white/40 mb-3 font-display">Style</p>
                      <div className="flex space-x-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedFemaleModel(1)}
                          className={`flex-1 py-2 rounded-xl transition-all duration-300 ${
                            selectedFemaleModel === 1
                              ? 'bg-[rgb(100,255,162)]/10 border border-[rgb(100,255,162)]/30'
                              : 'bg-white/5 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          <span className={`text-sm font-display ${
                            selectedFemaleModel === 1 ? 'text-white/80' : 'text-white/40'
                          }`}>Avatar 1</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedFemaleModel(2)}
                          className={`flex-1 py-2 rounded-xl transition-all duration-300 ${
                            selectedFemaleModel === 2
                              ? 'bg-[rgb(100,255,162)]/10 border border-[rgb(100,255,162)]/30'
                              : 'bg-white/5 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          <span className={`text-sm font-display ${
                            selectedFemaleModel === 2 ? 'text-white/80' : 'text-white/40'
                          }`}>Avatar 2</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section de droite (80%) */}
          <div className="w-4/5 p-8">
            <AnimatePresence mode="wait">
              {selectedMode === 'photo' && (
                <motion.div
                  key="photo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <PhotoTestView />
                </motion.div>
              )}

              {selectedMode === '3d' && (
                <motion.div
                  key="3d"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <Model3DView modelPath={getModelPath()} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingSection;
