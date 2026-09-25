import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, AlertCircle, Calendar as CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import { DayPicker } from 'react-day-picker';
import * as Popover from '@radix-ui/react-popover';
import 'react-day-picker/dist/style.css';

// --- Badge ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'outline' | 'ai';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '' }) => {
  const styles = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    outline: 'border border-gray-300 text-gray-700 bg-white',
    ai: 'bg-purple-100 text-purple-800 border border-purple-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'ai';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyle = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    ai: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Star Rating ---
export const StarRating: React.FC<{ rating: number; size?: number; count?: number }> = ({ rating, size = 16, count }) => {
  return (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={size} 
            className={`${star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
      {count !== undefined && <span className="text-sm text-gray-500 ml-1">({count})</span>}
    </div>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === 'password';

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${icon ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''} ${className}`}
          {...props}
          type={isPassword ? (showPassword ? 'text' : 'password') : props.type}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

// --- Status Indicator ---
export const StatusIndicator: React.FC<{ status: 'Available' | 'On Loan' }> = ({ status }) => {
  if (status === 'Available') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle size={12} className="mr-1" />
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <AlertCircle size={12} className="mr-1" />
      On Loan
    </span>
  );
};

// --- DatePickerField ---
export const DatePickerField: React.FC<{
  value: string;
  onChange: (val: string) => void;
  label?: string;
  disabled?: boolean;
}> = ({ value, onChange, label, disabled }) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (isValid(d)) setInputValue(format(d, "dd/MM/yyyy"));
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const parsed = parse(e.target.value, "dd/MM/yyyy", new Date());
    if (isValid(parsed) && e.target.value.length === 10) {
      onChange(format(parsed, "yyyy-MM-dd"));
    }
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="dd/mm/yyyy"
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
            className={`block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm pr-10 ${
              disabled ? "bg-gray-50 text-gray-500" : "bg-white"
            }`}
          />
          <Popover.Trigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
            >
              <CalendarIcon size={18} />
            </button>
          </Popover.Trigger>
        </div>
        <Popover.Portal>
          <Popover.Content
            className="z-50 bg-white rounded-md shadow-xl border border-gray-200 p-3 mt-1"
            align="start"
          >
            <DayPicker
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={handleSelect}
              locale={vi}
              captionLayout="dropdown"
              startMonth={new Date(1900, 0)}
              endMonth={new Date()}
              styles={{
                caption: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
                head_cell: { color: '#6b7280', fontWeight: 500, fontSize: '0.875rem' },
                cell: { padding: '0.2rem' },
                day: { borderRadius: '0.375rem', width: '2.5rem', height: '2.5rem' },
                day_selected: { backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' },
                day_today: { fontWeight: 'bold', color: '#2563eb' }
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};
