import { motion } from 'framer-motion';
import bleurefletLogo from '../assets/bleureflet.svg';

const WhySection = () => {
  const features = [
    {
      title: "Intelligence Artificielle",
      description: "Notre technologie d'IA analyse en temps réel votre morphologie pour un placement précis",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: "Haute Précision",
      description: "Détection des points clés du cou et des épaules pour un essayage réaliste",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Temps Réel",
      description: "Visualisation instantanée des colliers avec un suivi fluide de vos mouvements",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <section id="features" className="relative py-24 bg-[#140308]">
      <div 
        className="absolute inset-0 hidden sm:block"
        style={{
          backgroundImage: `url(${bleurefletLogo})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          opacity: 0.05
        }}
      />
      
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="max-w-3xl">
          <motion.h6
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#64ffa2] font-display text-lg mb-4 uppercase tracking-wider"
          >
            Comprendre pourquoi
          </motion.h6>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-8"
          >
            Essayez virtuellement nos colliers avec une précision inégalée
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/10 transition-colors"
            >
              <div className="w-12 h-12 bg-[#64ffa2]/10 rounded-xl flex items-center justify-center mb-6">
                <div className="text-[#64ffa2]">
                  {feature.icon}
                </div>
              </div>
              <h3 className="font-heading text-xl text-white mb-4">
                {feature.title}
              </h3>
              <p className="font-display text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
