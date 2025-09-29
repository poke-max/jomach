import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { messagesService } from '../firebase/services';

// Función para solicitar permisos de notificación
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Las notificaciones están bloqueadas por el usuario');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('🔔 Permiso de notificación:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('Error al solicitar permisos de notificación:', error);
    return false;
  }
};

// Función para mostrar notificación
const showNotification = (title, body, icon = '/icons/icon-192x192.png') => {
  console.log('🔔 Intentando mostrar notificación:', { title, body });

  if (!('Notification' in window)) {
    console.warn('🔔 Este navegador no soporta notificaciones');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('🔔 Permisos de notificación no concedidos:', Notification.permission);
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon,
      badge: '/icons/icon-192x192.png',
      tag: 'jomatch-message-' + Date.now(), // Evita que se reemplacen
      requireInteraction: false,
      silent: false,
      timestamp: Date.now()
    });

    console.log('✅ Notificación creada exitosamente');

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      notification.close();
    }, 5000);

  } catch (error) {
    console.error('❌ Error creando notificación:', error);
  }
};

export const useUnreadMessages = () => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState(new Map()); // Cambiar a Map para guardar conteos
  const [userProfiles, setUserProfiles] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Solicitar permisos de notificación al montar
  useEffect(() => {
    const initNotifications = async () => {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
    };
    initNotifications();
  }, []);

  // Escuchar eventos de conversaciones marcadas como leídas
  useEffect(() => {
    const handleConversationMarkedAsRead = (event) => {
      const { conversationId } = event.detail;
      console.log('🔄 Conversación marcada como leída, reseteando contador:', conversationId);

      // Actualizar inmediatamente el estado local
      setUnreadConversations(prev => {
        const newMap = new Map(prev);
        newMap.delete(conversationId); // Eliminar esta conversación de no leídas

        // Recalcular total
        const newTotal = Array.from(newMap.values()).reduce((sum, count) => sum + count, 0);
        setUnreadCount(newTotal);

        console.log(`📊 Contador actualizado: conversación ${conversationId} → 0, total: ${newTotal}`);
        return newMap;
      });
    };

    window.addEventListener('conversationMarkedAsRead', handleConversationMarkedAsRead);

    return () => {
      window.removeEventListener('conversationMarkedAsRead', handleConversationMarkedAsRead);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      setUnreadConversations(new Map());
      setUserProfiles({});
      return;
    }

    let messageUnsubscribes = [];
    const conversationUnreadCounts = new Map();
    let previousMessageCounts = new Map(); // Para detectar nuevos mensajes

    // Suscribirse a conversaciones del usuario
    const unsubscribe = messagesService.subscribeToUserConversations(
      currentUser.uid,
      async (conversations) => {
        // Limpiar suscripciones anteriores
        messageUnsubscribes.forEach(unsub => unsub());
        messageUnsubscribes = [];

        // Cargar perfiles de usuarios
        const profiles = {};
        for (const conversation of conversations) {
          const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
          if (otherUserId && !profiles[otherUserId]) {
            try {
              const profile = await messagesService.getUserProfile(otherUserId);
              if (profile) profiles[otherUserId] = profile;
            } catch (error) {
              console.error('Error loading user profile:', error);
            }
          }
        }
        setUserProfiles(profiles);

        // Para cada conversación, verificar mensajes no leídos
        conversations.forEach(conversation => {
          const unsubscribeMessages = messagesService.subscribeToMessages(
            conversation.id,
            (messages) => {
              const unreadMessages = messages.filter(message =>
                message.senderId !== currentUser.uid &&
                !message.readBy?.includes(currentUser.uid)
              );

              const unreadCount = unreadMessages.length;
              const previousCount = previousMessageCounts.get(conversation.id) || 0;

              // Log para debug
              if (unreadCount !== previousCount) {
                console.log(`📊 Conversación ${conversation.id}: ${previousCount} → ${unreadCount} mensajes no leídos`);
              }

              // Detectar nuevos mensajes para notificaciones
              if (notificationsEnabled && unreadMessages.length > 0) {
                // Verificar si hay mensajes realmente nuevos (recién llegados)
                const now = Date.now();
                const recentMessages = unreadMessages.filter(message => {
                  const messageTime = message.sentAt?.toDate?.()?.getTime() || message.sentAt;
                  return messageTime && (now - messageTime) < 5000; // Mensajes de los últimos 5 segundos
                });

                if (recentMessages.length > 0 && unreadCount > previousCount) {
                  console.log(`🔔 Mostrando ${recentMessages.length} notificaciones nuevas`);

                  recentMessages.forEach(message => {
                    const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
                    const senderProfile = profiles[otherUserId];
                    const senderName = senderProfile?.displayName || 'Usuario';

                    let messageText = '';
                    if (message.type === 'text' || !message.type) {
                      messageText = message.content;
                    } else if (message.type === 'image') {
                      messageText = '📷 Imagen';
                    } else if (message.type === 'file') {
                      messageText = '📎 Archivo';
                    }

                    console.log(`🔔 Enviando notificación: ${senderName} - ${messageText}`);
                    showNotification(
                      `Nuevo mensaje de ${senderName}`,
                      messageText
                    );
                  });
                }
              }

              previousMessageCounts.set(conversation.id, unreadCount);

              if (unreadCount > 0) {
                conversationUnreadCounts.set(conversation.id, unreadCount);
              } else {
                conversationUnreadCounts.delete(conversation.id);
              }

              // Recalcular totales
              const totalUnread = Array.from(conversationUnreadCounts.values()).reduce((sum, count) => sum + count, 0);
              const previousTotal = unreadCount;

              if (totalUnread !== previousTotal) {
                console.log(`🔔 Total mensajes no leídos: ${totalUnread}`);
              }

              setUnreadCount(totalUnread);
              setUnreadConversations(new Map(conversationUnreadCounts));
            }
          );

          messageUnsubscribes.push(unsubscribeMessages);
        });
      }
    );

    return () => {
      unsubscribe();
      messageUnsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser, notificationsEnabled, forceUpdate]);

  return {
    unreadCount,
    unreadConversations,
    userProfiles,
    hasUnreadMessages: unreadCount > 0,
    notificationsEnabled,
    requestNotificationPermission: async () => {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      return granted;
    }
  };
};
