import React from 'react';

interface NecklaceCarouselProps {
  showCarousel: boolean;
  onClose: () => void;
  displayedItems: Array<{ name: string; url: string; path: string }>;
  selectedNecklaces: { name: string; url: string; path: string } | null;
  onToggleSelection: (item: { name: string; url: string; path: string }) => void;
  activeCategoryTitle: string;
}

const NecklaceCarousel: React.FC<NecklaceCarouselProps> = ({
  showCarousel,
  onClose,
  displayedItems,
  selectedNecklaces,
  onToggleSelection,
  activeCategoryTitle,
}) => {
  if (!showCarousel) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{activeCategoryTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedItems.map((item, index) => {
            const isSelected = selectedNecklaces?.url === item.url;
            return (
              <div
                key={index}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onToggleSelection(item)}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    <i className="fas fa-check"></i>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NecklaceCarousel;
