import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  icon?: React.ReactNode;
}

export default function MultiSelect({ options, selected, onChange, placeholder, icon }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  };

  return (
    <div className="relative w-full sm:w-64" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "min-h-[42px] w-full bg-neutral-900/50 border border-white/10 rounded-2xl pl-10 pr-10 py-2 text-sm text-white cursor-pointer transition-all flex flex-wrap gap-1 items-center",
          isOpen && "border-white/30 bg-neutral-900"
        )}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
          {icon}
        </div>

        {selected.length === 0 ? (
          <span className="text-neutral-500">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map((item) => (
              <span
                key={item}
                className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-xs flex items-center gap-1"
              >
                {item}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-white"
                  onClick={(e) => removeOption(item, e)}
                />
              </span>
            ))}
          </div>
        )}

        <ChevronDown className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 transition-transform",
          isOpen && "rotate-180"
        )} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="max-h-60 overflow-y-auto py-2">
            {options.map((option) => (
              <div
                key={option}
                onClick={() => toggleOption(option)}
                className="px-4 py-2 text-sm text-neutral-300 hover:bg-white/5 hover:text-white cursor-pointer flex items-center justify-between"
              >
                {option}
                {selected.includes(option) && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-2 text-sm text-neutral-500 italic">No options available</div>
            )}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-white/5 p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                className="w-full text-xs text-neutral-500 hover:text-white transition-colors py-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
