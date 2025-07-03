import React from "react";

interface Necklace {
  name: string;
  path: string;
}

interface Props {
  necklaces: Necklace[];
  selected: string;
  onSelect: (path: string) => void;
}

const NecklaceCarousel: React.FC<Props> = ({ necklaces, selected, onSelect }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-md rounded-full shadow overflow-x-auto max-w-full">
      {necklaces.map((necklace) => (
        <button
          key={necklace.path}
          onClick={() => onSelect(necklace.path)}
          className={`flex-shrink-0 p-1 rounded-full border transition focus:outline-none ${
            selected === necklace.path
              ? "border-emerald-400 ring-1 ring-emerald-300"
              : "border-transparent"
          }`}
        >
          <img
            src={`/assets/colliers/${necklace.path}`}
            alt={necklace.name}
            className="w-10 h-10 object-contain"
          />
        </button>
      ))}

      {/* Séparateur vertical */}
      <div className="h-6 w-px bg-white/30 mx-2"></div>

      {/* Bouton retour ou masquer */}
      <button
        className="flex-shrink-0 p-2 rounded-full hover:bg-white/10 transition"
        aria-label="Masquer"
      >
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
};

export default NecklaceCarousel;
