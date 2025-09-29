import React, { useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { FaTimes, FaSearchPlus, FaSearchMinus, FaExpand } from 'react-icons/fa';

const ImageViewer = ({ imageUrl, alt, isOpen, onClose, imgElement }) => {
  // Handle keyboard shortcuts and body overflow
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
        default:
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Si tenemos el elemento img ya cargado, usarlo directamente
  const imageSrc = imgElement?.src || imageUrl;
  
  return (
    <div 
      className="fixed inset-0 bg-black z-[9999] flex items-center justify-center"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{ touchAction: 'none' }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={10}
        wheel={{ step: 0.2 }}
        pinch={{ step: 5 }}
        doubleClick={{ step: 0.7 }}
        panning={{ velocityDisabled: false }}
        centerOnInit={true}
        limitToBounds={false}
        alignmentAnimation={{ disabled: true }}
        velocityAnimation={{ disabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform, centerView }) => (
          <>
            {/* Header with controls */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-white hover:text-[#FBB581] transition-colors"
                    title="Cerrar (Esc)"
                  >
                    <FaTimes className="text-xl" />
                    <span className="text-sm font-medium hidden sm:inline">Cerrar</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => zoomOut()}
                    className="p-2 text-white hover:text-[#FBB581] transition-colors"
                    title="Alejar (-)"
                  >
                    <FaSearchMinus className="text-lg" />
                  </button>
                  
                  <button
                    onClick={() => zoomIn()}
                    className="p-2 text-white hover:text-[#FBB581] transition-colors"
                    title="Acercar (+)"
                  >
                    <FaSearchPlus className="text-lg" />
                  </button>
                  
                  <button
                    onClick={() => {
                      resetTransform();
                      setTimeout(() => centerView(), 100);
                    }}
                    className="p-2 text-white hover:text-[#FBB581] transition-colors text-sm"
                    title="Restablecer zoom (0)"
                  >
                    1:1
                  </button>
                  
                  <button
                    onClick={() => {
                      if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen();
                      } else {
                        document.exitFullscreen();
                      }
                    }}
                    className="p-2 text-white hover:text-[#FBB581] transition-colors"
                    title="Pantalla completa (F)"
                  >
                    <FaExpand className="text-lg" />
                  </button>
                </div>
              </div>
            </div>

            {/* Image container with zoom and pan */}
            <TransformComponent
              wrapperClass="!w-full !h-full !overflow-visible"
              contentClass="!flex !items-center !justify-center !w-full !h-full"
              wrapperStyle={{
                width: '100%',
                height: '100%',
                overflow: 'visible'
              }}
            >
              <div className="flex items-center justify-center w-full h-full">
                <img
                  src={imageSrc}
                  alt={alt}
                  className="block select-none"
                  /* style={{ 
                    maxWidth: 'none',
                    maxHeight: 'none',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }} */
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
            </TransformComponent>


          </>
        )}
      </TransformWrapper>
    </div>
  );
};

export default ImageViewer;

