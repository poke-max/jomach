import React, { useState, useEffect } from 'react';
import { FaBell, FaBellSlash, FaTimes } from 'react-icons/fa';

const NotificationPermission = ({ onRequestPermission, notificationsEnabled, show, onClose }) => {
  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = async () => {
    try {
      setRequesting(true);
      console.log('🔔 Solicitando permisos de notificación...');

      const granted = await onRequestPermission();
      console.log('🔔 Permisos concedidos:', granted);

      if (granted) {
        // Mostrar notificación de prueba
        setTimeout(() => {
          new Notification('¡Notificaciones activadas!', {
            body: 'Ahora recibirás notificaciones de nuevos mensajes',
            icon: '/icons/icon-192x192.png',
            tag: 'test-notification'
          });
        }, 500);

        onClose(true); // Cerrar con éxito
      } else {
        alert('Para recibir notificaciones, debes permitir las notificaciones en tu navegador.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Error al solicitar permisos de notificación');
    } finally {
      setRequesting(false);
    }
  };

  const handleDismiss = () => {
    onClose(false); // Cerrar sin activar
  };

  if (!show || notificationsEnabled) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <FaBell className="text-[#FBB581] text-xl mt-1 flex-shrink-0" />
        
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm mb-1">
            Activar Notificaciones
          </h3>
          <p className="text-white/70 text-xs mb-3">
            Recibe notificaciones cuando lleguen nuevos mensajes
          </p>
          
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleRequestPermission}
                disabled={requesting}
                className="bg-[#FBB581] text-black text-xs px-3 py-1.5 rounded-full font-medium hover:bg-[#FBB581]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requesting ? 'Activando...' : 'Activar'}
              </button>
              <button
                onClick={handleDismiss}
                disabled={requesting}
                className="text-white/60 text-xs px-3 py-1.5 hover:text-white transition-colors disabled:opacity-50"
              >
                Ahora no
              </button>
            </div>

            <button
              onClick={() => {
                localStorage.setItem('notifications-permanently-dismissed', 'true');
                onClose(false);
              }}
              disabled={requesting}
              className="text-white/40 text-xs hover:text-white/60 transition-colors disabled:opacity-50 underline"
            >
              No volver a mostrar
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-white/60 hover:text-white transition-colors"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default NotificationPermission;
