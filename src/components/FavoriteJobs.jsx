import React, { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaBookmark, FaMapMarkerAlt, FaClock, FaDollarSign, FaTimes, FaSearch } from 'react-icons/fa';
import JobActions from './JobActions';
import JobModal from './JobModal';
import { storageService } from '../firebase/storageService';

// Componente para manejar imágenes de trabajos con conversión de URLs
const JobImage = ({ job, className, onError, onLoad, fallbackContent }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      setError(false);
      
      try {
        let url = job.imageUrl || job.url;
        
        if (url && url.startsWith('gs://')) {
          url = await storageService.convertGsUrlToDownloadUrl(url);
        }
        
        if (url) {
          setImageUrl(url);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error loading image for job:', job.id, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [job.imageUrl, job.url, job.id]);

  if (loading) {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center`}>
        <div className="animate-pulse text-white text-xs">Cargando...</div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return fallbackContent || (
      <div className={`${className} bg-gradient-to-br from-[#D361A5] to-[#673AB7] flex items-center justify-center`}>
        <span className="text-white text-xs font-bold">
          {job.company?.charAt(0) || 'J'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={job.title}
      className={className}
      onError={(e) => {
        console.log('Error loading image:', imageUrl);
        setError(true);
        onError?.(e);
      }}
      onLoad={(e) => {
        console.log('Image loaded successfully:', imageUrl);
        onLoad?.(e);
      }}
    />
  );
};

const FavoriteJobs = ({ 
  jobs, 
  bookmarks, 
  bookmarkAnimations,
  showContactOptions,
  onToggleBookmark,
  onToggleContactOptions,
  onOpenMapWithLocation,
  hasValidLocation,
  onEmailContact,
  onWhatsAppContact,
  onWebsiteContact,
  onEditJob,
  onDeleteJob,
  onViewProfile,
  onShareJob,
  processTags,
  onClose 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Filtrar solo los trabajos que están marcados como favoritos
  const favoriteJobs = jobs.filter(job => bookmarks[job.id]);
  
  // Función para normalizar texto para búsqueda
  const normalizeText = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Filtrar trabajos por término de búsqueda (solo título)
  const filteredJobs = favoriteJobs.filter(job => {
    if (!searchTerm.trim()) return true;
    
    const normalizedSearch = normalizeText(searchTerm);
    const titleMatch = normalizeText(job.title).includes(normalizedSearch);
    
    return titleMatch;
  });

  return (
    <>
      {/* Mobile: pantalla completa */}
      <div className="md:hidden fixed inset-0 z-30 bg-black"
           style={{ paddingBottom: 'calc(65px + env(safe-area-inset-bottom))' }}>
        {/* Header Mobile */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FaBookmark className="text-yellow-400 text-sm" />
            <h1 className="text-white text-md font-semibold">Favoritos</h1>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1"
          >
            <FaTimes className="text-md" />
          </button>
        </div>

        {/* Search Bar Mobile */}
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40 text-xs" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-[#FBB581] text-sm"
            />
          </div>
        </div>

        {/* Content Mobile */}
        <div className="flex-1 overflow-y-auto">
          {favoriteJobs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <FaBookmark className="text-white/30 text-3xl mb-3" />
              <h2 className="text-white text-sm font-semibold mb-2">No tienes trabajos guardados</h2>
              <p className="text-white/60 text-xs">
                Marca trabajos como favoritos para verlos aquí
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <FaSearch className="text-white/30 text-3xl mb-3" />
              <h2 className="text-white text-sm font-semibold mb-2">No se encontraron resultados</h2>
              <p className="text-white/60 text-xs">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              <p className="text-white/60 text-xs mb-3">
                {filteredJobs.length} favorito{filteredJobs.length !== 1 ? 's' : ''} encontrado{filteredJobs.length !== 1 ? 's' : ''}
              </p>
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  {/* Image Container with Status Icon */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                      <JobImage
                        job={job}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <div className={`w-4 h-4 rounded-full border-2 border-black ${
                        job.isActive ? 'bg-[#00A888]' : 'bg-[#FF4438]'
                      } shadow-lg`}></div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm line-clamp-1 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-[#FBB581] text-xs font-medium line-clamp-1 mb-1">
                      {job.company}
                    </p>
                    {job.createdAt && (
                      <span className="inline-block text-white/70 text-xs drop-shadow-lg flex items-center">
                        {new Date(job.createdAt.seconds * 1000).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                    {(job.city || job.direction) && (
                      <p className="text-white/60 text-xs line-clamp-1">
                        {[job.city, job.direction].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: panel lateral */}
      <div 
        className="hidden md:flex fixed right-0 top-0 bottom-0 bg-black/95 backdrop-blur-sm border-l border-white/10 z-40 overflow-hidden flex-col"
        style={{
          width: 'calc(100vw - 200px)',
          left: '200px'
        }}
      >
        {/* Header Desktop */}
        <div className="flex items-center justify-between p-4 px-8 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FaBookmark className="text-yellow-400 text-sm" />
            <h1 className="text-white text-lg font-semibold">Favoritos</h1>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Search Bar Desktop */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40 text-xs" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-[#FBB581] text-sm"
            />
          </div>
        </div>

        {/* Content Desktop */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {favoriteJobs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <FaBookmark className="text-white/30 text-3xl mb-3" />
              <h2 className="text-white text-sm font-semibold mb-2">No tienes trabajos guardados</h2>
              <p className="text-white/60 text-xs">
                Marca trabajos como favoritos para verlos aquí
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <FaSearch className="text-white/30 text-3xl mb-3" />
              <h2 className="text-white text-sm font-semibold mb-2">No se encontraron resultados</h2>
              <p className="text-white/60 text-xs">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <p className="text-white/60 text-xs mb-3">
                {filteredJobs.length} favorito{filteredJobs.length !== 1 ? 's' : ''} encontrado{filteredJobs.length !== 1 ? 's' : ''}
              </p>
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                      <JobImage
                        job={job}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <div className={`w-4 h-4 rounded-full border-2 border-black ${
                        job.isActive ? 'bg-[#00A888]' : 'bg-[#FF4438]'
                      } shadow-lg`}></div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm line-clamp-1 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-[#FBB581] text-xs font-medium line-clamp-1 mb-1">
                      {job.company}
                    </p>
                    {job.createdAt && (
                      <span className="inline-block text-white/70 text-xs drop-shadow-lg flex items-center">
                        {new Date(job.createdAt.seconds * 1000).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                    {(job.city || job.direction) && (
                      <p className="text-white/60 text-xs line-clamp-1">
                        {[job.city, job.direction].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Modal */}
      <JobModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        bookmarks={bookmarks}
        bookmarkAnimations={bookmarkAnimations}
        showContactOptions={showContactOptions}
        onToggleBookmark={onToggleBookmark}
        onToggleContactOptions={onToggleContactOptions}
        onOpenMapWithLocation={onOpenMapWithLocation}
        hasValidLocation={hasValidLocation}
        onEmailContact={onEmailContact}
        onWhatsAppContact={onWhatsAppContact}
        onWebsiteContact={onWebsiteContact}
        onEditJob={onEditJob}
        onDeleteJob={onDeleteJob}
        onViewProfile={onViewProfile}
        onShareJob={onShareJob}
        processTags={processTags}
      />
    </>
  );
};

export default FavoriteJobs;