import { motion } from 'framer-motion';

const features = [
  {
    title: "Essayage en Temps Réel",
    description: "Visualisez instantanément les colliers sur vous grâce à notre technologie de pointe.",
    icon: "⚡"
  },
  {
    title: "Haute Précision",
    description: "Notre IA détecte avec précision les points clés pour un placement parfait.",
    icon: "🎯"
  },
  {
    title: "Collection Exclusive",
    description: "Découvrez notre sélection de bijoux haut de gamme numérisés en haute définition.",
    icon: "💎"
  },
  {
    title: "Partage Facile",
    description: "Partagez vos essayages sur les réseaux sociaux en un clic.",
    icon: "🔄"
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Une Expérience Unique
          </h2>
          <p className="text-xl text-gray-400">
            Découvrez ce qui rend notre technologie exceptionnelle
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="glass-card p-6 rounded-xl hover:scale-105 transition-transform"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;