import React from 'react';
import Header from './Header';

export const ErrorLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow" data-public-content>{children}</main>
    </div>
  );
};
