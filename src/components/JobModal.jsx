import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import JobActions from './JobActions';
import ImageViewer from './ImageViewer';
import { storageService } from '../firebase/storageService';

const JobModal = ({
  job,
  isOpen,
  onClose,
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
  processTags
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!job) return;
      
      // Intentar con imageUrl primero, luego con url
      let url = job.imageUrl || job.url;
      
      if (url && url.startsWith('gs://')) {
        const downloadUrl = await storageService.convertGsUrlToDownloadUrl(url);
        setImageUrl(downloadUrl);
      } else if (url) {
        setImageUrl(url);
      } else {
        setImageUrl(null);
      }
    };
    
    loadImage();
  }, [job?.imageUrl, job?.url, job?.id]);

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black z-[70] overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white hover:text-[#FBB581] transition-colors"
        >
          <FaArrowLeft className="text-lg" />
          <span className="text-sm font-medium">Volver</span>
        </button>
      </div>

      {/* Contenedor principal similar a JobCard */}
      <div className="relative flex items-center justify-center h-full gap-6">
        {/* Contenedor de imagen con fondo borroso */}
        <div className="relative h-full flex items-center justify-center overflow-hidden md:rounded-2xl md:aspect-[9/16]">
          {imageUrl ? (
            <>
              {/* Imagen de fondo borrosa */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(20px)'
                }}
              />
              
              {/* Overlay oscuro */}
              <div className="absolute inset-0 bg-black/40" />
              
              {/* Imagen principal */}
              <img
                src={imageUrl}
                alt={job.title}
                className="relative z-10 w-full h-auto max-w-full md:h-full md:w-auto md:object-contain object-contain md:rounded-2xl shadow-2xl cursor-pointer hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageViewer(true);
                }}
                title="Clic para ver en grande"
              />
            </>
          ) : (
            /* Fallback cuando no hay imagen */
            <div className="relative z-10 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D361A5] to-[#673AB7]">
              <span className="text-white text-6xl font-bold">
                {job.company?.charAt(0) || job.title?.charAt(0) || 'J'}
              </span>
            </div>
          )}

          {/* Información del job */}
          <div className="absolute bottom-0 left-0 md:pb-4 pl-2 z-30 pb-[calc(1em+env(safe-area-inset-bottom))]">
            <div className="max-w-full">
              {/* Título del trabajo */}
              <h2 className="text-white text-lg flex gap-2 md:text-sm font-bold mb-2 drop-shadow-lg leading-tight">
                <span className={`inline-block text-xs px-2 py-0 rounded-full font-medium drop-shadow-lg ${
                  job.isActive !== false
                    ? 'bg-[#00A888] text-white'
                    : 'bg-[#FF4438] text-white'
                }`}>
                  {job.isActive !== false ? 'Disponible' : 'Cerrado'}
                </span>
                {job.title}
              </h2>

              {/* Información adicional */}
              <div className="mb-3 space-y-1">
                {(job.vacancies || job.salary_range) && (
                  <div className="flex items-center gap-2">
                    {job.vacancies && (
                      <p className="text-white/70 text-xs drop-shadow-lg flex items-center">
                        <i className="fas fa-user w-3 text-center mr-1 opacity-60" style={{fontSize: '10px'}}></i>
                        {job.vacancies} vacantes
                      </p>
                    )}
                    
                    {job.salary_range && (
                      <p className="text-white/70 text-xs drop-shadow-lg flex items-center">
                        <i className="fas fa-dollar-sign w-3 text-center mr-1 opacity-60" style={{fontSize: '10px'}}></i>
                        {job.salary_range}
                      </p>
                    )}

                    {job.city && (
                      <p className="text-white/70 text-xs drop-shadow-lg flex items-center">
                        <i className="fas fa-building w-3 text-center mr-1 opacity-60" style={{fontSize: '10px'}}></i>
                        {job.city}
                      </p>
                    )}
                  </div>
                )}

                {job.direction && (
                  <p className="text-white/70 text-xs drop-shadow-lg flex items-center">
                    <i className="fas fa-map-pin w-3 text-center mr-1 opacity-60" style={{fontSize: '10px'}}></i>
                    {job.direction}
                  </p>
                )}
              </div>

              {/* Tags */}
              {job.tags && (
                <div className="flex flex-wrap gap-2 max-w-full">
                  {processTags(job.tags).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="inline-block text-xs bg-white/20 backdrop-blur-sm text-white/80 text-sm px-1 py-0 rounded-full font-medium drop-shadow-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Fecha de creación */}
              {job.createdAt && (
                <span className="inline-block text-white/70 text-xs drop-shadow-lg flex items-center">
                  {new Date(job.createdAt.seconds * 1000).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>
          
          {/* Gradiente overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20 pointer-events-none" />
        </div>


        {/* Job Actions originales para móvil */}

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

      {/* Image Viewer */}
      <ImageViewer
        imageUrl={imageUrl} // Usar imageUrl ya cargada
        alt={job.title}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
      />
    </div>
  );
};

export default JobModal;





