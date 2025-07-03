import { motion, useScroll, useTransform, useSpring, animate } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const necklaces = [
  {
    id: 1,
    name: "Céleste",
    description: "Or blanc 18K, constellation de diamants naturels",
    price: "2 490 €",
    image: "/necklaces/celestial.jpg",
    specs: ["Or 18K", "Diamants 0.5ct", "42-45cm"]
  },
  {
    id: 2,
    name: "Vénitienne",
    description: "Or rose, maille fine, finition miroir",
    price: "890 €",
    image: "/necklaces/venetian.jpg",
    specs: ["Or rose", "Maille 1mm", "40-45cm"]
  },
  {
    id: 3,
    name: "Akoya",
    description: "Perles japonaises AAA, lustre exceptionnel",
    price: "1 990 €",
    image: "/necklaces/pearl.jpg",
    specs: ["Perles 7.5mm", "Or blanc", "45cm"]
  }
];

const CARD_WIDTH = 900;
const CARD_GAP = 32;
const VISIBILITY_THRESHOLD = 0.4; // Seuil de visibilité pour activer le snap

const ShopSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const isAnimatingRef = useRef(false);

  // Calcule la visibilité de chaque card
  const calculateVisibility = () => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    
    let maxVisibility = 0;
    let mostVisibleIndex = activeCardIndex;

    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      const visibility = 1 - (distance / (containerRect.width / 2));
      
      if (visibility > maxVisibility) {
        maxVisibility = visibility;
        mostVisibleIndex = index;
      }
    });

    return { mostVisibleIndex, visibility: maxVisibility };
  };

  const animateToCard = (index: number) => {
    if (!containerRef.current || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    const targetScroll = index * (CARD_WIDTH + CARD_GAP);
    const currentScroll = containerRef.current.scrollLeft;
    const duration = 0.6; // durée en secondes

    animate(currentScroll, targetScroll, {
      duration,
      ease: [0.32, 0.72, 0, 1], // easing personnalisé pour un effet plus naturel
      onUpdate: (value) => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = value;
        }
      },
      onComplete: () => {
        isAnimatingRef.current = false;
        setActiveCardIndex(index);
      }
    });
  };

  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnimatingRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current!.offsetLeft);
    setScrollLeft(containerRef.current!.scrollLeft);
  };

  const stopDragging = () => {
    setIsDragging(false);
    const visibility = calculateVisibility();
    if (visibility && visibility.visibility > VISIBILITY_THRESHOLD) {
      animateToCard(visibility.mostVisibleIndex);
    } else {
      // Si aucune card n'est suffisamment visible, on revient à la dernière active
      animateToCard(activeCardIndex);
    }
  };

  const onDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || isAnimatingRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current!.offsetLeft;
    const walk = (x - startX) * 1.2;
    if (containerRef.current) {
      containerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="max-w-[100vw] mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 px-8"
        >
          <span className="text-sm font-medium tracking-widest text-blue-600 uppercase mb-3 block">
            Collection
          </span>
          <h2 className="text-7xl font-heading text-gray-900 mb-4 tracking-tight">
            Essentiels
          </h2>
        </motion.div>

        <div 
          ref={containerRef}
          className="flex space-x-8 overflow-x-auto pb-12 scrollbar-hide cursor-grab active:cursor-grabbing px-8 relative"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'auto'
          }}
          onMouseDown={startDragging}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onMouseMove={onDrag}
        >
          {necklaces.map((necklace, index) => (
            <motion.div
              key={necklace.id}
              ref={el => cardsRef.current[index] = el}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative bg-gray-50 rounded-[2.5rem] p-12 hover:bg-gray-100 transition-all duration-500 flex-none w-[900px]"
              style={{ 
                background: 'linear-gradient(to bottom right, #ffffff, #f3f4f6)',
                boxShadow: '0 4px 60px -20px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(229, 231, 235, 0.8)'
              }}
            >
              {/* Zone interactive d'essayage */}
              <motion.div 
                className="absolute top-6 right-6 z-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  onClick={() => {
                    const demoSection = document.getElementById('demo');
                    if (demoSection) {
                      const offset = -100;
                      const topPosition = demoSection.getBoundingClientRect().top + window.pageYOffset - offset;
                      window.scrollTo({
                        top: topPosition,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className="relative flex items-center bg-white/80 hover:bg-white rounded-xl shadow-sm overflow-hidden group"
                  whileHover="hover"
                  animate="rest"
                  initial="rest"
                  whileTap={{ scale: 0.99 }}
                  variants={{
                    rest: { scale: 1 },
                    hover: { scale: 1.01 }
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <div className="relative p-2.5 bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200">
                    <motion.div
                      className="w-7 h-7 flex items-center justify-center"
                    >
                      <img 
                        src="/assets/logo2.svg" 
                        alt="Essayer en réalité augmentée"
                        className="w-9 h-9 transform scale-150"
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    className="overflow-hidden"
                    variants={{
                      rest: { width: 0, opacity: 0 },
                      hover: { width: 160, opacity: 1 }
                    }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <span className="block px-3 text-sm font-medium text-[#2b73da] whitespace-nowrap"
                          style={{
                            textShadow: '0 0 0px rgba(100, 255, 162, 0.3)',
                            fontFamily: 'TT Ramillas, serif'
                          }}>
                      Bleu Reflet Collier
                    </span>
                  </motion.div>

                  <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#64ffa2]/5 to-transparent" />
                  </div>
                </motion.button>

                <motion.div
                  className="absolute -top-0.5 -right-0.5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.5 }}
                >
                  <span className="block w-2 h-2 rounded-full bg-[#64ffa2] shadow-[0_0_10px_rgba(100,255,162,0.5)]">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-[#64ffa2] animate-ping opacity-20" />
                  </span>
                </motion.div>
              </motion.div>

              <div className="flex space-x-12">
                {/* Image Container */}
                <div className="relative w-[350px] aspect-[3/4] overflow-hidden rounded-[2rem]">
                  <img
                    src={necklace.image}
                    alt={necklace.name}
                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 pt-6 space-y-10">
                  <div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className="text-5xl font-heading text-gray-900 mb-4">
                        {necklace.name}
                      </h3>
                      <p className="text-gray-600 font-light text-xl">
                        {necklace.description}
                      </p>
                    </motion.div>
                  </div>

                  {/* Specs Pills */}
                  <div className="flex flex-wrap gap-3">
                    {necklace.specs.map((spec, index) => (
                      <span
                        key={index}
                        className="px-8 py-4 bg-white rounded-full text-base text-gray-600 shadow-sm"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between pt-10">
                    <div className="space-y-2">
                      <span className="text-base text-gray-500" style={{ fontFamily: 'TT Ramillas, serif' }}>Prix</span>
                      <p className="text-4xl text-gray-900" style={{ fontFamily: 'TT Ramillas, serif' }}>
                        {necklace.price}
                      </p>
                    </div>
                    <motion.button 
                      className="relative overflow-hidden bg-gray-900 text-white px-12 py-4 rounded-xl text-lg transition-all duration-300"
                      style={{ 
                        fontFamily: 'TT Ramillas, serif',
                        boxShadow: '0 4px 14px -4px rgba(0, 0, 0, 0.2)'
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: '0 6px 20px -4px rgba(0, 0, 0, 0.3)'
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <svg 
                          className="w-5 h-5" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        Acheter
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Indicateur de drag */}
        <div className="flex justify-center mt-8 space-x-2">
          <div className="text-sm text-gray-400 flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
            </svg>
            <span>Cliquez et glissez pour explorer</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopSection;
