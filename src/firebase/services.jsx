
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// Servicio para empleos
export const jobsService = {
  // Obtener empleos en tiempo real
  subscribeToJobs(callback, filters = {}) {
    const jobsRef = collection(db, 'jobs');
    
    // Consulta más simple posible - obtener TODOS los documentos
    console.log('Starting jobs subscription...');
    
    return onSnapshot(jobsRef, (snapshot) => {
      console.log('Snapshot received, total docs:', snapshot.docs.length);
      console.log('Snapshot empty?', snapshot.empty);
      
      const jobs = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log('Document found:', doc.id, data);
        return data;
      });
      
      console.log('Final jobs array:', jobs);
      callback(jobs);
    }, (error) => {
      console.error('Error listening to jobs:', error);
      callback([]);
    });
  },

  // Obtener un empleo específico
  async getJob(jobId) {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const snapshot = await getDoc(jobRef);
      
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting job:', error);
      throw error;
    }
  },

  // Agregar nuevo empleo
  async addJob(jobData) {
    try {
      const jobsRef = collection(db, 'jobs');
      const docRef = await addDoc(jobsRef, {
        ...jobData,
        likes: 0,
        applications: 0,
        views: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Agregar el ID del job a las publicaciones del usuario
      const userRef = doc(db, 'users', jobData.createdBy);
      await updateDoc(userRef, {
        publishedJobs: arrayUnion(docRef.id),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  },

  // Actualizar empleo existente
  async updateJob(jobId, jobData, userId) {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        throw new Error('El empleo no existe');
      }

      // Verificar que el usuario sea el creador
      if (jobDoc.data().createdBy !== userId) {
        throw new Error('No tienes permisos para editar este empleo');
      }

      await updateDoc(jobRef, {
        ...jobData,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  // Eliminar empleo
  async deleteJob(jobId, userId) {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        throw new Error('El empleo no existe');
      }

      // Verificar que el usuario sea el creador
      if (jobDoc.data().createdBy !== userId) {
        throw new Error('No tienes permisos para eliminar este empleo');
      }

      // Eliminar el job
      await deleteDoc(jobRef);

      // Remover de las publicaciones del usuario
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        publishedJobs: arrayRemove(jobId),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  // Obtener empleos publicados por el usuario
  async getUserPublishedJobs(userId) {
    try {
      const jobsRef = collection(db, 'jobs');
      // Consulta optimizada con índice compuesto (createdBy + createdAt)
      const q = query(
        jobsRef,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user published jobs:', error);
      // Si falla por falta de índice, usar consulta simple como fallback
      try {
        const simpleQ = query(jobsRef, where('createdBy', '==', userId));
        const simpleSnapshot = await getDocs(simpleQ);
        const jobs = simpleSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Ordenar en el cliente
        return jobs.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
      } catch (fallbackError) {
        console.error('Error in fallback query:', fallbackError);
        throw fallbackError;
      }
    }
  },

  // Dar/quitar like a empleo
  async toggleLike(jobId, userId, isLiked) {
    try {
      const batch = db.batch ? db.batch() : null;
      const jobRef = doc(db, 'jobs', jobId);
      const userRef = doc(db, 'users', userId);
      
      if (isLiked) {
        // Quitar like
        await updateDoc(jobRef, {
          likes: increment(-1),
          updatedAt: serverTimestamp()
        });
        await updateDoc(userRef, {
          likedJobs: arrayRemove(jobId),
          updatedAt: serverTimestamp()
        });
      } else {
        // Agregar like
        await updateDoc(jobRef, {
          likes: increment(1),
          updatedAt: serverTimestamp()
        });
        await updateDoc(userRef, {
          likedJobs: arrayUnion(jobId),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Guardar/quitar empleo
  async toggleSave(jobId, userId, isSaved) {
    try {
      const userRef = doc(db, 'users', userId);
      
      if (isSaved) {
        await updateDoc(userRef, {
          savedJobs: arrayRemove(jobId),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(userRef, {
          savedJobs: arrayUnion(jobId),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      throw error;
    }
  },

  // Aplicar a empleo
  async applyToJob(jobId, userId, applicationData = {}) {
    try {
      // Verificar si ya aplicó
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().appliedJobs?.includes(jobId)) {
        throw new Error('Ya has aplicado a este empleo');
      }

      // Agregar aplicación
      const applicationsRef = collection(db, 'applications');
      await addDoc(applicationsRef, {
        jobId,
        userId,
        status: 'pending',
        appliedAt: serverTimestamp(),
        ...applicationData
      });

      // Actualizar contadores
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        applications: increment(1),
        updatedAt: serverTimestamp()
      });

      await updateDoc(userRef, {
        appliedJobs: arrayUnion(jobId),
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error applying to job:', error);
      throw error;
    }
  },

  // Incrementar vistas
  async incrementViews(jobId) {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        views: increment(1),
        lastViewed: serverTimestamp()
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
      // No lanzar error, las vistas no son críticas
    }
  },

  // Cambiar estado activo/inactivo del empleo
  async toggleJobStatus(jobId, userId) {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);

      if (!jobDoc.exists()) {
        throw new Error('El empleo no existe');
      }

      // Verificar que el usuario sea el creador
      if (jobDoc.data().createdBy !== userId) {
        throw new Error('No tienes permisos para cambiar el estado de este empleo');
      }

      const currentStatus = jobDoc.data().isActive;
      const newStatus = !currentStatus;

      await updateDoc(jobRef, {
        isActive: newStatus,
        updatedAt: serverTimestamp()
      });

      return newStatus;
    } catch (error) {
      console.error('Error toggling job status:', error);
      throw error;
    }
  }
};

// Servicio para usuarios
export const usersService = {
  // Crear/actualizar perfil de usuario
  async createOrUpdateUserProfile(uid, userData) {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Actualizar perfil existente
        await updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Crear nuevo perfil
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          likedJobs: [],
          savedJobs: [],
          appliedJobs: [],
          publishedJobs: [],
          isActive: true
        });
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  },

  // Obtener perfil de usuario
  async getUserProfile(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      
      if (snapshot.exists()) {
        return { uid, ...snapshot.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Suscribirse a cambios del perfil
  subscribeToUserProfile(uid, callback) {
    const userRef = doc(db, 'users', uid);
    
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ uid, ...snapshot.data() });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to user profile:', error);
      callback(null);
    });
  },

  // Obtener empleos guardados del usuario
  async getUserSavedJobs(uid) {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile?.savedJobs?.length) return [];

      // Obtener detalles de trabajos guardados
      const savedJobsPromises = userProfile.savedJobs.map(jobId =>
        jobsService.getJob(jobId)
      );
      
      const savedJobs = await Promise.all(savedJobsPromises);
      return savedJobs.filter(job => job !== null);
    } catch (error) {
      console.error('Error getting saved jobs:', error);
      throw error;
    }
  },

  // Obtener empleos publicados del usuario
  async getUserPublishedJobs(uid) {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile?.publishedJobs?.length) return [];

      // Obtener detalles de trabajos publicados
      const publishedJobsPromises = userProfile.publishedJobs.map(jobId =>
        jobsService.getJob(jobId)
      );
      
      const publishedJobs = await Promise.all(publishedJobsPromises);
      return publishedJobs.filter(job => job !== null);
    } catch (error) {
      console.error('Error getting published jobs:', error);
      throw error;
    }
  },

  // Obtener perfil público de usuario (para mostrar en otros perfiles)
  async getPublicUserProfile(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.data();
        return {
          uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          createdAt: userData.createdAt,
          publishedJobs: userData.publishedJobs || []
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting public user profile:', error);
      throw error;
    }
  }
};

// Servicio para aplicaciones
export const applicationsService = {
  // Obtener aplicaciones del usuario
  async getUserApplications(userId) {
    try {
      const applicationsRef = collection(db, 'applications');
      const q = query(
        applicationsRef,
        where('userId', '==', userId),
        orderBy('appliedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const applications = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const appData = doc.data();
          const job = await jobsService.getJob(appData.jobId);
          
          return {
            id: doc.id,
            ...appData,
            job
          };
        })
      );
      
      return applications;
    } catch (error) {
      console.error('Error getting user applications:', error);
      throw error;
    }
  }
};
