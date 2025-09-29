import React from 'react';

const LoadingScreen = ({ message = null }) => {
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center">
        <img 
          src="favicon.svg" 
          alt="Logo" 
          className="w-16 h-16 animate-pulse" 
          style={{ animationDuration: '2s' }}
        />
        {message && (
          <div className="text-white text-sm mt-4">{message}</div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
