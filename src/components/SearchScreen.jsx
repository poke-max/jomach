import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaMapMarkerAlt, FaHashtag, FaUser } from 'react-icons/fa';
import JobImage from './JobImage';
import JobModal from './JobModal';
import { useJobs } from '../hooks/UseJobs';

const SearchScreen = ({
  onClose,
  onJobSelect,
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
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Usar el hook useJobs para obtener los empleos
  const { jobs, loading, error } = useJobs();

  // Manejar selección de job
  const handleJobSelect = (job) => {
    setSelectedJob(job);
  };

  console.log('🔍 SearchScreen - Jobs obtenidos:', jobs.length, jobs);

  // Función para normalizar texto
  const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Función de búsqueda inteligente
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
  const filteredJobs = jobs.filter(job => {
    if (!searchTerm.trim()) return false; // Solo mostrar resultados cuando hay búsqueda

    // Dividir el término de búsqueda en palabras individuales
    const searchTerms = searchTerm.trim().split(/\s+/);
    
    return searchInAllFields(job, searchTerms);
  });

  if (loading) {
    return (
      <div className="fixed inset-0 z-40 bg-black flex items-center justify-center"
           style={{ paddingBottom: 'calc(65px + env(safe-area-inset-bottom))' }}>
        <div className="text-white text-sm">Cargando empleos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-40 bg-black flex items-center justify-center"
           style={{ paddingBottom: 'calc(65px + env(safe-area-inset-bottom))' }}>
        <div className="text-red-400 text-sm">Error al cargar empleos: {error}</div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: pantalla completa con blur de fondo */}
      <div className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-md"
           style={{ paddingBottom: 'calc(65px + env(safe-area-inset-bottom))' }}>
        <div className="h-full flex flex-col">
          {/* Barra de búsqueda en la misma posición que home */}
          <div className="absolute top-0 left-0 right-0 z-50 p-3"
               style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
            <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
              <div className="flex items-center">
                <FaSearch className="absolute left-3 text-white/40 text-sm" />
                <input
                  type="text"
                  placeholder="Buscar empleos... ej: Buenos Aires ingeniero"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-transparent text-white placeholder-white/60 focus:outline-none text-sm"
                  autoFocus
                />
                <button
                  onClick={onClose}
                  className="absolute right-3 text-white/60 hover:text-white"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Resultados Mobile - con padding top para no solapar con la barra */}
          <div className="flex-1 overflow-y-auto"
               style={{ paddingTop: 'calc(env(safe-area-inset-top) + 80px)' }}>
            {!searchTerm.trim() ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <FaSearch className="text-white/30 text-3xl mb-3" />
                <h3 className="text-white/60 text-sm font-medium mb-2">
                  Busca empleos
                </h3>
                <p className="text-white/40 text-xs mb-2">
                  Escribe palabras clave para buscar empleos
                </p>
                <p className="text-white/30 text-xs">
                  Ejemplo: "Buenos Aires ingeniero", "remoto desarrollador"
                </p>
                <p className="text-white/60 text-xs mt-3">
                  Total de empleos disponibles: {jobs.length}
                </p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <FaSearch className="text-white/30 text-3xl mb-3" />
                <h3 className="text-white/60 text-sm font-medium mb-2">
                  Sin resultados
                </h3>
                <p className="text-white/40 text-xs">
                  No se encontraron empleos que coincidan con "{searchTerm}"
                </p>
                <p className="text-white/30 text-xs mt-2">
                  Intenta con otras palabras clave
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                <p className="text-white/60 text-xs mb-3">
                  {filteredJobs.length} resultado{filteredJobs.length !== 1 ? 's' : ''} para "{searchTerm}"
                </p>
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleJobSelect(job)}
                    className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden">
                        <JobImage
                          job={job}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm truncate">
                        {job.title}
                      </h3>
                      <p className="text-white/60 text-xs truncate">
                        {job.company}
                      </p>
                      <p className="text-white/40 text-xs truncate">
                        {job.city || job.direction}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[#FBB581] text-xs font-medium">
                        ${job.salary?.toLocaleString() || 'No especificado'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: panel lateral que no cubra el sidebar */}
      <div className="hidden md:flex fixed right-0 top-0 bottom-0 bg-black z-30 overflow-hidden flex-col"
           style={{
             width: 'calc(100vw - 200px)',
             left: '200px'
           }}>
        {/* Header Desktop */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FaSearch className="text-white text-sm" />
            <h2 className="text-white text-lg font-semibold">Buscar</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Filtros Desktop */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40 text-xs" />
            <input
              type="text"
              placeholder="Buscar empleos... ej: Buenos Aires ingeniero"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-[#FBB581] text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* Resultados Desktop */}
        <div className="flex-1 overflow-y-auto">
          {!searchTerm.trim() ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <FaSearch className="text-white/30 text-3xl mb-3" />
              <h3 className="text-white/60 text-sm font-medium mb-2">
                Busca empleos
              </h3>
              <p className="text-white/40 text-xs mb-2">
                Escribe palabras clave para buscar empleos
              </p>
              <p className="text-white/30 text-xs">
                Ejemplo: "Buenos Aires ingeniero", "remoto desarrollador"
              </p>
              <p className="text-white/60 text-xs mt-3">
                Total de empleos disponibles: {jobs.length}
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <FaSearch className="text-white/30 text-3xl mb-3" />
              <h3 className="text-white/60 text-sm font-medium mb-2">
                Sin resultados
              </h3>
              <p className="text-white/40 text-xs">
                No se encontraron empleos que coincidan con "{searchTerm}"
              </p>
              <p className="text-white/30 text-xs mt-2">
                Intenta con otras palabras clave
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <p className="text-white/60 text-xs mb-3">
                {filteredJobs.length} resultado{filteredJobs.length !== 1 ? 's' : ''} para "{searchTerm}"
              </p>
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleJobSelect(job)}
                  className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                      <JobImage
                        job={job}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">
                      {job.title}
                    </h3>
                    <p className="text-white/60 text-xs truncate">
                      {job.company}
                    </p>
                    <p className="text-white/40 text-xs truncate">
                      {job.city || job.direction}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[#FBB581] text-xs font-medium">
                      ${job.salary?.toLocaleString() || 'No especificado'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para mostrar detalles del job */}
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

export default SearchScreen;
