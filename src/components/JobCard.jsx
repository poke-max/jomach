import React, { useState, useEffect } from 'react';
import JobActions from './JobActions';
import { storageService } from '../firebase/storageService';

const JobCard = ({
  job,
  index,
  currentIndex,
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
  const [imageUrl, setImageUrl] = useState(job.url);

  useEffect(() => {
    const loadImage = async () => {
      if (job.url && job.url.startsWith('gs://')) {
        const downloadUrl = await storageService.convertGsUrlToDownloadUrl(job.url);
        setImageUrl(downloadUrl);
      }
    };
    
    loadImage();
  }, [job.url]);

  return (
<div
      key={job.id}
      className="absolute w-full flex items-center justify-center md:bottom-0 pb-[calc(65px+env(safe-area-inset-bottom))] md:pb-0"
      style={{
        top: `${index * 100}vh`,
        height: '100vh',
        paddingTop: 'env(safe-area-inset-top)'
      }}
    >
      {/* Contenedor del job con iconos al lado */}
      <div className="relative flex items-center justify-center h-full gap-6">
        {/* Contenedor de imagen con fondo borroso */}
        <div className="relative h-full flex items-center justify-center overflow-hidden md:rounded-2xl md:aspect-[9/16]">
          {/* Imagen de fondo borrosa que llena todo el contenedor */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px)'
            }}
          />
          
          {/* Overlay oscuro sobre el fondo borroso */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Imagen principal que llena todo el ancho en móvil */}
          <img 
            src={imageUrl}
            alt={job.ubication}
            className="relative z-10 w-full h-auto max-w-full md:h-full md:w-auto md:object-contain object-contain md:rounded-2xl shadow-2xl"
            loading={Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy"}
          />

          {/* Título y información posicionados en la parte inferior izquierda */}
          <div className="absolute bottom-0 left-0 md:pb-4 pl-2 z-30 pb-[calc(1em+env(safe-area-inset-bottom))]">
            <div className="max-w-full">
              {/* Título del trabajo - 100% blanco */}
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

              {/* Información adicional del trabajo - Texto transparente */}
              <div className="mb-3 space-y-1">
                {/* Vacantes disponibles y Rango salarial en la misma línea */}
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

                    {/* Ciudad - Texto transparente */}
                    {job.city && (
                      <p className="text-white/70 text-xs drop-shadow-lg flex items-center">
                        <i className="fas fa-building w-3 text-center mr-1 opacity-60" style={{fontSize: '10px'}}></i>
                        {job.city}
                      </p>
                    )}
                  </div>
                )}

                {/* Dirección - Texto transparente */}
                {job.direction && (
                  <p className="text-white/70 text-xs drop-shadow-lg flex items-center">
                    <i className="fas fa-map-pin w-3 text-center mr-1 opacity-60" style={{fontSize: '10px'}}></i>
                    {job.direction}
                  </p>
                )}
              </div>

              {/* Tags - Texto transparente */}
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
            </div>
          </div>
          
          {/* Gradiente overlay más fuerte en la parte inferior */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20 pointer-events-none" />
        </div>

        {/* Iconos al lado del job */}
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
    </div>
  );
};

export default JobCard;