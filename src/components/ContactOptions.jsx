import React from 'react';
import { FaEnvelope, FaWhatsapp, FaGlobe } from 'react-icons/fa';

const ContactOptions = ({ 
  job, 
  isVisible, 
  onEmailContact, 
  onWhatsAppContact, 
  onWebsiteContact 
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute right-12 md:right-10 top-0 flex gap-2">
      {job.email && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEmailContact(job.email, job.position, job.company);
          }}
          className="w-10 h-10 md:w-8 md:h-8 bg-blue-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 transform hover:scale-110 shadow-xl animate-in slide-in-from-left-5 duration-300"
          title="Enviar email"
        >
          <FaEnvelope className="drop-shadow-lg text-2xl md:text-lg" />
        </button>
      )}

      {job.phoneNumber && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWhatsAppContact(job.phoneNumber, job.position, job.company);
          }}
          className="w-10 h-10 md:w-8 md:h-8 bg-[#00A888] backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 transform hover:scale-110 shadow-xl animate-in slide-in-from-left-5 duration-300 delay-75"
          title="Contactar por WhatsApp"
        >
          <FaWhatsapp className="drop-shadow-lg text-2xl md:text-lg" />
        </button>
      )}

      {job.website && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWebsiteContact(job.website);
          }}
          className="w-10 h-10 md:w-8 md:h-8 bg-blue-600/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 transform hover:scale-110 shadow-xl animate-in slide-in-from-left-5 duration-300 delay-150"
          title="Visitar sitio web"
        >
          <FaGlobe className="drop-shadow-lg text-2xl md:text-lg" />
        </button>
      )}
    </div>
  );
};

export default ContactOptions;
