import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaUser, FaComments, FaTimes, FaTrash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { messagesService, usersService } from '../firebase/services';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import UserAvatar from './UserAvatar';
import ChatScreen from './ChatScreen';
import LoadingScreen from './LoadingScreen';

const ConversationsScreen = ({ onClose, selectedChatUser }) => {
  const { currentUser } = useAuth();
  const { unreadConversations } = useUnreadMessages();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});
  const [deletingConversationId, setDeletingConversationId] = useState(null);

  // Si se pasa selectedChatUser, abrir ese chat directamente
  useEffect(() => {
    if (selectedChatUser) {
      setSelectedChat({
        recipientId: selectedChatUser.recipientId,
        recipientName: selectedChatUser.recipientName
      });
    }
  }, [selectedChatUser]);

  // Suscribirse a conversaciones del usuario
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = messagesService.subscribeToUserConversations(
      currentUser.uid,
      async (convs) => {
        setConversations(convs);
        
        // Obtener perfiles de los otros participantes
        const profiles = {};
        for (const conv of convs) {
          const otherUserId = conv.participants.find(id => id !== currentUser.uid);
          if (otherUserId && !profiles[otherUserId]) {
            try {
              const profile = await usersService.getUserProfile(otherUserId);
              profiles[otherUserId] = profile;
            } catch (error) {
              console.error('Error getting user profile:', error);
              profiles[otherUserId] = { displayName: 'Usuario', email: '' };
            }
          }
        }
        setUserProfiles(profiles);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;
    
    if (diffInHours < 1) {
      return 'Ahora';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const handleConversationClick = (conversation) => {
    const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
    const otherUserProfile = userProfiles[otherUserId];

    console.log('💬 Abriendo chat con:', otherUserProfile?.displayName || 'Usuario');
    console.log('📝 Conversación ID:', conversation.id);

    setSelectedChat({
      recipientId: otherUserId,
      recipientName: otherUserProfile?.displayName || 'Usuario'
    });
  };

  // Función para eliminar conversación completa
  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation(); // Evitar que se abra el chat

    const otherUserId = conversations.find(c => c.id === conversationId)?.participants.find(id => id !== currentUser.uid);
    const otherUserProfile = userProfiles[otherUserId];
    const userName = otherUserProfile?.displayName || 'Usuario';

    if (!window.confirm(`¿Estás seguro de que quieres eliminar toda la conversación con ${userName}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setDeletingConversationId(conversationId);
      await messagesService.deleteConversation(conversationId, currentUser.uid);
      console.log('Conversación eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Error al eliminar conversación: ' + error.message);
    } finally {
      setDeletingConversationId(null);
    }
  };

  if (selectedChat) {
    return (
      <ChatScreen
        onClose={() => setSelectedChat(null)}
        recipientId={selectedChat.recipientId}
        recipientName={selectedChat.recipientName}
      />
    );
  }

  return (
    <>
      {/* Mobile: pantalla completa */}
      <div className="md:hidden fixed inset-0 z-30 bg-black flex flex-col pb-16">
        {/* Header Mobile */}
        <div className="bg-black/95 backdrop-blur-sm border-b border-white/10 p-3 flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-white hover:text-[#FBB581] transition-colors"
          >
            <FaArrowLeft className="text-lg" />
          </button>

          <FaComments className="text-[#FBB581] text-lg" />

          <div className="flex-1">
            <h2 className="text-white font-semibold text-sm">Mensajes</h2>
          </div>
        </div>

        {/* Lista de conversaciones Mobile */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingScreen message="" />
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <FaComments className="text-white/30 text-3xl mb-3" />
              <h3 className="text-white/60 text-sm font-medium mb-2">
                No tienes conversaciones
              </h3>
              <p className="text-white/40 text-xs">
                Inicia una conversación desde el perfil de un usuario
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {conversations.map((conversation) => {
                const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
                const otherUserProfile = userProfiles[otherUserId];
                const unreadCount = unreadConversations.get(conversation.id) || 0;

                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation)}
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer border border-white/10"
                  >
                    <UserAvatar
                      user={otherUserProfile || { displayName: 'Usuario' }}
                      size="sm"
                      showName={false}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium text-sm truncate">
                          {otherUserProfile?.displayName || 'Usuario'}
                        </h3>
                        {conversation.lastMessage?.sentAt && (
                          <span className="text-white/40 text-xs">
                            {formatLastMessageTime(conversation.lastMessage.sentAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-white/60 text-xs truncate">
                          {conversation.lastMessage || 'Sin mensajes'}
                        </p>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <span className="bg-[#FBB581] text-black text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                          <button
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                            disabled={deletingConversationId === conversation.id}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors disabled:opacity-50"
                            title="Eliminar conversación"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: panel lateral */}
      <div
        className="hidden md:flex w-full fixed right-0 top-0 bottom-0 bg-black/100 backdrop-blur-sm border-l border-white/10 z-40 overflow-hidden flex-col"
        style={{
          width: 'calc(100vw - 200px)',
          /* left: '200px', */
          /* maxWidth: '1024px' */
        }}
      >
        {/* Header Desktop */}
        <div className="flex items-center justify-between p-4 px-8 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FaComments className="text-red-400 text-sm" />
            <h1 className="text-white text-lg font-semibold">Mensajes</h1>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Lista de conversaciones Desktop */}
        <div className="flex-1 overflow-y-auto px-0 py-0">
          {loading ? (
            <LoadingScreen message="Cargando conversaciones..." />
          ) : conversations.length === 0 ? (
            <div className="text-center  text-white/60 mt-16 px-4 py-50">
              <FaComments className="text-6xl mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">No tienes conversaciones</h3>
              <p className="text-sm">
                Inicia una conversación desde el perfil de un usuario
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {conversations.map((conversation) => {
                const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
                const otherUserProfile = userProfiles[otherUserId];

                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation)}
                    className="p-3 hover:bg-white/5 transition-colors cursor-pointer border-l-2 border-transparent "
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        user={otherUserProfile || { displayName: 'Usuario' }}
                        size="md"
                        showName={false}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-semibold truncate">
                            {otherUserProfile?.displayName || 'Usuario'}
                          </h3>
                          <div className="flex items-center gap-2 pr-4">
                            <span className="text-white/60 text-xs">
                              {formatLastMessageTime(conversation.lastMessageAt)}
                            </span>
                            {unreadConversations.has(conversation.id) && (
                              <div className="bg-[#FF4438] text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                                {unreadConversations.get(conversation.id)}
                              </div>
                            )}
                            <button
                              onClick={(e) => handleDeleteConversation(conversation.id, e)}
                              disabled={deletingConversationId === conversation.id}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors disabled:opacity-50"
                              title="Eliminar conversación"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </div>

                        <p className={`text-sm truncate ${
                          unreadConversations.has(conversation.id)
                            ? 'text-white font-medium'
                            : 'text-white/60'
                        }`}>
                          {conversation.lastMessage || 'Sin mensajes'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ConversationsScreen;




