import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaMapMarkerAlt, FaHashtag, FaUser } from 'react-icons/fa';
import JobImage from './JobImage';

const SearchScreen = ({ 
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
  onClose,
  onJobSelect
}) => {
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'name', 'city', 'tags'
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Función para normalizar texto para búsqueda (sin acentos y en minúsculas)
  const normalizeText = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Filtrar trabajos por término de búsqueda y tipo
  const filteredJobs = jobs.filter(job => {
    if (!searchTerm.trim()) return true;
    
    const normalizedSearch = normalizeText(searchTerm);
    
    // Buscar en el título/nombre
    const titleMatch = normalizeText(job.title).includes(normalizedSearch);
    const companyMatch = normalizeText(job.company).includes(normalizedSearch);
    const positionMatch = normalizeText(job.position).includes(normalizedSearch);
    
    // Buscar en ciudad
    const cityMatch = normalizeText(job.city).includes(normalizedSearch);
    
    // Buscar en tags
    let tagsMatch = false;
    if (job.tags) {
      const jobTags = processTags(job.tags);
      tagsMatch = jobTags.some(tag => normalizeText(tag).includes(normalizedSearch));
    }
    
    // Aplicar filtro según el tipo de búsqueda
    switch (searchType) {
      case 'name':
        return titleMatch || companyMatch || positionMatch;
      case 'city':
        return cityMatch;
      case 'tags':
        return tagsMatch;
      case 'all':
      default:
        return titleMatch || companyMatch || positionMatch || cityMatch || tagsMatch;
    }
  });

  // Función para manejar selección de trabajo
  const handleJobSelect = (job) => {
    if (onJobSelect) {
      onJobSelect(job);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[70] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-white text-lg font-semibold">Buscar Empleos</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>

      {/* Buscador */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 text-sm" />
          <input
            type="text"
            placeholder="Buscar empleos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:border-[#FBB581]/50 focus:bg-white/15 transition-all"
            autoFocus
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

        {/* Filtros de tipo de búsqueda */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSearchType('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              searchType === 'all'
                ? 'bg-[#FBB581] text-black'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Todo
          </button>
          <button
            onClick={() => setSearchType('name')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              searchType === 'name'
                ? 'bg-[#FBB581] text-black'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <FaUser className="text-xs" />
            Nombre
          </button>
          <button
            onClick={() => setSearchType('city')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              searchType === 'city'
                ? 'bg-[#FBB581] text-black'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <FaMapMarkerAlt className="text-xs" />
            Ciudad
          </button>
          <button
            onClick={() => setSearchType('tags')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              searchType === 'tags'
                ? 'bg-[#FBB581] text-black'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <FaHashtag className="text-xs" />
            Tags
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="flex-1 overflow-y-auto">
        {!searchTerm.trim() ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <FaSearch className="text-white/30 text-4xl mb-4" />
            <h3 className="text-white/60 text-lg font-medium mb-2">
              Busca empleos
            </h3>
            <p className="text-white/40 text-sm">
              Escribe para buscar por nombre, ciudad o tags
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <FaSearch className="text-white/30 text-4xl mb-4" />
            <h3 className="text-white/60 text-lg font-medium mb-2">
              Sin resultados
            </h3>
            <p className="text-white/40 text-sm">
              No se encontraron empleos que coincidan con tu búsqueda
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <p className="text-white/60 text-sm mb-4">
              {filteredJobs.length} resultado{filteredJobs.length !== 1 ? 's' : ''} encontrado{filteredJobs.length !== 1 ? 's' : ''}
            </p>
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobSelect(job)}
                className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden">
                    <JobImage
                      job={job}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Job Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm truncate">
                    {job.title}
                  </h3>
                  <p className="text-white/70 text-xs truncate">
                    {job.company}
                  </p>
                  {job.city && (
                    <div className="flex items-center gap-1 mt-1">
                      <FaMapMarkerAlt className="text-white/40 text-xs" />
                      <span className="text-white/60 text-xs">{job.city}</span>
                    </div>
                  )}
                  {job.tags && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {processTags(job.tags).slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 bg-[#FBB581]/20 text-[#FBB581] text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {processTags(job.tags).length > 2 && (
                        <span className="text-white/40 text-xs">
                          +{processTags(job.tags).length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bookmark indicator */}
                {bookmarks[job.id] && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-yellow-400/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchScreen;
