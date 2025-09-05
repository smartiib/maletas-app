import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CategorySliderProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategorySlider: React.FC<CategorySliderProps> = ({ categories, selectedCategory, onCategoryChange }) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
  };

  useEffect(() => {
    checkScrollButtons();
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', checkScrollButtons);
      return () => element.removeEventListener('scroll', checkScrollButtons);
    }
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 200;
    const currentScroll = scrollRef.current.scrollLeft;
    
    scrollRef.current.scrollTo({
      left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative flex items-center">
      {/* Botão de scroll esquerdo */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="sm"
          className="absolute left-0 z-10 bg-white dark:bg-slate-800 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Container das categorias */}
      <div 
        ref={scrollRef}
        className="flex space-x-2 overflow-x-auto pb-2 px-8 scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {categories.map((category, index) => (
          <Button
            key={`${category}-${index}`}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => onCategoryChange(category)}
            className={`whitespace-nowrap ${selectedCategory === category ? "bg-gradient-primary" : ""}`}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Botão de scroll direito */}
      {canScrollRight && (
        <Button
          variant="outline"
          size="sm"
          className="absolute right-0 z-10 bg-white dark:bg-slate-800 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default CategorySlider;