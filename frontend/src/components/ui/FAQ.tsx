import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div className="border-b border-white/10">
      <motion.button
        className="w-full py-4 px-6 flex justify-between items-center hover:bg-white/5 transition-colors duration-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-display text-white/90">{question}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="w-5 h-5 text-white/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-4 text-white/70">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FAQ: React.FC = () => {
  const faqItems = [
    {
      question: "Comment fonctionne l'essayage virtuel ?",
      answer: "Notre technologie utilise la réalité augmentée pour placer virtuellement le collier sur votre cou. La caméra détecte votre visage et positionne le bijou en temps réel, vous permettant de voir comment il vous irait dans la vraie vie."
    },
    {
      question: "Puis-je sauvegarder mes essayages ?",
      answer: "Oui ! Vous pouvez prendre des captures d'écran de vos essayages et les partager directement sur vos réseaux sociaux préférés. Bientôt, vous pourrez également créer un compte pour sauvegarder vos essayages favoris."
    },
    {
      question: "Les colliers sont-ils fidèles à la réalité ?",
      answer: "Absolument ! Nous utilisons des modèles 3D haute fidélité de nos colliers, créés à partir des véritables pièces. Les textures, reflets et dimensions sont reproduits avec précision pour vous donner l'aperçu le plus réaliste possible."
    },
    {
      question: "Comment obtenir le meilleur résultat ?",
      answer: "Pour un essayage optimal, placez-vous dans un endroit bien éclairé, face à la caméra. Évitez les mouvements brusques et gardez une position naturelle. Plus vous êtes stable, plus le rendu sera précis."
    }
  ];

  return (
    <div className="max-w-2xl mx-auto bg-black/20 backdrop-blur-md rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="font-display text-xl text-white">Questions fréquentes</h2>
      </div>
      <div className="divide-y divide-white/10">
        {faqItems.map((item, index) => (
          <FAQItem key={index} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
};

export default FAQ;
