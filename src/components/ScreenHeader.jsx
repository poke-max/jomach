import React from 'react';
import { FaTimes } from 'react-icons/fa';

const ScreenHeader = ({ icon: Icon, title, onClose, iconColor = "text-yellow-400" }) => {
  // Verificar que Icon existe
  if (!Icon) {
    console.error('ScreenHeader: icon prop is required');
    return null;
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Icon className={`${iconColor} text-sm`} />
          <h1 className="text-white text-md font-semibold">{title}</h1>
        </div>
        
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white p-1"
        >
          <FaTimes className="text-md" />
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Icon className={`${iconColor} text-sm`} />
          <h1 className="text-white text-lg font-semibold">{title}</h1>
        </div>
        
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors p-1"
        >
          <FaTimes className="text-lg" />
        </button>
      </div>
    </>
  );
};

export default ScreenHeader;

