import React, { useState, useEffect } from 'react';
import { FaUser, FaPaperPlane, FaShare, FaMapMarkerAlt, FaEdit, FaTrash } from 'react-icons/fa';
import { FaBookmark as FaBookmarkSolid } from 'react-icons/fa';
import { FaRegBookmark } from 'react-icons/fa';
import ContactOptions from './ContactOptions';
import UserAvatar from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../firebase/services';

const JobActions = ({
  job,
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
  onShareJob
}) => {
  const { currentUser } = useAuth();
  const isOwner = currentUser && job.createdBy === currentUser.uid;
  
  // Estado para el perfil del usuario que publicó el empleo
  const [jobCreatorProfile, setJobCreatorProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Cargar perfil del usuario que publicó el empleo
  useEffect(() => {
    const loadJobCreatorProfile = async () => {
      if (job.createdBy && job.createdBy !== jobCreatorProfile?.uid) {
        setLoadingProfile(true);
        try {
          const profile = await usersService.getPublicUserProfile(job.createdBy);
          setJobCreatorProfile(profile);
        } catch (error) {
          console.error('Error loading job creator profile:', error);
          setJobCreatorProfile(null);
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    loadJobCreatorProfile();
  }, [job.createdBy, jobCreatorProfile?.uid]);

  return (


    <div className="absolute md:bottom-4 md:-right-0 right-0 px-2 bottom-18 flex flex-col gap-7 md:gap-5 md:bottom-0 items-center z-60"
>
      
      {/* Perfil del usuario que publicó */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewProfile(job.createdBy);
        }}
        className="transition-all duration-200 transform hover:scale-110 shadow-xl rounded-full overflow-hidden"
        title="Ver perfil del publicador"
      >
        {loadingProfile ? (
          <div className="w-10 h-10 md:w-8 md:h-8 bg-gradient-to-r from-[#D361A5] to-[#673AB7] rounded-full flex items-center justify-center">
            <FaUser className="text-white text-2xl md:text-lg animate-pulse" />
          </div>
        ) : jobCreatorProfile ? (
          <div className="w-10 h-10 md:w-8 md:h-8">
            <UserAvatar
              user={jobCreatorProfile}
              size="md"
              showName={false}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="w-10 h-10 md:w-8 md:h-8 bg-gradient-to-r from-[#D361A5] to-[#673AB7] rounded-full flex items-center justify-center">
            <FaUser className="text-white text-2xl md:text-lg" />
          </div>
        )}
      </button>

      {/* Editar empleo (solo si es el propietario) */}
      {isOwner && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditJob(job);
          }}
          className="w-10 h-10 md:w-8 md:h-8 bg-blue-500/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-xl"
          title="Editar empleo"
        >
          <FaEdit className="text-white text-2xl md:text-lg" />
        </button>
      )}

      {/* Eliminar empleo (solo si es el propietario) */}
      {isOwner && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteJob(job);
          }}
          className="w-10 h-10 md:w-8 md:h-8 bg-[#FF4438] backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-xl"
          title="Eliminar empleo"
        >
          <FaTrash className="text-white text-2xl md:text-lg" />
        </button>
      )}
      
      {/* Guardar empleo */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleBookmark(job.id);
        }}
        className="w-10 h-10 md:w-8 md:h-8 bg-white/5 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-xl"
      >
        
        {bookmarks[job.id] ? (
          <FaBookmarkSolid 
            className={`drop-shadow-lg text-2xl md:text-lg text-yellow-400 ${
              bookmarkAnimations[job.id] ? 'bookmark-animate' : 'bookmark-active'
            }`} 
          />
        ) : (
          <FaRegBookmark className="drop-shadow-lg text-2xl md:text-lg text-white" />
        )}
      </button>

      {/* Compartir empleo */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShareJob(job);
        }}
        className="w-10 h-10 md:w-8 md:h-8 bg-white/5 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-xl"
        title="Compartir empleo"
      >
        <FaShare className="drop-shadow-lg text-2xl md:text-lg text-white" />
      </button>


      {/* Contactar */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleContactOptions(job.id);
          }}
          className="w-10 h-10 md:w-8 md:h-8 bg-white/5 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-xl"
        >
          <FaPaperPlane className={`drop-shadow-lg text-2xl md:text-lg ${
            showContactOptions[job.id] ? 'text-[#00A888]' : 'text-white'
          }`} />
        </button>

        {/* Opciones de contacto */}
        <ContactOptions
          job={job}
          isVisible={showContactOptions[job.id]}
          onEmailContact={onEmailContact}
          onWhatsAppContact={onWhatsAppContact}
          onWebsiteContact={onWebsiteContact}
        />
      </div>

      {/* Ubicación */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenMapWithLocation(job);
        }}
        disabled={!hasValidLocation(job)}
        className={`w-10 h-10 md:w-8 md:h-8 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 transform shadow-xl ${
          hasValidLocation(job)
            ? 'bg-white/5 hover:scale-110 cursor-pointer'
            : 'bg-white/3 opacity-50 cursor-not-allowed'
        }`}
      >
        <FaMapMarkerAlt className={`drop-shadow-lg text-2xl md:text-lg ${hasValidLocation(job) ? 'text-white' : 'text-white/40'}`} />
      </button>
    </div>
  );
};

export default JobActions;
