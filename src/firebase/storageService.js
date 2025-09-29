import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

export const storageService = {
  // Obtener URL de descarga desde una referencia de Storage
  async getImageURL(storagePath) {
    try {
      const imageRef = ref(storage, storagePath);
      const url = await getDownloadURL(imageRef);
      return url;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  },

  // Convertir gs:// URL a URL de descarga
  async convertGsUrlToDownloadUrl(gsUrl) {
    try {
      if (!gsUrl.startsWith('gs://')) {
        return gsUrl; // Ya es una URL normal
      }
      
      // Extraer el path de la URL gs://
      const path = gsUrl.replace('gs://jomach-f6258.firebasestorage.app/', '');
      return await this.getImageURL(path);
    } catch (error) {
      console.error('Error converting gs URL:', error);
      return gsUrl; // Retornar la URL original si falla
    }
  },

  // Subir archivo a Storage
  async uploadFile(file, path) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Subir archivo de chat
  async uploadChatFile(file, conversationId) {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const folder = file.type.startsWith('image/') ? 'images' : 'files';
      const path = `chats/${conversationId}/${folder}/${fileName}`;

      return await this.uploadFile(file, path);
    } catch (error) {
      console.error('Error uploading chat file:', error);
      throw error;
    }
  }
};
