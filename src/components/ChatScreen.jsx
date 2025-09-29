import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaArrowLeft, FaPaperPlane, FaUser, FaImage, FaFilePdf, FaPaperclip, FaTimes, FaDownload, FaUserTie, FaFileWord, FaFile, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { messagesService, usersService } from '../firebase/services';
import { storageService } from '../firebase/storageService';
import UserAvatar from './UserAvatar';
import LoadingScreen from './LoadingScreen';

const ChatScreen = ({ onClose, recipientId, recipientName }) => {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipientProfile, setRecipientProfile] = useState(null);
  const [error, setError] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Scroll automático al final - mejorado
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesEndRef.current) return;

    // Usar requestAnimationFrame para asegurar que el DOM se haya actualizado
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        try {
          messagesEndRef.current.scrollIntoView({
            behavior: force ? 'instant' : 'smooth',
            block: 'end'
          });
        } catch (error) {
          // Fallback si scrollIntoView falla
          console.warn('ScrollIntoView failed, using fallback:', error);
          const container = messagesEndRef.current.parentElement;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }
      }
    });
  }, []);

  // Referencia para rastrear el número anterior de mensajes
  const prevMessagesLength = useRef(0);

  // Scroll cuando cambian los mensajes
  useEffect(() => {
    if (messages.length > 0) {
      // Solo hacer scroll si hay mensajes nuevos (no en la carga inicial)
      if (messages.length > prevMessagesLength.current) {
        // Usar un timeout más largo para asegurar que el DOM se actualice completamente
        setTimeout(() => {
          scrollToBottom();
        }, 150);
      }
      prevMessagesLength.current = messages.length;
    }
  }, [messages, scrollToBottom]);

  // Scroll inicial cuando se carga el componente y hay mensajes
  useEffect(() => {
    if (!loading && messages.length > 0) {
      // Usar setTimeout más largo para asegurar que todo el contenido se haya renderizado
      setTimeout(() => {
        scrollToBottom(true); // Scroll instantáneo al cargar
      }, 500);
    }
  }, [loading, scrollToBottom]);

  // Mejorar scroll en móviles cuando aparece/desaparece el teclado virtual
  useEffect(() => {
    const handleResize = () => {
      // En móviles, cuando aparece el teclado virtual, hacer scroll al final
      if (window.innerWidth <= 768 && messages.length > 0) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    };

    const handleFocus = () => {
      // Cuando se enfoca el input de mensaje, hacer scroll al final
      if (window.innerWidth <= 768 && messages.length > 0) {
        setTimeout(() => {
          scrollToBottom();
        }, 300); // Tiempo para que aparezca el teclado
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Agregar listener al input de mensaje
    const messageInput = document.querySelector('input[placeholder="Escribe un mensaje..."]');
    if (messageInput) {
      messageInput.addEventListener('focus', handleFocus);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (messageInput) {
        messageInput.removeEventListener('focus', handleFocus);
      }
    };
  }, [messages.length, scrollToBottom]);

  // Inicializar conversación
  useEffect(() => {
    if (!currentUser || !recipientId) {
      console.log('ChatScreen: Missing currentUser or recipientId', { currentUser: !!currentUser, recipientId });
      return;
    }

    const initializeChat = async () => {
      try {
        console.log('ChatScreen: Initializing chat...', { currentUserId: currentUser.uid, recipientId });
        setLoading(true);

        // Obtener o crear conversación
        const convId = await messagesService.getOrCreateConversation(
          currentUser.uid,
          recipientId
        );
        console.log('ChatScreen: Conversation ID:', convId);
        setConversationId(convId);

        // Obtener perfil del destinatario
        const profile = await usersService.getUserProfile(recipientId);
        console.log('ChatScreen: Recipient profile:', profile);
        setRecipientProfile(profile);

      } catch (error) {
        console.error('ChatScreen: Error initializing chat:', error);
        setError('Error al inicializar el chat: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [currentUser, recipientId]);

  // Suscribirse a mensajes
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = messagesService.subscribeToMessages(
      conversationId,
      (newMessages) => {
        setMessages(newMessages);

        // Si hay mensajes nuevos no leídos, marcarlos como leídos inmediatamente
        // (esto cubre el caso de recibir mensajes mientras estoy en el chat)
        const unreadMessages = newMessages.filter(message =>
          message.senderId !== currentUser.uid &&
          !message.readBy?.includes(currentUser.uid)
        );

        if (unreadMessages.length > 0) {
          console.log(`📖 Marcando ${unreadMessages.length} mensajes nuevos como leídos automáticamente`);
          console.log('📝 Mensajes no leídos:', unreadMessages.map(m => ({ id: m.id, content: m.content })));

          messagesService.markConversationAsRead(conversationId, currentUser.uid)
            .then(() => {
              console.log('✅ Mensajes nuevos marcados como leídos exitosamente');
              // Disparar evento para actualizar contadores
              window.dispatchEvent(new CustomEvent('conversationMarkedAsRead', {
                detail: { conversationId, userId: currentUser.uid }
              }));
            })
            .catch((error) => {
              console.error('❌ Error marcando mensajes nuevos como leídos:', error);
            });
        }
      }
    );

    return unsubscribe;
  }, [conversationId, currentUser]);

  // Marcar mensajes como leídos cuando se abre el chat
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    console.log('📖 Marcando conversación como leída:', conversationId);

    // Marcar todos los mensajes de esta conversación como leídos
    messagesService.markConversationAsRead(conversationId, currentUser.uid)
      .then(() => {
        console.log('✅ Conversación marcada como leída');

        // Disparar evento personalizado para notificar al hook
        window.dispatchEvent(new CustomEvent('conversationMarkedAsRead', {
          detail: { conversationId, userId: currentUser.uid }
        }));
      })
      .catch((error) => {
        console.error('❌ Error marcando conversación como leída:', error);
      });
  }, [conversationId, currentUser]); // Solo cuando cambia la conversación

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !conversationId || sending) return;

    try {
      setSending(true);
      await messagesService.sendMessage(
        conversationId,
        currentUser.uid,
        newMessage.trim()
      );
      setNewMessage('');
      // El scroll se manejará automáticamente cuando se actualicen los mensajes
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file || !conversationId) return;

    try {
      setUploading(true);
      setShowAttachments(false);

      // Subir archivo a Firebase Storage
      const downloadURL = await storageService.uploadChatFile(file, conversationId);

      const metadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        downloadURL
      };

      // Enviar mensaje con archivo
      await messagesService.sendMessage(
        conversationId,
        currentUser.uid,
        downloadURL,
        type,
        metadata
      );

      // El scroll se manejará automáticamente cuando se actualicen los mensajes

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file, 'image');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea un archivo permitido (PDF, DOC, DOCX)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setFileError('Solo se permiten archivos PDF, DOC y DOCX');
        setTimeout(() => setFileError(''), 3000);
        // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
        e.target.value = '';
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFileError('El archivo no puede ser mayor a 10MB');
        setTimeout(() => setFileError(''), 3000);
        // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
        e.target.value = '';
        return;
      }

      setFileError('');
      handleFileUpload(file, 'file');
    }
    // Limpiar el input después de procesar
    e.target.value = '';
  };

  // Función para adjuntar CV del usuario
  const handleAttachCV = async () => {
    if (!userProfile?.cvUrl) {
      setFileError('No tienes un CV subido en tu perfil');
      setTimeout(() => setFileError(''), 3000);
      return;
    }

    try {
      setUploading(true);
      setShowAttachments(false);
      setFileError('');

      const metadata = {
        fileName: `CV - ${userProfile.displayName || 'Usuario'}.pdf`,
        fileSize: 0, // No conocemos el tamaño exacto
        fileType: 'application/pdf',
        downloadURL: userProfile.cvUrl
      };

      // Enviar mensaje con CV
      await messagesService.sendMessage(
        conversationId,
        currentUser.uid,
        userProfile.cvUrl,
        'file',
        metadata
      );

    } catch (error) {
      console.error('Error attaching CV:', error);
      setFileError('Error al adjuntar CV');
      setTimeout(() => setFileError(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  // Función para iniciar edición de mensaje
  const handleEditMessage = (message) => {
    if (message.type === 'text' && message.senderId === currentUser.uid) {
      setEditingMessageId(message.id);
      setEditingContent(message.content);
    }
  };

  // Función para guardar edición de mensaje
  const handleSaveEdit = async () => {
    if (!editingContent.trim() || !editingMessageId) return;

    try {
      await messagesService.editMessage(
        conversationId,
        editingMessageId,
        editingContent.trim(),
        currentUser.uid
      );
      setEditingMessageId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Error al editar mensaje: ' + error.message);
    }
  };

  // Función para cancelar edición
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Función para eliminar mensaje
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      return;
    }

    try {
      setDeletingMessageId(messageId);
      await messagesService.deleteMessage(conversationId, messageId, currentUser.uid);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error al eliminar mensaje: ' + error.message);
    } finally {
      setDeletingMessageId(null);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const formatDateSeparator = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffInDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Hoy';
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    if (!messages || messages.length === 0) return [];

    const groups = [];
    let currentGroup = null;

    messages.forEach((message) => {
      const messageDate = message.sentAt?.toDate ? message.sentAt.toDate() : new Date(message.sentAt);
      const messageDateString = messageDate.toDateString();

      if (!currentGroup || currentGroup.date !== messageDateString) {
        currentGroup = {
          date: messageDateString,
          dateLabel: formatDateSeparator(message.sentAt),
          messages: [message]
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="fixed top-0 right-0 bottom-0 left-0 bg-black z-50 flex items-center justify-center pl-50">
        <LoadingScreen message="Cargando chat..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={onClose}
            className="bg-[#FBB581] text-black px-4 py-2 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // Componente para renderizar un mensaje individual
  const MessageComponent = ({ message, isOwn, isMobile = false }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex items-start gap-${isMobile ? '1' : '2'} ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`max-w-[${isMobile ? '75%' : '80%'}] rounded-${isMobile ? 'xl' : '2xl'} px-${isMobile ? '3' : '4'} py-${isMobile ? '2' : '3'} ${
            isOwn
              ? 'bg-[#FBB581] text-black'
              : 'bg-white/10 text-white border border-white/10'
          }`}
        >
          {/* Contenido del mensaje según tipo */}
          {message.type === 'text' && (
            <>
{editingMessageId === message.id ? (
  <div className="space-y-2 w-full">
    <textarea
      ref={(el) => {
        if (el) {
          el.style.height = 'auto';
          el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
        }
      }}
      value={editingContent}
      onChange={(e) => {
        setEditingContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSaveEdit();
        } else if (e.key === 'Escape') {
          handleCancelEdit();
        }
      }}
      className={`w-full bg-transparent border-b border-current text-${isMobile ? 'xs' : 'sm'} focus:outline-none resize-none overflow-y-scroll message-input-no-scrollbar`}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
      rows={1}
      autoFocus
    />
    <div className={`flex gap-${isMobile ? '1' : '2'}`}>
      <button
        onClick={handleSaveEdit}
        className="p-1 hover:bg-black/20 rounded-full transition-colors"
      >
        <FaCheck className={`text-${isMobile ? 'xs' : 'sm'} text-green-500`} />
      </button>
      <button
        onClick={handleCancelEdit}
        className="p-1 hover:bg-black/20 rounded-full transition-colors"
      >
        <FaTimes className={`text-${isMobile ? 'xs' : 'sm'} text-red-500`} />
      </button>
    </div>
  </div>
) : (
  <div>
    <p className={`text-${isMobile ? 'xs' : 'sm'}`}>{message.content}</p>
    {message.isEdited && (
      <p className={`text-${isMobile ? 'xs' : 'xs'} opacity-50 italic mt-1`}>(editado)</p>
    )}
  </div>
)}
            </>
          )}

          {message.type === 'image' && (
            <div className={`space-y-${isMobile ? '1' : '2'}`}>
              <img
                src={message.content}
                alt="Imagen"
                className="max-w-full h-auto rounded-lg"
                loading="lazy"
                onLoad={() => {
                  // Scroll cuando la imagen se carga para ajustar la posición
                  setTimeout(() => scrollToBottom(), 100);
                }}
              />
              {message.metadata?.fileName && (
                <p className="text-xs opacity-75">{message.metadata.fileName}</p>
              )}
            </div>
          )}

          {message.type === 'file' && (
            <div className={`flex items-center gap-${isMobile ? '2' : '3'}`}>
              {message.metadata?.fileType === 'application/pdf' ? (
                <FaFilePdf className={`text-red-400 text-${isMobile ? 'lg' : 'xl'}`} />
              ) : message.metadata?.fileType === 'application/msword' ||
                   message.metadata?.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
                <FaFileWord className={`text-blue-500 text-${isMobile ? 'lg' : 'xl'}`} />
              ) : (
                <FaFile className={`text-gray-400 text-${isMobile ? 'lg' : 'xl'}`} />
              )}
              <div className="flex-1">
                <p className={`text-${isMobile ? 'xs' : 'sm'} font-medium`}>
                  {message.metadata?.fileName || 'Archivo'}
                </p>
                {message.metadata?.fileSize && (
                  <p className="text-xs opacity-75">
                    {(message.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              <a
                href={message.content}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-${isMobile ? '1' : '2'} hover:bg-black/20 rounded-full transition-colors`}
              >
                <FaDownload className={`text-${isMobile ? 'xs' : 'sm'}`} />
              </a>
            </div>
          )}

          <p className={`text-xs mt-${isMobile ? '1' : '2'} ${
            isOwn ? 'text-black/60' : 'text-white/60'
          }`}>
            {formatTime(message.sentAt)}
          </p>
        </div>

        {/* Botones de editar y eliminar - solo para mensajes propios */}
        {isOwn && editingMessageId !== message.id && (
          <div className="flex flex-row gap-2 md:opacity-0 group-hover:opacity-100 py-1 transition-opacity">
            {message.type === 'text' && (
              <button
                onClick={() => handleEditMessage(message)}
                className={`w-${isMobile ? '3' : '3'} h-${isMobile ? '3' : '3'} rounded-full flex items-center justify-center transition-colors`}
                title="Editar mensaje"
              >
                <FaEdit className={`text-${isMobile ? 'xs' : 'xs'} text-white/60 hover:text-white`} />
              </button>
            )}
            <button
              onClick={() => handleDeleteMessage(message.id)}
              disabled={deletingMessageId === message.id}
              className={`w-${isMobile ? '3' : '3'} h-${isMobile ? '3' : '3'} flex items-center justify-center transition-colors disabled:opacity-50`}
              title="Eliminar mensaje"
            >
              <FaTrash className={`text-${isMobile ? 'xs' : 'xs'} text-white/60 hover:text-white`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: pantalla completa */}
      <div className="md:hidden fixed inset-0 z-30 bg-black flex flex-col pb-20">
        {/* Header Mobile */}
        <div className="bg-black/95 backdrop-blur-sm border-b border-white/10 p-3 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="text-white hover:text-[#FBB581] transition-colors"
          >
            <FaArrowLeft className="text-lg" />
          </button>

          <UserAvatar
            user={recipientProfile || { displayName: recipientName }}
            size="sm"
            showName={false}
          />

          <div className="flex-1">
            <h2 className="text-white font-semibold text-sm">
              {recipientProfile?.displayName || recipientName || 'Usuario'}
            </h2>
{/*             <p className="text-white/60 text-xs">
              {recipientProfile?.isActive ? 'Activo' : 'Offline'}
            </p> */}
          </div>
        </div>

        {/* Mensajes Mobile - Área con scroll */}
        <div className="flex-1 overflow-y-auto p-3" style={{ paddingBottom: '15px' }}>
          {messages.length === 0 ? (
            <div className="text-center text-white/60 mt-6">
              <FaUser className="text-3xl mx-auto mb-2 opacity-50" />
              <p className="text-sm">Inicia la conversación</p>
            </div>
          ) : (
            groupMessagesByDate(messages).map((group) => (
              <div key={group.date} className="space-y-3">
                {/* Separador de fecha */}
                <div className="flex items-center justify-center py-2">
                  <div className="px-3 py-1">
                    <span className="text-white/70 text-xs font-medium">
                      {group.dateLabel}
                    </span>
                  </div>
                </div>

                {/* Mensajes del día */}
                <div className="space-y-3">
                  {group.messages.map((message) => {
                    const isOwn = message.senderId === currentUser.uid;
                    return (
                      <MessageComponent
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        isMobile={true}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensaje Mobile - FIJO EN LA PARTE INFERIOR */}
        <div className="bg-black/95 justify-center items-center backdrop-blur-sm border-t border-white/10 px-2 py-0 flex-shrink-0">
          {/* Opciones de archivos */}
          {showAttachments && (
            <div className="mb-0 flex gap-2 flex-wrap">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1 px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors disabled:opacity-50"
              >
                <FaFile className="text-blue-400 text-sm" />
                <span className="text-xs">Documentos</span>
              </button>

              {userProfile?.cvUrl && (
                <button
                  onClick={handleAttachCV}
                  disabled={uploading}
                  className="flex items-center gap-1 px-2 py-1.5 bg-[#FBB581]/20 hover:bg-[#FBB581]/30 rounded-md text-[#FBB581] transition-colors disabled:opacity-50"
                >
                  <FaUserTie className="text-sm" />
                  <span className="text-xs">Mi CV</span>
                </button>
              )}

              <button
                onClick={() => setShowAttachments(false)}
                className="p-1.5 text-white/60 hover:text-white transition-colors"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          )}

          {/* Error de archivo */}
          {fileError && (
            <div className="mb-2 text-center text-red-400 text-xs">
              {fileError}
            </div>
          )}

          {uploading && (
            <div className="mb-2 text-center text-white/60 text-xs">
              Subiendo archivo...
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setShowAttachments(!showAttachments)}
              disabled={uploading}
              className="p-2 text-white/60 hover:text-[#FBB581] transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <FaPaperclip className="text-sm" />
            </button>

<textarea
  ref={(el) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`; // max 120px
    }
  }}
  value={newMessage}
  onChange={(e) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Aquí tu lógica para enviar el mensaje
    }
  }}
  placeholder="Escribe un mensaje..."
  className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:border-[#FBB581]/50 transition-colors text-sm resize-none overflow-y-scroll message-input-no-scrollbar"
  style={{
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  }}
  disabled={sending || uploading}
  rows={1}
/>

            <button
              type="submit"
              disabled={!newMessage.trim() || sending || uploading}
              className="w-8 h-8 bg-[#FBB581] rounded-full flex items-center justify-center text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex-shrink-0"
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </form>

          {/* Inputs ocultos para archivos */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Desktop: panel lateral */}
      <div
        className="hidden md:flex fixed right-0 pl-0 top-0 bottom-0 bg-black z-40 overflow-hidden flex-col"
        style={{
          left: '200px',
        }}
      >
        {/* Header Desktop */}
        <div className="bg-black/95 backdrop-blur-sm border-b border-white/10 p-4 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="text-white hover:text-[#FBB581] transition-colors"
          >
            <FaArrowLeft className="text-xl" />
          </button>

          <UserAvatar
            user={recipientProfile || { displayName: recipientName }}
            size="md"
            showName={false}
          />

          <div className="flex-1">
            <h2 className="text-white font-semibold">
              {recipientProfile?.displayName || recipientName || 'Usuario'}
            </h2>
          </div>
        </div>

        {/* Mensajes Desktop - Área con scroll */}
        <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: '20px' }}>
          {messages.length === 0 ? (
            <div className="text-center text-white/60 mt-8">
              <FaUser className="text-4xl mx-auto mb-2 opacity-50" />
              <p>Inicia la conversación</p>
            </div>
          ) : (
            groupMessagesByDate(messages).map((group) => (
              <div key={group.date} className="space-y-4">
                {/* Separador de fecha */}
                <div className="flex items-center justify-center py-3">
                  <div className="">
                    <span className="text-white/70 text-sm font-medium">
                      {group.dateLabel}
                    </span>
                  </div>
                </div>

                {/* Mensajes del día */}
                <div className="space-y-4">
                  {group.messages.map((message) => {
                    const isOwn = message.senderId === currentUser.uid;
                    return (
                      <MessageComponent
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        isMobile={false}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensaje Desktop - FIJO EN LA PARTE INFERIOR */}
        <div className="bg-black/95 backdrop-blur-sm border-t border-white/10 p-4 flex-shrink-0">
          {/* Opciones de archivos */}
          {showAttachments && (
            <div className="mb-2 flex gap-2 flex-wrap">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1 px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors disabled:opacity-50"
              >
                <FaFile className="text-blue-400 text-sm" />
                <span className="text-xs">Documentos</span>
              </button>

              {userProfile?.cvUrl && (
                <button
                  onClick={handleAttachCV}
                  disabled={uploading}
                  className="flex items-center gap-1 px-2 py-1.5 bg-[#FBB581]/20 hover:bg-[#FBB581]/30 rounded-md text-[#FBB581] transition-colors disabled:opacity-50"
                >
                  <FaUserTie className="text-sm" />
                  <span className="text-xs">Adjuntar mi CV</span>
                </button>
              )}

              <button
                onClick={() => setShowAttachments(false)}
                className="p-1.5 text-white/60 hover:text-white transition-colors"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          )}

          {/* Error de archivo */}
          {fileError && (
            <div className="mb-2 text-center text-red-400 text-sm">
              {fileError}
            </div>
          )}

          {uploading && (
            <div className="mb-2 text-center text-white/60 text-sm">
              Subiendo archivo...
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setShowAttachments(!showAttachments)}
              disabled={uploading}
              className="p-2 text-white/60 hover:text-[#FBB581] transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <FaPaperclip className="text-sm" />
            </button>

<textarea
  ref={(el) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`; // max 120px
    }
  }}
  value={newMessage}
  onChange={(e) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Aquí tu lógica para enviar el mensaje
    }
  }}
  placeholder="Escribe un mensaje..."
  className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:border-[#FBB581]/50 transition-colors text-sm resize-none overflow-y-scroll message-input-no-scrollbar"
  style={{
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  }}
  disabled={sending || uploading}
  rows={1}
/>

            <button
              type="submit"
              disabled={!newMessage.trim() || sending || uploading}
              className="w-8 h-8 bg-[#FBB581] rounded-full flex items-center justify-center text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex-shrink-0"
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </form>

          {/* Inputs ocultos para archivos */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </>
  );
};

export default ChatScreen;
