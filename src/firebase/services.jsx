
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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

// Servicio para empleos
export const jobsService = {
  // Obtener empleos en tiempo real
  subscribeToJobs(callback, filters = {}) {
    const jobsRef = collection(db, 'jobs');

    console.log('Starting jobs subscription...');

    return onSnapshot(jobsRef, (snapshot) => {
      console.log('Snapshot received, total docs:', snapshot.docs.length);
      console.log('Snapshot empty?', snapshot.empty);

      const jobs = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log('Document found:', doc.id, data);
        return data;
      });

      // Ordenar empleos de más reciente a más viejo
      const sortedJobs = jobs.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA; // Más reciente primero
      });

      console.log('Final sorted jobs array:', sortedJobs);
      callback(sortedJobs);
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

// Servicio para mensajes privados
export const messagesService = {
  // Crear una nueva conversación o obtener una existente
  async getOrCreateConversation(userId1, userId2) {
    try {
      // Crear ID único para la conversación (ordenar IDs para consistencia)
      const conversationId = [userId1, userId2].sort().join('_');

      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        // Crear nueva conversación
        await setDoc(conversationRef, {
          participants: [userId1, userId2],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: null,
          lastMessageAt: null
        });
      }

      return conversationId;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  },

  // Enviar mensaje
  async sendMessage(conversationId, senderId, content, type = 'text', metadata = {}) {
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messageData = {
        senderId,
        content,
        type, // 'text', 'image', 'file'
        metadata, // Para archivos: { fileName, fileSize, fileType, downloadURL }
        sentAt: serverTimestamp(),
        readBy: [senderId] // El remitente ya lo ha "leído"
      };

      const messageRef = await addDoc(messagesRef, messageData);

      // Actualizar la conversación con el último mensaje
      const conversationRef = doc(db, 'conversations', conversationId);
      const lastMessageText = type === 'text' ? content :
                             type === 'image' ? '📷 Imagen' :
                             type === 'file' ? `📄 ${metadata.fileName || 'Archivo'}` : content;

      await updateDoc(conversationRef, {
        lastMessage: lastMessageText,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Suscribirse a mensajes de una conversación
  subscribeToMessages(conversationId, callback) {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('sentAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    }, (error) => {
      console.error('Error listening to messages:', error);
      callback([]);
    });
  },

  // Obtener conversaciones del usuario
  subscribeToUserConversations(userId, callback) {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(conversations);
    }, (error) => {
      console.error('Error listening to conversations:', error);
      callback([]);
    });
  },

  // Marcar mensaje como leído
  async markMessageAsRead(conversationId, messageId, userId) {
    try {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      await updateDoc(messageRef, {
        readBy: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  // Marcar todos los mensajes de una conversación como leídos
  async markConversationAsRead(conversationId, userId) {
    try {
      console.log(`📖 Iniciando markConversationAsRead para conversación ${conversationId}, usuario ${userId}`);

      const messagesRef = collection(db, 'conversations', conversationId, 'messages');

      // Buscar solo mensajes que NO han sido leídos por este usuario
      // y que NO fueron enviados por este usuario
      const q = query(
        messagesRef,
        where('senderId', '!=', userId) // No marcar mis propios mensajes
      );

      const snapshot = await getDocs(q);
      console.log(`📖 Encontrados ${snapshot.docs.length} mensajes de otros usuarios`);

      const batch = writeBatch(db);
      let updatedCount = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const readBy = data.readBy || [];

        // Solo actualizar si el usuario no está en readBy
        if (!readBy.includes(userId)) {
          batch.update(doc.ref, {
            readBy: arrayUnion(userId)
          });
          updatedCount++;
          console.log(`📖 Marcando mensaje ${doc.id} como leído`);
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        console.log(`✅ Marcados ${updatedCount} mensajes como leídos en conversación ${conversationId}`);
      } else {
        console.log('📖 No hay mensajes nuevos para marcar como leídos');
      }
    } catch (error) {
      console.error('❌ Error marking conversation as read:', error);
      throw error;
    }
  },

  // Editar mensaje
  async editMessage(conversationId, messageId, newContent, userId) {
    try {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('El mensaje no existe');
      }

      const messageData = messageDoc.data();

      // Verificar que el usuario sea el autor del mensaje
      if (messageData.senderId !== userId) {
        throw new Error('No tienes permisos para editar este mensaje');
      }

      // Solo permitir editar mensajes de texto
      if (messageData.type !== 'text') {
        throw new Error('Solo se pueden editar mensajes de texto');
      }

      // Actualizar el mensaje
      await updateDoc(messageRef, {
        content: newContent.trim(),
        editedAt: serverTimestamp(),
        isEdited: true
      });

      // Actualizar el último mensaje de la conversación si es necesario
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data();
        // Si este es el último mensaje, actualizar la conversación
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const lastMessageQuery = query(messagesRef, orderBy('sentAt', 'desc'), limit(1));
        const lastMessageSnapshot = await getDocs(lastMessageQuery);

        if (!lastMessageSnapshot.empty) {
          const lastMessage = lastMessageSnapshot.docs[0];
          if (lastMessage.id === messageId) {
            await updateDoc(conversationRef, {
              lastMessage: newContent.trim(),
              updatedAt: serverTimestamp()
            });
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  // Eliminar mensaje
  async deleteMessage(conversationId, messageId, userId) {
    try {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('El mensaje no existe');
      }

      const messageData = messageDoc.data();

      // Verificar que el usuario sea el autor del mensaje
      if (messageData.senderId !== userId) {
        throw new Error('No tienes permisos para eliminar este mensaje');
      }

      // Eliminar el mensaje
      await deleteDoc(messageRef);

      // Actualizar el último mensaje de la conversación
      const conversationRef = doc(db, 'conversations', conversationId);
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const lastMessageQuery = query(messagesRef, orderBy('sentAt', 'desc'), limit(1));
      const lastMessageSnapshot = await getDocs(lastMessageQuery);

      if (!lastMessageSnapshot.empty) {
        const lastMessage = lastMessageSnapshot.docs[0].data();
        const lastMessageText = lastMessage.type === 'text' ? lastMessage.content :
                               lastMessage.type === 'image' ? '📷 Imagen' :
                               lastMessage.type === 'file' ? `📄 ${lastMessage.metadata?.fileName || 'Archivo'}` : lastMessage.content;

        await updateDoc(conversationRef, {
          lastMessage: lastMessageText,
          lastMessageAt: lastMessage.sentAt,
          updatedAt: serverTimestamp()
        });
      } else {
        // No hay más mensajes, limpiar el último mensaje
        await updateDoc(conversationRef, {
          lastMessage: null,
          lastMessageAt: null,
          updatedAt: serverTimestamp()
        });
      }

      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Eliminar conversación completa
  async deleteConversation(conversationId, userId) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        throw new Error('La conversación no existe');
      }

      const conversationData = conversationDoc.data();

      // Verificar que el usuario sea participante de la conversación
      if (!conversationData.participants.includes(userId)) {
        throw new Error('No tienes permisos para eliminar esta conversación');
      }

      // Eliminar todos los mensajes de la conversación
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);

      const batch = writeBatch(db);

      // Agregar eliminación de todos los mensajes al batch
      messagesSnapshot.docs.forEach(messageDoc => {
        batch.delete(messageDoc.ref);
      });

      // Agregar eliminación de la conversación al batch
      batch.delete(conversationRef);

      // Ejecutar todas las eliminaciones
      await batch.commit();

      console.log(`Conversación ${conversationId} eliminada completamente`);
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },

};

// Servicio para alquileres
export const rentsService = {
  // Obtener alquileres en tiempo real
  subscribeToRents(callback, filters = {}) {
    const rentsRef = collection(db, 'rents');

    console.log('Starting rents subscription...');

    return onSnapshot(rentsRef, (snapshot) => {
      console.log('Rents snapshot received, total docs:', snapshot.docs.length);
      console.log('Rents snapshot empty?', snapshot.empty);

      const rents = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log('Rent document found:', doc.id, data);
        return data;
      });

      // Ordenar alquileres de más reciente a más viejo
      const sortedRents = rents.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA; // Más reciente primero
      });

      console.log('Final sorted rents array:', sortedRents);
      callback(sortedRents);
    }, (error) => {
      console.error('Error listening to rents:', error);
      callback([]);
    });
  },

  // Obtener alquiler por ID
  async getRentById(rentId) {
    try {
      const rentRef = doc(db, 'rents', rentId);
      const rentDoc = await getDoc(rentRef);

      if (rentDoc.exists()) {
        return { id: rentDoc.id, ...rentDoc.data() };
      } else {
        throw new Error('El alquiler no existe');
      }
    } catch (error) {
      console.error('Error getting rent:', error);
      throw error;
    }
  },

  // Agregar nuevo alquiler
  async addRent(rentData) {
    try {
      const rentsRef = collection(db, 'rents');
      const docRef = await addDoc(rentsRef, {
        ...rentData,
        likes: 0,
        views: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Agregar el ID del alquiler a las publicaciones del usuario
      const userRef = doc(db, 'users', rentData.createdBy);
      await updateDoc(userRef, {
        publishedRents: arrayUnion(docRef.id),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding rent:', error);
      throw error;
    }
  },

  // Actualizar alquiler existente
  async updateRent(rentId, rentData, userId) {
    try {
      const rentRef = doc(db, 'rents', rentId);
      const rentDoc = await getDoc(rentRef);

      if (!rentDoc.exists()) {
        throw new Error('El alquiler no existe');
      }

      // Verificar que el usuario sea el creador
      if (rentDoc.data().createdBy !== userId) {
        throw new Error('No tienes permisos para editar este alquiler');
      }

      await updateDoc(rentRef, {
        ...rentData,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating rent:', error);
      throw error;
    }
  },

  // Eliminar alquiler
  async deleteRent(rentId, userId) {
    try {
      const rentRef = doc(db, 'rents', rentId);
      const rentDoc = await getDoc(rentRef);

      if (!rentDoc.exists()) {
        throw new Error('El alquiler no existe');
      }

      // Verificar que el usuario sea el creador
      if (rentDoc.data().createdBy !== userId) {
        throw new Error('No tienes permisos para eliminar este alquiler');
      }

      await deleteDoc(rentRef);

      // Remover el ID del alquiler de las publicaciones del usuario
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        publishedRents: arrayRemove(rentId),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error deleting rent:', error);
      throw error;
    }
  },

  // Dar like a alquiler
  async likeRent(rentId, userId) {
    try {
      const rentRef = doc(db, 'rents', rentId);
      const userRef = doc(db, 'users', userId);

      await updateDoc(rentRef, {
        likes: increment(1),
        updatedAt: serverTimestamp()
      });

      await updateDoc(userRef, {
        likedRents: arrayUnion(rentId),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error liking rent:', error);
      throw error;
    }
  },

  // Quitar like a alquiler
  async unlikeRent(rentId, userId) {
    try {
      const rentRef = doc(db, 'rents', rentId);
      const userRef = doc(db, 'users', userId);

      await updateDoc(rentRef, {
        likes: increment(-1),
        updatedAt: serverTimestamp()
      });

      await updateDoc(userRef, {
        likedRents: arrayRemove(rentId),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error unliking rent:', error);
      throw error;
    }
  },

  // Cambiar estado activo/inactivo del alquiler
  async toggleRentStatus(rentId, userId) {
    try {
      const rentRef = doc(db, 'rents', rentId);
      const rentDoc = await getDoc(rentRef);

      if (!rentDoc.exists()) {
        throw new Error('El alquiler no existe');
      }

      // Verificar que el usuario sea el creador
      if (rentDoc.data().createdBy !== userId) {
        throw new Error('No tienes permisos para cambiar el estado de este alquiler');
      }

      const currentStatus = rentDoc.data().isActive;
      const newStatus = !currentStatus;

      await updateDoc(rentRef, {
        isActive: newStatus,
        updatedAt: serverTimestamp()
      });

      return newStatus;
    } catch (error) {
      console.error('Error toggling rent status:', error);
      throw error;
    }
  }
};

// Servicio para publicidad
export const adsService = {
  // Obtener anuncios en tiempo real
  subscribeToAds(callback, filters = {}) {
    const adsRef = collection(db, 'ads');

    console.log('Starting ads subscription...');

    return onSnapshot(adsRef, (snapshot) => {
      console.log('Ads snapshot received, total docs:', snapshot.docs.length);
      console.log('Ads snapshot empty?', snapshot.empty);

      const ads = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log('Ad document found:', doc.id, data);
        return data;
      });

      // Ordenar anuncios de más reciente a más viejo
      const sortedAds = ads.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA; // Más reciente primero
      });

      console.log('Final sorted ads array:', sortedAds);
      callback(sortedAds);
    }, (error) => {
      console.error('Error listening to ads:', error);
      callback([]);
    });
  },

  // Obtener anuncio por ID
  async getAdById(adId) {
    try {
      const adRef = doc(db, 'ads', adId);
      const adDoc = await getDoc(adRef);

      if (adDoc.exists()) {
        return { id: adDoc.id, ...adDoc.data() };
      } else {
        throw new Error('El anuncio no existe');
      }
    } catch (error) {
      console.error('Error getting ad:', error);
      throw error;
    }
  },

  // Agregar nuevo anuncio
  async addAd(adData) {
    try {
      const adsRef = collection(db, 'ads');
      const docRef = await addDoc(adsRef, {
        ...adData,
        likes: 0,
        views: 0,
        clicks: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Agregar el ID del anuncio a las publicaciones del usuario
      const userRef = doc(db, 'users', adData.createdBy);
      await updateDoc(userRef, {
        publishedAds: arrayUnion(docRef.id),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding ad:', error);
      throw error;
    }
  },

  // Actualizar anuncio existente
  async updateAd(adId, adData, userId) {
    try {
      const adRef = doc(db, 'ads', adId);
      const adDoc = await getDoc(adRef);

      if (!adDoc.exists()) {
        throw new Error('El anuncio no existe');
      }

      // Verificar que el usuario sea el creador
      if (adDoc.data().createdBy !== userId) {
        throw new Error('No tienes permisos para editar este anuncio');
      }

      await updateDoc(adRef, {
        ...adData,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating ad:', error);
      throw error;
    }
  },

  // Eliminar anuncio
  async deleteAd(adId, userId) {
    try {
      const adRef = doc(db, 'ads', adId);
      const adDoc = await getDoc(adRef);

      if (!adDoc.exists()) {
        throw new Error('El anuncio no existe');
      }

      // Verificar que el usuario sea el creador
      if (adDoc.data().createdBy !== userId) {
        throw new Error('No tienes permisos para eliminar este anuncio');
      }

      await deleteDoc(adRef);

      // Remover el ID del anuncio de las publicaciones del usuario
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        publishedAds: arrayRemove(adId),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw error;
    }
  },

  // Dar like a anuncio
  async likeAd(adId, userId) {
    try {
      const adRef = doc(db, 'ads', adId);
      const userRef = doc(db, 'users', userId);

      await updateDoc(adRef, {
        likes: increment(1),
        updatedAt: serverTimestamp()
      });

      await updateDoc(userRef, {
        likedAds: arrayUnion(adId),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error liking ad:', error);
      throw error;
    }
  },

  // Quitar like a anuncio
  async unlikeAd(adId, userId) {
    try {
      const adRef = doc(db, 'ads', adId);
      const userRef = doc(db, 'users', userId);

      await updateDoc(adRef, {
        likes: increment(-1),
        updatedAt: serverTimestamp()
      });

      await updateDoc(userRef, {
        likedAds: arrayRemove(adId),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error unliking ad:', error);
      throw error;
    }
  },

  // Registrar click en anuncio
  async clickAd(adId) {
    try {
      const adRef = doc(db, 'ads', adId);

      await updateDoc(adRef, {
        clicks: increment(1),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error registering ad click:', error);
      throw error;
    }
  },

  // Cambiar estado activo/inactivo del anuncio
  async toggleAdStatus(adId, userId) {
    try {
      const adRef = doc(db, 'ads', adId);
      const adDoc = await getDoc(adRef);

      if (!adDoc.exists()) {
        throw new Error('El anuncio no existe');
      }

      // Verificar que el usuario sea el creador
      if (adDoc.data().createdBy !== userId) {
        throw new Error('No tienes permisos para cambiar el estado de este anuncio');
      }

      const currentStatus = adDoc.data().isActive;
      const newStatus = !currentStatus;

      await updateDoc(adRef, {
        isActive: newStatus,
        updatedAt: serverTimestamp()
      });

      return newStatus;
    } catch (error) {
      console.error('Error toggling ad status:', error);
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
          likedRents: [],
          publishedRents: [],
          likedAds: [],
          publishedAds: [],
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

  // Obtener alquileres publicados del usuario
  async getUserPublishedRents(uid) {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile?.publishedRents?.length) return [];

      // Obtener detalles de alquileres publicados
      const publishedRentsPromises = userProfile.publishedRents.map(rentId =>
        rentsService.getRentById(rentId)
      );

      const publishedRents = await Promise.all(publishedRentsPromises);
      return publishedRents.filter(rent => rent !== null);
    } catch (error) {
      console.error('Error getting published rents:', error);
      throw error;
    }
  },

  // Obtener anuncios publicados del usuario
  async getUserPublishedAds(uid) {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile?.publishedAds?.length) return [];

      // Obtener detalles de anuncios publicados
      const publishedAdsPromises = userProfile.publishedAds.map(adId =>
        adsService.getAdById(adId)
      );

      const publishedAds = await Promise.all(publishedAdsPromises);
      return publishedAds.filter(ad => ad !== null);
    } catch (error) {
      console.error('Error getting published ads:', error);
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
