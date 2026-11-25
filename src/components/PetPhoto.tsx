import React, { useEffect, useState } from 'react';
import { Dog } from 'lucide-react';

interface PetPhotoProps {
  src?: string;
  alt: string;
  className?: string;
}

export const PetPhoto: React.FC<PetPhotoProps> = ({ src, alt, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Dog className="w-8 h-8 text-amber-700" aria-hidden="true" />
        <span className="mt-1.5 text-xs font-medium text-slate-600 px-2 text-center truncate max-w-full">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
