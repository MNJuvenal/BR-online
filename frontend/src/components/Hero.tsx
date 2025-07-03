import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import RotatingButton from './RotatingButton';

interface FeatureSection {
  id: number;
  title: string;
  features: string[];
}

const sections: FeatureSection[] = [
  {
    id: 1,
    title: "Intelligence Artificielle de pointe",
    features: [
      "Détection précise des points de repère faciaux",
      "Analyse en temps réel de la morphologie du cou et des épaules",
      "Technologie basée sur MediaPipe et des modèles personnalisés",
    ]
  },
  {
    id: 2,
    title: "Essayage virtuel innovant",
    features: [
      "Rendu photoréaliste des colliers avec gestion des ombres",
      "Ajustement automatique basé sur la largeur des épaules",
      "Support de multiples angles de vue (jusqu'à 180°)",
      "Interface utilisateur intuitive inspirée de bleu-reflet.com"
    ]
  },
  {
    id: 3,
    title: "Solution professionnelle complète",
    features: [
      "Développé en collaboration avec BleuReflet",
      "Base de données enrichie de centaines d'images de morphologies",
      "Architecture full-stack React et deep learning",
      "Engineering Project Efrei 24/25"
    ]
  }
];

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Transformer le scroll en index de section
  const sectionProgress = useTransform(scrollYProgress, [0, 0.7], [0, sections.length - 1]);
  
  // Mettre à jour la section courante en fonction du scroll
  sectionProgress.onChange(latest => {
    setCurrentSection(Math.min(Math.floor(latest), sections.length - 1));
  });

  return (
    <div ref={containerRef} className="min-h-[200vh]">
      <div className="sticky top-0 min-h-screen flex items-center bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Fixed Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-12"
            >
              <motion.h1
                className="font-['TT_Ramillas'] text-6xl leading-tight"
              >
                BleuReflet Collier
                <span className="text-[#64ffa2]"> nouvelle génération</span>
              </motion.h1>
              
              <p className="font-['Atyp_Display'] text-2xl text-gray-600 leading-relaxed">
                Une solution de essayage virtuel innovante pour les colliers, développée en collaboration avec BleuReflet.
              </p>

              <RotatingButton 
                href="#demo" 
                className="px-10 py-5 bg-[#64ffa2] text-black rounded-full text-xl font-medium"
              >
                Découvrir maintenant
              </RotatingButton>
            </motion.div>

            {/* Right Column - Scrolling Sections */}
            <div className="relative">
              <div className="p-8">
                {/* Section Counter */}
                <div className="flex items-center mb-12">
                  <div className="text-gray-500">
                    <span className="font-['TT_Ramillas'] text-2xl">{String(currentSection + 1).padStart(2, '0')}</span>
                    <span className="mx-3 text-xl">/</span>
                    <span className="font-['Atyp_Display'] text-xl">{String(sections.length).padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Section Content */}
                <div className="relative h-[500px]">
                  {sections.map((section, index) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ 
                        opacity: currentSection === index ? 1 : 0,
                        x: currentSection === index ? 0 : 20
                      }}
                      className="absolute inset-0"
                      style={{ 
                        pointerEvents: currentSection === index ? 'auto' : 'none',
                        display: currentSection === index ? 'block' : 'none'
                      }}
                    >
                      <h2 className="font-['TT_Ramillas'] text-4xl mb-12 text-gray-800 leading-tight">
                        {section.title}
                      </h2>

                      <div className="space-y-8">
                        {section.features.map((feature, featureIndex) => (
                          <motion.div
                            key={featureIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: featureIndex * 0.1 }}
                            className="flex items-start space-x-6"
                          >
                            <div className="flex-shrink-0 w-6 h-6 mt-1">
                              <svg className="w-full h-full text-[#64ffa2]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="font-['Atyp_Display'] text-xl text-gray-600 leading-relaxed">{feature}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;