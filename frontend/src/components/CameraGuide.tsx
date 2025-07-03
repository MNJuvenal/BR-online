import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CameraGuide: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Essayer",
      description: "Activez votre caméra pour commencer l'essayage en temps réel",
      targetId: "try-button",
      position: { bottom: '120%', left: '50%', transform: 'translateX(-50%)' }
    },
    {
      title: "Agrandir",
      description: "Passez en plein écran pour une meilleure expérience",
      targetId: "expand-button",
      position: { left: '-120%', top: '50%', transform: 'translateY(-50%)' }
    }
  ];

  useEffect(() => {
    if (currentStep >= steps.length) {
      onComplete();
    }
  }, [currentStep, onComplete]);

  return (
    <div className="fixed inset-0 z-50">
      <motion.div 
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      {steps.map((step, index) => (
        currentStep === index && (
          <motion.div
            key={index}
            className="absolute"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              ...step.position,
              pointerEvents: 'auto'
            }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-500/20 rounded-full animate-pulse" />
              <div className="bg-white rounded-xl shadow-xl p-4 w-64">
                <h3 className="font-medium text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                <button
                  onClick={() => setCurrentStep(step => step + 1)}
                  className="w-full px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  {index === steps.length - 1 ? 'Compris !' : 'Suivant'}
                </button>
              </div>
            </div>
          </motion.div>
        )
      ))}
    </div>
  );
};

export default CameraGuide;