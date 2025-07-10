import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface FunFactsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const funFacts = [
  "There is a book titled 'Vitrae Onaer' that contains everything about Hugoland!",
  "Most enemies in Hugoland are mutated",
  "Lunar eclipses in Hugoland look dark blue!",
  "There is a lost Hugoland board game that over 12,000 people remember playing!",
  "Hugoland contains 900,000 secret gems that nobody was supposed to know about.",
  "Legend says that the merchant is a 500 year old surviving vampire!",
  "90% of Relics originate from 7500 years ago!",
  "Despite their abundancy in Hugoland, many other countries only have 2-3 relics!",
  "There is a penguin travelling around Hugoland.",
  "Nobody really knows how the gems of Hugoland got there.",
  "Hugoland has over 9000 books in a language we can't read"
];

export const FunFactsPopup: React.FC<FunFactsPopupProps> = ({ isOpen, onClose }) => {
  const [currentFact, setCurrentFact] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentFact(Math.floor(Math.random() * funFacts.length));
    }
  }, [isOpen]);

  const nextFact = () => {
    setCurrentFact((prev) => (prev + 1) % funFacts.length);
  };

  const prevFact = () => {
    setCurrentFact((prev) => (prev - 1 + funFacts.length) % funFacts.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-md p-6 rounded-xl border border-purple-500/30 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            <h3 className="text-white font-bold text-lg">Hugoland Fun Facts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-black/30 p-4 rounded-lg border border-purple-500/20 mb-4">
          <p className="text-white text-sm leading-relaxed">
            {funFacts[currentFact]}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={prevFact}
            className="px-3 py-1 bg-purple-600/50 text-white rounded-lg hover:bg-purple-600/70 transition-colors text-sm"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-1">
            {funFacts.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentFact ? 'bg-purple-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextFact}
            className="px-3 py-1 bg-purple-600/50 text-white rounded-lg hover:bg-purple-600/70 transition-colors text-sm"
          >
            Next
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-400 text-xs">
            Fact {currentFact + 1} of {funFacts.length}
          </p>
        </div>
      </div>
    </div>
  );
};