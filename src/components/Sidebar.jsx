import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import UserDropdown from './UserDropdown';
import ProfileModal from './ProfileModal';
import { FaHome, FaSearch, FaMap, FaPlus, FaBookmark, FaPlusCircle } from 'react-icons/fa';

const Sidebar = ({ onOpenMap, onGoHome, onOpenPublish, onOpenFavorites, currentView = 'home' }) => {
  const { currentUser, userProfile } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const profileButtonRef = React.useRef(null);

  return (
    <>
      <style jsx>{`
        @keyframes orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Desktop Sidebar - Oculta en móvil */}

<div className="hidden md:flex fixed top-0 bottom-0 w-50 bg-black backdrop-blur-sm border-r z-40 flex-col left-0">

      {/* Header con logo y título centrados */}
      <div className="flex flex-row items-center justify-center gap-2 mt-8 px-4">
        <img src="favicon.svg" alt="Logo" className="w-8 h-8 flex-shrink-0" />
        <span className="text-white text-xl font-bold">Jomach</span>
      </div>

      <div className="hidden md:flex relative top-8 bottom-4 w-46 bg-black backdrop-blur-sm border-r border-white/10 z-40 flex-col left-4 h-full">

        {/* Menu Items */}
        <nav className="flex flex-col gap-8 flex-1 justify-start mt-4 pl-3">
          <button
            onClick={onGoHome}
            className={`relative flex flex-row items-center gap-2 transition-colors group ${
              currentView === 'home'
                ? 'text-[#FBB581]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <FaHome className="text-lg" />
            <span className="text-xs font-medium transition-opacity">Inicio</span>
            {currentView === 'home' && (
              <div className="absolute -left-3 w-1 h-5 bg-[#FBB581] rounded-r-full"></div>
            )}
          </button>

          <button className="flex flex-row items-center gap-2 text-white/60 hover:text-white transition-colors group">
            <FaSearch className="text-lg" />
            <span className="text-xs font-medium transition-opacity">Buscar</span>
          </button>

          <button
            onClick={onOpenMap}
            className={`relative flex flex-row items-center gap-2 transition-colors group ${
              currentView === 'map'
                ? 'text-[#FBB581]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <FaMap className="text-lg" />
            <span className="text-xs font-medium transition-opacity">Mapa</span>
            {currentView === 'map' && (
              <div className="absolute -left-3 w-1 h-5 bg-[#FBB581] rounded-r-full"></div>
            )}
          </button>

          {/* Botón Publicar - Desktop */}
          <button 
            onClick={onOpenPublish}
            className={`relative flex flex-row items-center gap-2 transition-colors group ${
              currentView === 'publish'
                ? 'text-[#FBB581]'
                : 'text-white hover:text-[#FBB581]'
            }`}
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <FaPlus className="text-lg relative z-10" />
              
              {/* Pelotitas orbitando */}
              <div className="absolute inset-0 animate-spin" style={{animation: 'orbit 3s linear infinite'}}>
                <div className="absolute w-1.5 h-1.5 bg-[#FF4438] rounded-full shadow-lg" style={{top: '0px', left: '50%', transform: 'translateX(-50%)'}}></div>
              </div>
              <div className="absolute inset-0 animate-spin" style={{animation: 'orbit 3s linear infinite', animationDelay: '-0.75s'}}>
                <div className="absolute w-1.5 h-1.5 bg-[#FBB581] rounded-full shadow-lg" style={{top: '50%', right: '0px', transform: 'translateY(-50%)'}}></div>
              </div>
              <div className="absolute inset-0 animate-spin" style={{animation: 'orbit 3s linear infinite', animationDelay: '-1.5s'}}>
                <div className="absolute w-1.5 h-1.5 bg-[#673AB7] rounded-full shadow-lg" style={{bottom: '0px', left: '50%', transform: 'translateX(-50%)'}}></div>
              </div>
              <div className="absolute inset-0 animate-spin" style={{animation: 'orbit 3s linear infinite', animationDelay: '-2.25s'}}>
                <div className="absolute w-1.5 h-1.5 bg-[#D361A5] rounded-full shadow-lg" style={{top: '50%', left: '0px', transform: 'translateY(-50%)'}}></div>
              </div>
            </div>
            <span className="text-xs font-medium transition-opacity">Publicar</span>
            {currentView === 'publish' && (
              <div className="absolute -left-3 w-1 h-5 bg-[#FBB581] rounded-r-full"></div>
            )}
          </button>

          <button 
            onClick={onOpenFavorites}
            className={`relative flex flex-row items-center gap-2 transition-colors group ${
              currentView === 'favorites'
                ? 'text-[#FBB581]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <FaBookmark className="text-lg" />
            <span className="text-xs font-medium transition-opacity">Guardados</span>
            {currentView === 'favorites' && (
              <div className="absolute -left-3 w-1 h-5 bg-[#FBB581] rounded-r-full"></div>
            )}
          </button>
        </nav>
               
        {/* User Profile - Moved to bottom */}
        <div className="mt-auto mb-12">
          <button
            ref={profileButtonRef}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex flex-row items-center gap-2 p-2 text-white/60 hover:text-white transition-colors group w-full"
          >
            <UserAvatar
              user={currentUser}
              size="sm"
              showName={false}
            />
            <span className="text-xs font-medium transition-opacity">
              {userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuario'}
            </span>
          </button>
        </div>
      </div>
</div>

      {/* Mobile Bottom Navigation - Corregido para indicadores */}
<div className="md:hidden h-16 fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-white/10 z-[60] flex items-center "
     style={{
       /* paddingBottom: 'env(safe-area-inset-bottom)',
       marginBottom: '0' */
     }}>
  <nav
    className="flex justify-around bg-black/95 items-center py-0 px-1 w-full"
    style={{
      /* paddingBottom: `max(0.2rem, calc(env(safe-area-inset-bottom) + 0.2rem))`, */
      minHeight: `calc(65px + env(safe-area-inset-bottom))`,
      // Asegurar que esté completamente por encima de la barra de navegación del dispositivo
      position: 'relative',
      zIndex: 1
    }}
  >
    {/* Botón Home */}
    <button
      onClick={onGoHome}
      className={`relative flex items-center justify-center p-2.5 transition-all duration-200 transform hover:scale-110 active:scale-95 ${
        currentView === 'home'
          ? 'text-[#FBB581]'
          : 'text-white hover:text-[#FBB581]'
      }`}
    >
      <FaHome className="text-lg drop-shadow-sm" />
      {currentView === 'home' && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#FBB581] rounded-full"></div>
      )}
    </button>

    {/* Botón Map */}
    <button
      onClick={onOpenMap}
      className={`relative flex items-center justify-center p-2.5 transition-all duration-200 transform hover:scale-110 active:scale-95 ${
        currentView === 'map'
          ? 'text-[#FBB581]'
          : 'text-white hover:text-[#FBB581]'
      }`}
    >
      <FaMap className="text-lg drop-shadow-sm" />
      {currentView === 'map' && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#FBB581] rounded-full"></div>
      )}
    </button>

    {/* Botón Publicar (en el centro, más grande) */}
    <button 
      onClick={onOpenPublish}
      className={`relative flex items-center justify-center p-3.5 transition-all duration-200 transform hover:scale-110 active:scale-95 ${
        currentView === 'publish'
          ? 'text-[#FBB581]'
          : 'text-white hover:text-[#FBB581]'
      }`}
    >
      <div className="relative w-9 h-9 flex items-center justify-center">
        <FaPlusCircle className="text-2xl drop-shadow-sm relative z-10" />

        {/* Pelotitas orbitando */}
        <div
          className="absolute inset-0 animate-spin"
          style={{ animation: 'orbit 3s linear infinite' }}
        >
          <div
            className="absolute w-2 h-2 bg-[#673AB7] rounded-full shadow-lg"
            style={{ top: '-4px', left: '50%', transform: 'translateX(-50%)' }}
          ></div>
        </div>
        <div
          className="absolute inset-0 animate-spin"
          style={{
            animation: 'orbit 3s linear infinite',
            animationDelay: '-0.75s'
          }}
        >
          <div
            className="absolute w-2 h-2 bg-[#D361A5] rounded-full shadow-lg"
            style={{ top: '50%', right: '-4px', transform: 'translateY(-50%)' }}
          ></div>
        </div>
        <div
          className="absolute inset-0 animate-spin"
          style={{
            animation: 'orbit 3s linear infinite',
            animationDelay: '-1.5s'
          }}
        >
          <div
            className="absolute w-2 h-2 bg-[#D361A5] rounded-full shadow-lg"
            style={{ bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }}
          ></div>
        </div>
        <div
          className="absolute inset-0 animate-spin"
          style={{
            animation: 'orbit 3s linear infinite',
            animationDelay: '-2.25s'
          }}
        >
          <div
            className="absolute w-2 h-2 bg-[#673AB7] rounded-full shadow-lg"
            style={{ top: '50%', left: '-4px', transform: 'translateY(-50%)' }}
          ></div>
        </div>
      </div>
{/*       {currentView === 'publish' && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#FBB581] rounded-full"></div>
      )} */}
    </button>

    {/* Botón Guardados */}
    <button 
      onClick={onOpenFavorites}
      className={`relative flex items-center justify-center p-2.5 transition-all duration-200 transform hover:scale-110 active:scale-95 ${
        currentView === 'favorites'
          ? 'text-[#FBB581]'
          : 'text-white/70 hover:text-white'
      }`}
    >
      <FaBookmark className="text-lg drop-shadow-sm" />
      {currentView === 'favorites' && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#FBB581] rounded-full"></div>
      )}
    </button>

    {/* Botón Perfil */}
    <button
      ref={profileButtonRef}
      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      className="relative flex items-center justify-center p-2.5 text-white/70 hover:text-white transition-all duration-200 transform hover:scale-110 active:scale-95"
    >
      <UserAvatar user={currentUser} size="sm" showName={false} />
      {currentView === 'profile' && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#FBB581] rounded-full"></div>
      )}
    </button>
  </nav>
</div>




      {/* User Dropdown */}
      <UserDropdown
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        anchorRef={profileButtonRef}
      />
    </>
  );
};

export default Sidebar;