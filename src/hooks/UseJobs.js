import { useState, useEffect, useRef } from 'react';
import { jobsService } from '../firebase/services';
import { useAuth } from '../contexts/AuthContext';

export const useJobs = (filters = {}) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Limpiar suscripción anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Nueva suscripción
    unsubscribeRef.current = jobsService.subscribeToJobs(
      (jobsData) => {
        console.log('🔄 UseJobs - Datos recibidos del servicio:', jobsData);

        // Log detallado de ubicaciones
        jobsData.forEach(job => {
          console.log(`📍 Job ${job.id} ubicación:`, {
            ubication: job.ubication,
            hasUbication: !!job.ubication,
            lat: job.ubication?.lat,
            lng: job.ubication?.lng,
            latType: typeof job.ubication?.lat,
            lngType: typeof job.ubication?.lng
          });
        });

        setJobs(jobsData);
        setLoading(false);
      },
      filters
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [JSON.stringify(filters)]);

  const toggleLike = async (jobId, isLiked) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para dar like');
      return false;
    }

    try {
      await jobsService.toggleLike(jobId, currentUser.uid, isLiked);
      return true;
    } catch (error) {
      console.error('Error toggling like:', error);
      setError('Error al dar like');
      return false;
    }
  };

  const toggleSave = async (jobId, isSaved) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para guardar empleos');
      return false;
    }

    try {
      await jobsService.toggleSave(jobId, currentUser.uid, isSaved);
      return true;
    } catch (error) {
      console.error('Error toggling save:', error);
      setError('Error al guardar empleo');
      return false;
    }
  };

  const applyToJob = async (jobId, applicationData = {}) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para aplicar');
      return false;
    }

    try {
      await jobsService.applyToJob(jobId, currentUser.uid, applicationData);
      return true;
    } catch (error) {
      console.error('Error applying to job:', error);
      setError(error.message || 'Error al aplicar al empleo');
      return false;
    }
  };

  const incrementViews = async (jobId) => {
    try {
      await jobsService.incrementViews(jobId);
    } catch (error) {
      // Las vistas no son críticas, no mostrar error al usuario
      console.error('Error incrementing views:', error);
    }
  };

  return {
    jobs,
    loading,
    error,
    toggleLike,
    toggleSave,
    applyToJob,
    incrementViews,
    clearError: () => setError(null)
  };
};