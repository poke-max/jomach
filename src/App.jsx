import React, { useState, useRef } from 'react';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import MapView from './components/MapView';
import DebugPanel from './components/DebugPanel';
import InstallPWA from './components/InstallPWA';
import LoadingScreen from './components/LoadingScreen';
import JobCard from './components/JobCard';
import ProfileModal from './components/ProfileModal';
import PublishJobScreen from './components/PublishJobScreen';
import FavoriteJobs from './components/FavoriteJobs';
import { useAuth } from './contexts/AuthContext';
import { useJobs } from './hooks/UseJobs';
import { useSmoothJobNavigation } from './hooks/useSmoothJobNavigation';
import { useJobInteractions } from './hooks/useJobInteractions';
import { jobsService } from './firebase/services';

const App = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs();

  // Usar hooks personalizados
  const {
    currentIndex,
    setCurrentIndex,
    isDragging,
    dragOffset,
    velocity,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    goToNext,
    goToPrev,
    goToIndex
  } = useSmoothJobNavigation(jobs);

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
  const [showFavorites, setShowFavorites] = useState(false);

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
    setShowPublishModal(false); // Cerrar modal de publicar
    setShowFavorites(false); // Cerrar favoritos
  };

  const openMap = () => {
    setShowMap(true);
    setCurrentView('map');
    setShowFavorites(false); // Cerrar favoritos
    setShowPublishModal(false); // Cerrar modal de publicar
  };

  const openPublish = () => {
    setShowPublishModal(true);
    setCurrentView('publish');
    setShowFavorites(false); // Cerrar favoritos
    setShowMap(false); // Cerrar mapa
    setSelectedJobLocation(null);
  };

  const closePublish = () => {
    setShowPublishModal(false);
    setCurrentView('home');
  };

  const openFavorites = () => {
    setShowFavorites(true);
    setCurrentView('favorites');
    setShowPublishModal(false); // Cerrar modal de publicar
    setShowMap(false); // Cerrar mapa
    setSelectedJobLocation(null);
  };

  const closeFavorites = () => {
    setShowFavorites(false);
    setCurrentView('home');
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
        currentView={currentView}
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
        {/* Mostrar mensaje si no hay empleos */}
        {(!jobs || jobs.length === 0) ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-xl">No hay empleos disponibles</div>
          </div>
        ) : (
          /* Contenedor de empleos existente */
          <div 
            className="relative w-full h-full"
            style={{ 
              transform: `translateY(${(-currentIndex * 100) + (dragOffset / window.innerHeight * 100)}vh)`,
              willChange: 'transform',
              transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              backfaceVisibility: 'hidden'
            }}
          >
            {jobs.map((job, index) => (
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
      />

      {/* PWA Install Button */}
      <InstallPWA />

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
    </div>
  );
};

export default App;
