import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import UserAvatar from './UserAvatar';
import { FaUser, FaCog, FaSignOutAlt, FaBookmark, FaComments } from 'react-icons/fa';

const UserDropdown = ({ isOpen, onClose, onOpenProfile, onOpenFavorites, onOpenMessages }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleOpenProfile = () => {
    onOpenProfile();
    onClose();
  };

  const handleOpenFavorites = () => {
    onOpenFavorites();
    onClose();
  };

  const handleOpenMessages = () => {
    onOpenMessages();
    onClose();
  };

  if (!isOpen) return null;

  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuario';
  const email = currentUser?.email || '';

  return (
    <>
      {/* Overlay */}
      <div className="fixed bottom-0 inset-0 bg-black/20 z-[70]" onClick={onClose} />
      
      {/* Dropdown */}
      <div 
        ref={dropdownRef}
        className="fixed bottom-24 md:bottom-20 md:top-auto md:left-4 md:bottom-20 left-1/2 transform -translate-x-1/2 md:translate-x-0 bg-black/95 backdrop-blur-sm border border-white/10 rounded-2xl md:rounded-xl shadow-2xl z-[80] min-w-[280px] md:min-w-[220px] animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* Header del usuario */}
        <div className="p-4 md:p-3 border-b border-white/10">
          <div className="flex items-center gap-3 md:gap-2">
            <UserAvatar 
              user={currentUser} 
              size="lg" 
              sizeMd="md"
              showName={false}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm md:text-xs truncate">
                {displayName}
              </h3>
              <p className="text-white/60 text-xs md:text-xs truncate">
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* Opciones del menú */}
        <div className="p-2 md:p-1.5">
          <button
            onClick={handleOpenProfile}
            className="w-full flex items-center gap-3 md:gap-2 p-3 md:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl md:rounded-lg transition-all duration-200"
          >
            <FaUser className="md:text-sm" />
            <span className="text-sm md:text-xs font-medium">Mi perfil</span>
          </button>

          {/* Mensajes */}
          <button
            onClick={handleOpenMessages}
            className="w-full flex items-center gap-3 md:gap-2 p-3 md:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl md:rounded-lg transition-all duration-200"
          >
            <div className="relative">
              <FaComments className="md:text-sm" />
              {unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-[#FF4438] text-white text-xs rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-bold shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
            <span className="text-sm md:text-xs font-medium">Mensajes</span>
          </button>

          {/* Favoritos */}
          <button
            onClick={handleOpenFavorites}
            className="w-full flex items-center gap-3 md:gap-2 p-3 md:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl md:rounded-lg transition-all duration-200"
          >
            <FaBookmark className="md:text-sm" />
            <span className="text-sm md:text-xs font-medium">Favoritos</span>
          </button>

          <button
            onClick={() => {/* TODO: Implementar configuración */}}
            className="w-full flex items-center gap-3 md:gap-2 p-3 md:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl md:rounded-lg transition-all duration-200"
          >
            <FaCog className="md:text-sm" />
            <span className="text-sm md:text-xs font-medium">Configuración</span>
          </button>

          <div className="border-t border-white/10 my-2 md:my-1.5" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 md:gap-2 p-3 md:p-2 text-[#FF4438] hover:text-[#FF4438] hover:bg-[#FF4438]/10 rounded-xl md:rounded-lg transition-all duration-200"
          >
            <FaSignOutAlt className="md:text-sm" />
            <span className="text-sm md:text-xs font-medium">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default UserDropdown;
