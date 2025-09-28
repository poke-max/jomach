import React from 'react';
import { FaUser } from 'react-icons/fa';

const UserAvatar = ({ 
  user, 
  size = 'md', 
  showName = true, 
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
  const photoURL = user?.photoURL;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Avatar */}
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-r from-[#FBB581] to-purple-500 shadow-lg relative`}>
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <span className="text-white font-bold text-sm">
            {initials}
          </span>
        )}
      </div>

      {/* Nombre del usuario */}
      {showName && (
        <span className="text-sm font-bold text-white/90 truncate">
          {displayName}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;

