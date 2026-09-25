import React from 'react';

type BrandLogoProps = {
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeConfig = {
  sm: {
    image: 'h-8 w-8',
    title: 'text-lg',
    subtitle: 'text-[9px]',
    gap: 'gap-2',
  },
  md: {
    image: 'h-9 w-9',
    title: 'text-xl',
    subtitle: 'text-[10px]',
    gap: 'gap-3',
  },
  lg: {
    image: 'h-10 w-10',
    title: 'text-2xl',
    subtitle: 'text-xs',
    gap: 'gap-3',
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  subtitle = 'NEXT-GEN DISCOVERY',
  size = 'md',
  className = '',
}) => {
  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      <img
        src="/logo.png"
        alt="Library74"
        className={`${config.image} rounded-xl object-cover shadow-sm ring-1 ring-indigo-100`}
      />
      <div className="min-w-0">
        <div className={`${config.title} font-black leading-none tracking-normal`}>
          <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Library
          </span>
          <span className="text-slate-900 dark:text-white">74</span>
        </div>
        {subtitle && (
          <div className={`${config.subtitle} mt-1 font-semibold uppercase leading-none tracking-normal text-slate-500 dark:text-slate-400`}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
