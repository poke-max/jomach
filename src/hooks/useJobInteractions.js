import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { jobsService } from '../firebase/services';

export const useJobInteractions = () => {
  const { currentUser, userProfile } = useAuth();
  const [likes, setLikes] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [calls, setCalls] = useState({});
  const [showContactOptions, setShowContactOptions] = useState({});
  const [bookmarkAnimations, setBookmarkAnimations] = useState({});

  // Cargar favoritos del usuario al inicializar
  useEffect(() => {
    if (userProfile?.savedJobs) {
      const savedJobsMap = {};
      userProfile.savedJobs.forEach(jobId => {
        savedJobsMap[jobId] = true;
      });
      setBookmarks(savedJobsMap);
    }
  }, [userProfile?.savedJobs]);

  const toggleLike = (id) => {
    setLikes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleBookmark = async (id) => {
    if (!currentUser) {
      alert('Debes iniciar sesión para guardar empleos');
      return;
    }

    try {
      const isCurrentlyBookmarked = bookmarks[id];
      
      // Actualizar estado local inmediatamente para mejor UX
      setBookmarks(prev => {
        const newBookmarks = {
          ...prev,
          [id]: !prev[id]
        };
        
        // Activar animación solo cuando se marca como favorito
        if (newBookmarks[id]) {
          setBookmarkAnimations(prev => ({ ...prev, [id]: true }));
          
          // Remover la animación después de que termine
          setTimeout(() => {
            setBookmarkAnimations(prev => ({ ...prev, [id]: false }));
          }, 600);
        }
        
        return newBookmarks;
      });

      // Guardar en la base de datos
      await jobsService.toggleSave(id, currentUser.uid, isCurrentlyBookmarked);
      
    } catch (error) {
      console.error('Error al guardar/quitar favorito:', error);
      
      // Revertir el estado local si hay error
      setBookmarks(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
      
      alert('Error al guardar el empleo. Inténtalo de nuevo.');
    }
  };

  const toggleCall = (id) => {
    setCalls(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleContactOptions = (id) => {
    setShowContactOptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return {
    likes,
    bookmarks,
    calls,
    showContactOptions,
    bookmarkAnimations,
    toggleLike,
    toggleBookmark,
    toggleCall,
    toggleContactOptions
  };
};
