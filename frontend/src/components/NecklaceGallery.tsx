import { motion } from 'framer-motion';

interface NecklaceGalleryProps {
  onSelect: (necklaceId: string) => void;
}

const necklaces = [
  {
    id: '1',
    name: 'Collier Diamond Grace',
    image: '/necklaces/diamond-grace.jpg',
    price: '1299 €'
  },
  {
    id: '2',
    name: 'Collier Pearl Elegance',
    image: '/necklaces/pearl-elegance.jpg',
    price: '899 €'
  },
  {
    id: '3',
    name: 'Collier Gold Infinity',
    image: '/necklaces/gold-infinity.jpg',
    price: '1499 €'
  },
  // Ajoutez plus de colliers ici
];

const NecklaceGallery = ({ onSelect }: NecklaceGalleryProps) => {
  return (
    <section id="gallery" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Notre Collection
          </h2>
          <p className="text-gray-400">
            Sélectionnez un collier pour l'essayer virtuellement
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {necklaces.map((necklace, index) => (
            <motion.div
              key={necklace.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div
                onClick={() => onSelect(necklace.id)}
                className="group relative bg-glass-bg backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer"
              >
                <div className="aspect-w-1 aspect-h-1">
                  <img
                    src={necklace.image}
                    alt={necklace.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white font-semibold">{necklace.name}</h3>
                  <p className="text-gray-200">{necklace.price}</p>
                  <button className="mt-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
                    Essayer
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NecklaceGallery;