import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaBookmark, FaMapMarkerAlt, FaClock, FaDollarSign, FaTimes, FaSearch } from 'react-icons/fa';
import JobActions from './JobActions';
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
  // Estado para el buscador
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrar solo los trabajos que están marcados como favoritos
  const favoriteJobs = jobs.filter(job => bookmarks[job.id]);
  
  // Función para normalizar texto para búsqueda (sin acentos y en minúsculas)
  const normalizeText = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Filtrar trabajos por término de búsqueda
  const filteredJobs = favoriteJobs.filter(job => {
    if (!searchTerm.trim()) return true;
    
    const normalizedSearch = normalizeText(searchTerm);
    
    // Buscar en el título
    const titleMatch = normalizeText(job.title).includes(normalizedSearch);
    
    // Buscar en tags
    let tagsMatch = false;
    if (job.tags) {
      const jobTags = processTags(job.tags);
      tagsMatch = jobTags.some(tag => normalizeText(tag).includes(normalizedSearch));
    }
    
    return titleMatch || tagsMatch;
  });
  
  // Estado para manejar la vista detallada
  const [selectedJob, setSelectedJob] = useState(null);

  const formatSalary = (salary) => {
    if (!salary) return 'No especificado';
    
    if (typeof salary === 'number') {
      return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(salary);
    }
    
    return salary;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      let date;
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Vista detallada del job (similar a JobCard)
  const JobDetailView = ({ job }) => (
    <div className="fixed inset-0 bg-black z-[60] overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={() => setSelectedJob(null)}
          className="flex items-center gap-2 text-white hover:text-[#FBB581] transition-colors"
        >
          <FaArrowLeft className="text-lg" />
          <span className="text-sm font-medium">Volver a favoritos</span>
        </button>
      </div>

      {/* Background Image */}
      <div className="absolute inset-0">
        <JobImage
          job={job}
          className="w-full h-full object-cover"
          fallbackContent={
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700"></div>
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50"></div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
            {job.title}
          </h1>
          <p className="text-[#FBB581] text-lg font-semibold mb-4">
            {job.company}
          </p>


          
          {job.description && (
            <p className="text-white/90 text-base mb-6 leading-relaxed">
              {job.description}
            </p>
          )}

          {/* Job Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <FaDollarSign className="text-[#00A888] text-lg" />
              <span className="text-white/90">
                {formatSalary(job.salary)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <FaClock className="text-blue-400 text-lg" />
              <span className="text-white/90">
                {formatDate(job.createdAt)}
              </span>
            </div>

            {job.location && (
              <div className="flex items-center gap-3 md:col-span-2">
                <FaMapMarkerAlt className="text-[#FF4438] text-lg" />
                <span className="text-white/90">
                  {job.location}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {job.tags && (
            <div className="flex flex-wrap gap-2 mb-6">
              {processTags(job.tags).map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium border border-white/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Actions */}
      <JobActions
        job={job}
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
      />
    </div>
  );

  // Si hay un job seleccionado, mostrar la vista detallada
  if (selectedJob) {
    return <JobDetailView job={selectedJob} />;
  }

  // Vista principal de favoritos
  return (
<>
      {/* Mobile: ocupar toda la pantalla excepto el bottom nav */}
<div className="md:hidden fixed inset-0 bg-black z-50 overflow-hidden"
           style={{ 
             paddingBottom: 'calc(65px + env(safe-area-inset-bottom))',
             paddingTop: 'env(safe-area-inset-top)'
           }}>
        
        {/* Header Mobile */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-white hover:text-[#FBB581] transition-colors"
          >
            <FaArrowLeft className="text-sm" />
            <span className="text-xs font-medium">Volver</span>
          </button>
          
          <div className="flex items-center gap-1.5">
            <FaBookmark className="text-yellow-400 text-sm" />
            <h1 className="text-white text-sm font-semibold">Favoritos</h1>
          </div>
          
          <div className="w-12"></div>
        </div>

        {/* Buscador Mobile */}
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 text-sm" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:border-[#FBB581]/50 focus:bg-white/15 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* Content Mobile */}
        <div className="absolute inset-x-0 top-[98px] bottom-0 flex flex-col">
          {favoriteJobs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <FaBookmark className="text-white/30 text-4xl mb-3" />
              <h2 className="text-white text-lg font-semibold mb-2">No tienes trabajos guardados</h2>
              <p className="text-white/60 text-sm">
                Marca trabajos como favoritos para verlos aquí
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <FaSearch className="text-white/30 text-4xl mb-3" />
              <h2 className="text-white text-lg font-semibold mb-2">No se encontraron resultados</h2>
              <p className="text-white/60 text-sm">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  {/* Image Container with Status Icon */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden">
                      <JobImage
                        job={job}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Status Circle - positioned outside the image container */}
                    <div className="absolute -top-2 -right-2">
                      <div className={`w-5 h-5 rounded-full border-2 border-black ${
                        job.isActive ? 'bg-[#00A888]' : 'bg-[#FF4438]'
                      } shadow-lg`}></div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-[#FBB581] text-xs font-medium line-clamp-1 mb-1">
                      {job.company}
                    </p>
                    {/* Created At - Texto transparente */}
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
          width: 'calc(100vw - 200px)', // Dejar espacio para el sidebar en desktop
          left: '200px' // Posicionar después del sidebar en desktop
        }}
      >
        {/* Header Desktop */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FaBookmark className="text-yellow-400 text-lg" />
            <h1 className="text-white text-lg font-semibold">Favoritos</h1>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Buscador Desktop */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 text-sm" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:border-[#FBB581]/50 focus:bg-white/15 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* Content Desktop */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {favoriteJobs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <FaBookmark className="text-white/30 text-4xl mb-4" />
              <h2 className="text-white text-lg font-semibold mb-2">No tienes trabajos guardados</h2>
              <p className="text-white/60 text-sm">
                Marca trabajos como favoritos para verlos aquí
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <FaSearch className="text-white/30 text-4xl mb-4" />
              <h2 className="text-white text-lg font-semibold mb-2">No se encontraron resultados</h2>
              <p className="text-white/60 text-sm">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  {/* Image Container with Status Icon */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                      <JobImage
                        job={job}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Status Circle - positioned outside the image container */}
                    <div className="absolute -top-2 -right-2">
                      <div className={`w-4 h-4 rounded-full border-2 border-black ${
                        job.isActive ? 'bg-[#00A888]' : 'bg-[#FF4438]'
                      } shadow-lg`}></div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-[#FBB581] text-xs font-medium line-clamp-1 mb-1">
                      {job.company}
                    </p>
                                                  {/* Created At - Texto transparente */}
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
    </>
  );
};

export default FavoriteJobs;