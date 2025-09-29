import React, { useState, useRef, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import MapView from './components/MapView';
import DebugPanel from './components/DebugPanel';
import InstallPWA from './components/InstallPWA';
import LoadingScreen from './components/LoadingScreen';
import JobCard from './components/JobCard';
import JobModal from './components/JobModal';
import ProfileModal from './components/ProfileModal';
import PublishJobScreen from './components/PublishJobScreen';
import FavoriteJobs from './components/FavoriteJobs';

import ConversationsScreen from './components/ConversationsScreen';
import NotificationPermission from './components/NotificationPermission';
import ImageViewer from './components/ImageViewer';
import { useAuth } from './contexts/AuthContext';
import { useJobs } from './hooks/UseJobs';
import { useSmoothJobNavigation } from './hooks/useSmoothJobNavigation';
import { useJobInteractions } from './hooks/useJobInteractions';
import { useUnreadMessages } from './hooks/useUnreadMessages';
import { jobsService } from './firebase/services';

const App = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs();
  const { notificationsEnabled, requestNotificationPermission } = useUnreadMessages();

  // Estado para búsqueda integrada
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Función para normalizar texto (copiada de SearchScreen)
  const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Función de búsqueda inteligente (copiada de SearchScreen)
  const searchInAllFields = (job, searchTerms) => {
    // Campos donde buscar
    const searchFields = [
      job.city,
      job.company,
      job.description,
      job.direction,
      job.position,
      job.title,
      job.type,
      job.tags
    ];

    // Normalizar todos los campos y unirlos en un solo texto
    const allFieldsText = searchFields
      .filter(field => field) // Filtrar campos vacíos/null
      .map(field => normalizeText(field.toString()))
      .join(' ');

    // Verificar que todos los términos de búsqueda estén presentes
    return searchTerms.every(term =>
      allFieldsText.includes(normalizeText(term))
    );
  };

  // Filtrar trabajos con búsqueda inteligente
  const filteredJobs = searchTerm.trim()
    ? jobs.filter(job => {
        // Dividir el término de búsqueda en palabras individuales
        const searchTerms = searchTerm.trim().split(/\s+/);
        return searchInAllFields(job, searchTerms);
      })
    : jobs; // Si no hay término de búsqueda, mostrar todos los jobs

  // Función para manejar el refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      // Simular un pequeño delay para mostrar el loading
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Los jobs se actualizan automáticamente por el listener en tiempo real
      // No necesitamos hacer nada más, solo mostrar el feedback visual
      console.log('🔄 Feed actualizado');
    } catch (error) {
      console.error('Error al actualizar feed:', error);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  // Usar hooks personalizados
  const {
    currentIndex,
    setCurrentIndex,
    isDragging,
    dragOffset,
    velocity,
    containerRef,
    handleTouchStart: originalHandleTouchStart,
    handleTouchMove: originalHandleTouchMove,
    handleTouchEnd: originalHandleTouchEnd,
    handleWheel,
    goToNext,
    goToPrev,
    goToIndex
  } = useSmoothJobNavigation(filteredJobs);

  // Handlers personalizados para pull-to-refresh
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setIsPulling(false);
    setPullDistance(0);
    originalHandleTouchStart(e);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - startY;

    // Solo activar pull-to-refresh si estamos en el primer job y arrastrando hacia abajo
    if (currentIndex === 0 && deltaY > 0 && !isDragging) {
      setIsPulling(true);
      const maxPull = 120;
      const pullDistance = Math.min(deltaY * 0.5, maxPull);
      setPullDistance(pullDistance);

      // Prevenir el scroll normal cuando estamos haciendo pull-to-refresh
      e.preventDefault();
      return;
    }

    originalHandleTouchMove(e);
  };

  const handleTouchEnd = (e) => {
    if (isPulling && pullDistance > 60) {
      handleRefresh();
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }

    originalHandleTouchEnd(e);
  };

  const {
    likes,
    bookmarks,
    calls,
    showContactOptions,
    bookmarkAnimations,
    toggleLike,
    toggleBookmark,
    toggleCall,
    toggleContactOptions
  } = useJobInteractions();

  // Estados locales restantes
  const [showMap, setShowMap] = useState(false);
  const [selectedJobLocation, setSelectedJobLocation] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [defaultMessage, setDefaultMessage] = useState(`Estimado equipo de [EMPRESA],

Les escribo con gran interés por la vacante de [PUESTO]. Adjunto mi Currículum Vitae para su consideración.

Mi experiencia y habilidades se alinean con los requisitos del puesto y estoy convencido de que puedo aportar valor a su equipo.

Agradezco su tiempo y quedo a su entera disposición para una futura entrevista.

Atentamente,
[NOMBRE]`);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJobFromProfile, setSelectedJobFromProfile] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const [showMessages, setShowMessages] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);



  // Resetear índice cuando cambie la búsqueda
  useEffect(() => {
    if (setCurrentIndex) {
      setCurrentIndex(0);
    }
  }, [searchTerm, setCurrentIndex]);
  
  // Estado centralizado del ImageViewer
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerData, setImageViewerData] = useState({ url: '', alt: '' });

  // Función para procesar los tags
  const processTags = (tagsString) => {
    if (!tagsString || typeof tagsString !== 'string') return [];

    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => `#${tag}`);
  };

  // Loading states
  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (jobsLoading) {
    return <LoadingScreen />;
  }

  if (jobsError) {
    return <LoadingScreen message="Error al cargar empleos" />;
  }

  // Función para editar empleo
  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowPublishModal(true);
  };

  // Función para eliminar empleo
  const handleDeleteJob = async (job) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleo?')) {
      try {
        await jobsService.deleteJob(job.id, currentUser.uid);
        // Recargar empleos o actualizar estado
        window.location.reload(); // Temporal, mejor usar estado
      } catch (error) {
        console.error('Error al eliminar empleo:', error);
        alert('Error al eliminar el empleo');
      }
    }
  };

  // Función para ver perfil del usuario
  const handleViewProfile = (userId) => {
    setProfileUserId(userId);
    setShowProfileModal(true);
  };

  // Función para cerrar modal de perfil
  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setProfileUserId(null);
  };

  // Función para ver job desde perfil
  const handleViewJobFromProfile = (job) => {
    console.log('🚀 App.jsx - handleViewJobFromProfile llamada con job:', job.id, job.title);
    setSelectedJobFromProfile(job);
    console.log('🚀 App.jsx - selectedJobFromProfile actualizado, cerrando ProfileModal');
    setShowProfileModal(false); // Cerrar modal de perfil
  };

  // Función para cerrar modal de publicación
  const handleClosePublishModal = () => {
    setShowPublishModal(false);
    setEditingJob(null);
  };

  // Función para extraer coordenadas de GeoPoint de Firestore
  const getCoordinatesFromGeoPoint = (ubication) => {
    if (!ubication) return null;

    // Manejar GeoPoint de Firestore (_lat, _long)
    if (ubication._lat !== undefined && ubication._long !== undefined) {
      return {
        lat: ubication._lat,
        lng: ubication._long
      };
    }

    // Manejar formato estándar (lat, lng)
    if (ubication.lat !== undefined && ubication.lng !== undefined) {
      return {
        lat: ubication.lat,
        lng: ubication.lng
      };
    }

    return null;
  };

  const openMapWithLocation = (job) => {
    console.log('🗺️ Intentando abrir mapa para job:', job.id);
    console.log('📍 Datos de ubicación completos:', job.ubication);

    const coords = getCoordinatesFromGeoPoint(job.ubication);
    console.log('📍 Coordenadas extraídas:', coords);

    if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      console.log('✅ Coordenadas válidas, abriendo mapa con job específico');
      setSelectedJobLocation({
        lat: coords.lat,
        lng: coords.lng,
        job: job
      });
      setShowMap(true);
    } else {
      console.log('❌ Coordenadas inválidas o faltantes');
      alert('Este empleo no tiene ubicación configurada');
    }
  };

  const goHome = () => {
    console.log('🏠 Volviendo a la vista de inicio');
    setShowMap(false);
    setSelectedJobLocation(null);
    setCurrentView('home');
    setShowPublishModal(false);
    setShowFavorites(false);

    setShowMessages(false); // Cerrar mensajes
    setSelectedChatUser(null);
  };

  const openMap = () => {
    setShowMap(true);
    setCurrentView('map');
    setShowFavorites(false);
    setShowPublishModal(false);

    setShowMessages(false); // Cerrar mensajes
    setSelectedChatUser(null);
  };

  const openPublish = () => {
    setShowPublishModal(true);
    setCurrentView('publish');
    setShowFavorites(false);
    setShowMap(false);
    setSelectedJobLocation(null);

    setShowMessages(false); // Cerrar mensajes
    setSelectedChatUser(null);
  };

  const closePublish = () => {
    setShowPublishModal(false);
    setCurrentView('home');
  };

  const openFavorites = () => {
    setShowFavorites(true);
    setCurrentView('favorites');
    setShowPublishModal(false);
    setShowMap(false);
    setSelectedJobLocation(null);

    setShowMessages(false); // Cerrar mensajes
    setSelectedChatUser(null);
  };

  const closeFavorites = () => {
    setShowFavorites(false);
    setCurrentView('home');
  };



  const openMessages = () => {
    setShowMessages(true);
    setCurrentView('messages');
    setShowPublishModal(false);
    setShowMap(false);
    setShowFavorites(false);

    setSelectedJobLocation(null);

    // Mostrar banner de notificaciones si no están habilitadas y no se ha descartado permanentemente
    const permanentlyDismissed = localStorage.getItem('notifications-permanently-dismissed') === 'true';
    if (!notificationsEnabled && !permanentlyDismissed) {
      setShowNotificationBanner(true);
    }
  };

  const closeMessages = () => {
    setShowMessages(false);
    setSelectedChatUser(null);
    setCurrentView('home');
    setShowNotificationBanner(false); // Cerrar banner al cerrar mensajes
  };

  const handleNotificationBannerClose = (activated) => {
    setShowNotificationBanner(false);
    if (activated) {
      console.log('✅ Notificaciones activadas exitosamente');
    }
  };

  const handleJobPublished = (newJobId = null) => {
    // Cerrar modal y navegar al feed
    setShowPublishModal(false);
    setCurrentView('home');
    setShowMap(false);
    setSelectedJobLocation(null);
    setShowFavorites(false);

    // Si tenemos el ID del nuevo job, intentar navegar a él
    if (newJobId && jobs.length > 0) {
      // Buscar el índice del nuevo job una vez que se actualice la lista
      setTimeout(() => {
        const newJobIndex = jobs.findIndex(job => job.id === newJobId);
        if (newJobIndex !== -1) {
          setCurrentIndex(newJobIndex);
        }
      }, 1000); // Dar tiempo para que se actualice la lista de jobs
    }

    // No recargar la página - los jobs se actualizan automáticamente por la suscripción
  };

  // Función para cerrar el mapa y volver a home
  const closeMap = () => {
    setShowMap(false);
    setSelectedJobLocation(null);
    setCurrentView('home');
  };

  // Función para verificar si un job tiene ubicación válida
  const hasValidLocation = (job) => {
    const coords = getCoordinatesFromGeoPoint(job?.ubication);
    const isValid = coords &&
                   typeof coords.lat === 'number' &&
                   typeof coords.lng === 'number' &&
                   !isNaN(coords.lat) &&
                   !isNaN(coords.lng);

    console.log(`📍 Job ${job?.id} tiene ubicación válida:`, isValid, job?.ubication);
    return isValid;
  };

  const currentJob = jobs && jobs.length > 0 ? jobs[currentIndex] : null;

  const handleEmailContact = (email, jobTitle, company) => {
    const userName = userProfile?.displayName || currentUser?.displayName || 'Usuario';
    
    const personalizedMessage = defaultMessage
      .replace('[EMPRESA]', company || 'su empresa')
      .replace('[PUESTO]', jobTitle || 'la posición disponible')
      .replace('[NOMBRE]', userName);
    
    const subject = `Aplicación para ${jobTitle || 'posición disponible'}`;
    const body = encodeURIComponent(personalizedMessage);
    
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`, '_blank');
  };

  const handleWhatsAppContact = (phoneNumber, jobTitle, company) => {
    const userName = userProfile?.displayName || currentUser?.displayName || 'Usuario';
    
    const personalizedMessage = defaultMessage
      .replace('[EMPRESA]', company || 'su empresa')
      .replace('[PUESTO]', jobTitle || 'la posición disponible')
      .replace('[NOMBRE]', userName);
    
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(personalizedMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const handleWebsiteContact = (website) => {
    // Asegurar que la URL tenga protocolo
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank');
  };

  // Función para compartir empleo
  const handleShareJob = (job) => {
    const shareData = {
      title: `${job.title} - JoMatch`,
      text: `¡Mira esta oportunidad laboral! ${job.title}`,
      url: window.location.href
    };

    if (navigator.share) {
      // Usar Web Share API si está disponible (móviles)
      navigator.share(shareData).catch(err => {
        console.log('Error al compartir:', err);
        fallbackShare(job);
      });
    } else {
      // Fallback para escritorio
      fallbackShare(job);
    }
  };

  // Función fallback para compartir
  const fallbackShare = (job) => {
    const shareText = `¡Mira esta oportunidad laboral! ${job.title} - ${window.location.href}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('¡Enlace copiado al portapapeles!');
      }).catch(() => {
        // Si falla el clipboard, mostrar el texto para copiar manualmente
        prompt('Copia este enlace:', shareText);
      });
    } else {
      // Fallback más básico
      prompt('Copia este enlace:', shareText);
    }
  };

  // Función para manejar envío de mensajes
  const handleSendMessage = (recipientId, recipientName) => {
    console.log('Enviar mensaje a:', recipientId, recipientName);
    setSelectedChatUser({ recipientId, recipientName });
    openMessages();
  };



  // Función para abrir el ImageViewer centralizado
  const handleOpenImageViewer = (imageUrl, alt, imgElement = null) => {
    setImageViewerData({ url: imageUrl, alt: alt, imgElement: imgElement });
    setShowImageViewer(true);
  };

  // Función para cerrar el ImageViewer
  const handleCloseImageViewer = () => {
    setShowImageViewer(false);
    setImageViewerData({ url: '', alt: '' });
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative"
         style={{
           // Asegurar que la app use toda la pantalla disponible
           height: '100vh',
           height: '100dvh', // Dynamic viewport height para móviles
/*            paddingTop: 'env(safe-area-inset-top)',
           paddingBottom: 'env(safe-area-inset-bottom)' */
         }}>
      {/* Sidebar fija - SIEMPRE visible */}
      <Sidebar
        onOpenMap={openMap}
        onGoHome={goHome}
        onOpenPublish={openPublish}
        onOpenFavorites={openFavorites}
        onOpenMessages={openMessages}
        currentView={currentView}
        onEditJob={handleEditJob}
        onViewJob={handleViewJobFromProfile}
      />

      {/* Debug Panel - Solo en desarrollo */}
      {/* <DebugPanel currentJob={currentJob} jobs={jobs} /> */}
      
      {/* Container principal */}
      <div
        ref={containerRef}
        className="fixed overflow-hidden w-full md:h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{
          touchAction: 'none',
          width: '100vw',
          height: '100vh',
          // En móvil, ajustar para el sidebar inferior y la barra de navegación del teléfono
          paddingBottom: 'calc(65px + env(safe-area-inset-bottom))',
          // Asegurar que esté por encima de la barra de navegación del dispositivo
          paddingTop: 'env(safe-area-inset-top)',
          zIndex: 0,
          // Mejorar el rendimiento del scroll
          willChange: isDragging ? 'transform' : 'auto',
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
      >
        {/* Pull-to-refresh indicator */}
        {(isPulling || isRefreshing) && currentView === 'home' && (
          <div
            className="md:hidden absolute top-0 left-0 right-0 z-40 flex justify-center items-center"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
              transform: `translateY(${isPulling ? pullDistance - 60 : 0}px)`,
              opacity: isPulling ? Math.min(pullDistance / 60, 1) : 1
            }}
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-3 shadow-lg">
              <div
                className="w-6 h-6 border-2 border-white/30 border-t-[#FBB581] rounded-full"
                style={{
                  animation: isRefreshing
                    ? 'spin 0.8s linear infinite'
                    : 'none',
                  transform: isPulling && !isRefreshing
                    ? `rotate(${Math.min(pullDistance * 6, 360)}deg)`
                    : 'none',
                  transition: isPulling ? 'none' : 'transform 0.3s ease-out'
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Barra de búsqueda móvil - Funcional */}
        {currentView === 'home' && (
          <div className="md:hidden absolute top-0 left-0 right-0 z-50 p-3"
               style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
            <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
              <div className="flex items-center">
                <FaSearch className="absolute left-3 text-white/40 text-sm" />
                <input
                  type="text"
                  placeholder="Buscar empleos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-transparent text-white placeholder-white/60 focus:outline-none text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 text-white/40 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Barra de búsqueda desktop - Funcional */}
        {currentView === 'home' && (
          <div className="hidden md:block absolute pl-50 py-4 top-0 left-0 right-0 z-50">
            <div className="max-w-md p-6 mx-auto">
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
                <div className="flex items-center">
                  <FaSearch className="absolute left-3 text-white/40 text-sm" />
                  <input
                    type="text"
                    placeholder="Buscar empleos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-transparent text-white placeholder-white/60 focus:outline-none focus:border-[#FBB581] text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 text-white/40 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mostrar mensaje si no hay empleos */}
        {(!jobs || jobs.length === 0) ? (
          <div className="w-full md:pl-50 h-full flex items-center justify-center">
            <div className="text-white text-xl">No hay empleos disponibles</div>
          </div>
        ) : filteredJobs.length === 0 && searchTerm.trim() ? (
          /* Mensaje cuando no hay resultados de búsqueda */
          <div className="w-full md:pl-50 h-full flex items-center justify-center">
            <div className="text-center">
              <FaSearch className="text-white/30 text-3xl mb-3 mx-auto" />
              <div className="text-white text-lg mb-2">No se encontraron empleos</div>
              <div className="text-white/60 text-sm">
                Intenta con otros términos de búsqueda
              </div>
            </div>
          </div>
        ) : (
          /* Contenedor de empleos existente */
          <div
            className="relative w-full h-full"
            style={{
              transform: `translateY(${(-currentIndex * 100) + (dragOffset / window.innerHeight * 100) + (isPulling && currentIndex === 0 ? pullDistance * 0.3 : 0)}vh)`,
              willChange: 'transform',
              transition: isDragging || isPulling ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              backfaceVisibility: 'hidden'
            }}
          >
            {filteredJobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                index={index}
                currentIndex={currentIndex}
                bookmarks={bookmarks}
                bookmarkAnimations={bookmarkAnimations}
                showContactOptions={showContactOptions}
                onToggleBookmark={toggleBookmark}
                onToggleContactOptions={toggleContactOptions}
                onOpenMapWithLocation={openMapWithLocation}
                hasValidLocation={hasValidLocation}
                onEmailContact={handleEmailContact}
                onWhatsAppContact={handleWhatsAppContact}
                onWebsiteContact={handleWebsiteContact}
                onEditJob={handleEditJob}
                onDeleteJob={handleDeleteJob}
                onViewProfile={handleViewProfile}
                onShareJob={handleShareJob}
                onOpenImageViewer={handleOpenImageViewer}
                processTags={processTags}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mapa */}
      {showMap && (
        <MapView
          jobs={selectedJobLocation && selectedJobLocation.job ? [selectedJobLocation.job] : jobs}
          bookmarks={bookmarks}
          bookmarkAnimations={bookmarkAnimations}
          showContactOptions={showContactOptions}
          onToggleBookmark={toggleBookmark}
          onToggleContactOptions={toggleContactOptions}
          onOpenMapWithLocation={openMapWithLocation}
          hasValidLocation={hasValidLocation}
          onEmailContact={handleEmailContact}
          onWhatsAppContact={handleWhatsAppContact}
          onWebsiteContact={handleWebsiteContact}
          onEditJob={handleEditJob}
          onDeleteJob={handleDeleteJob}
          onViewProfile={handleViewProfile}
          onShareJob={handleShareJob}
          processTags={processTags}
          onClose={() => {
            setShowMap(false);
            setSelectedJobLocation(null);
          }}
          selectedJobLocation={selectedJobLocation}
        />
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={handleCloseProfileModal}
        defaultMessage={defaultMessage}
        setDefaultMessage={setDefaultMessage}
        userId={profileUserId}
        onEditJob={handleEditJob}
        onSendMessage={handleSendMessage}
        onViewJob={handleViewJobFromProfile}
      />

      {/* PWA Install Button */}
      <InstallPWA />

      <div className="text-center bg-black mb-6">
      {/* Modal de publicar empleo */}
      {showPublishModal && (
        <PublishJobScreen
          onClose={handleClosePublishModal}
          onJobPublished={(newJobId) => {
            handleClosePublishModal();
            handleJobPublished(newJobId);
          }}
          editingJob={editingJob}
        />
      )}
      </div>

      {/* Pantalla de favoritos */}
      {showFavorites && (
        <FavoriteJobs
          jobs={jobs}
          bookmarks={bookmarks}
          bookmarkAnimations={bookmarkAnimations}
          showContactOptions={showContactOptions}
          onToggleBookmark={toggleBookmark}
          onToggleContactOptions={toggleContactOptions}
          onOpenMapWithLocation={openMapWithLocation}
          hasValidLocation={hasValidLocation}
          onEmailContact={handleEmailContact}
          onWhatsAppContact={handleWhatsAppContact}
          onWebsiteContact={handleWebsiteContact}
          onEditJob={handleEditJob}
          onDeleteJob={handleDeleteJob}
          onViewProfile={handleViewProfile}
          onShareJob={handleShareJob}
          processTags={processTags}
          onClose={closeFavorites}
        />
      )}



      {/* Pantalla de mensajes */}
      {showMessages && (
        <ConversationsScreen
          onClose={closeMessages}
          selectedChatUser={selectedChatUser}
        />
      )}

      {/* Banner de permisos de notificación */}
      {currentUser && (
        <NotificationPermission
          notificationsEnabled={notificationsEnabled}
          onRequestPermission={requestNotificationPermission}
          show={showNotificationBanner}
          onClose={handleNotificationBannerClose}
        />
      )}

      {/* Job Modal desde perfil */}
      {console.log('🎯 App.jsx - Renderizando JobModal con selectedJobFromProfile:', selectedJobFromProfile)}
      <JobModal
        job={selectedJobFromProfile}
        isOpen={!!selectedJobFromProfile}
        onClose={() => {
          console.log('🎯 App.jsx - Cerrando JobModal desde perfil');
          setSelectedJobFromProfile(null);
        }}
        bookmarks={bookmarks}
        bookmarkAnimations={bookmarkAnimations}
        showContactOptions={showContactOptions}
        onToggleBookmark={toggleBookmark}
        onToggleContactOptions={toggleContactOptions}
        onOpenMapWithLocation={openMapWithLocation}
        hasValidLocation={hasValidLocation}
        onEmailContact={handleEmailContact}
        onWhatsAppContact={handleWhatsAppContact}
        onWebsiteContact={handleWebsiteContact}
        onEditJob={handleEditJob}
        onDeleteJob={handleDeleteJob}
        onViewProfile={handleViewProfile}
        onShareJob={handleShareJob}
        processTags={processTags}
      />

      {/* ImageViewer centralizado con z-index máximo */}
      <ImageViewer
        imageUrl={imageViewerData.url}
        alt={imageViewerData.alt}
        isOpen={showImageViewer}
        onClose={handleCloseImageViewer}
      />
    </div>
  );
};

export default App;



