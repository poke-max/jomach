import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaBriefcase, FaBuilding, FaMapMarkerAlt, FaDollarSign, FaImage, FaSpinner, FaExclamationTriangle, FaEnvelope, FaPhone, FaGlobe, FaTags, FaUsers, FaFileAlt, FaCrosshairs, FaTimes, FaUser, FaClipboardList, FaMapSigns } from 'react-icons/fa';
import { jobsService } from '../firebase/services';
import { storageService } from '../firebase/storageService';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configurar iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PublishJobScreen = ({ onClose, onJobPublished, editingJob = null }) => {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    position: '',
    description: '',
    requeriments: '',
    city: '',
    direction: '',
    salary_range: '',
    type: 'Empleo',
    status: 'disponible',
    tags: '',
    email: '',
    phoneNumber: '',
    website: '',
    vacancies: ''
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (editingJob) {
      setFormData({
        title: editingJob.title || '',
        company: editingJob.company || '',
        position: editingJob.position || '',
        description: editingJob.description || '',
        requeriments: editingJob.requeriments || '',
        city: editingJob.city || '',
        direction: editingJob.direction || '',
        salary_range: editingJob.salary_range || '',
        type: editingJob.type || 'Empleo',
        status: editingJob.status || 'disponible',
        tags: editingJob.tags || '',
        email: editingJob.email || '',
        phoneNumber: editingJob.phoneNumber || '',
        website: editingJob.website || '',
        vacancies: editingJob.vacancies || ''
      });
      
      if (editingJob.ubication) {
        setSelectedLocation(editingJob.ubication);
      }
      
      if (editingJob.url) {
        setImagePreview(editingJob.url);
      }
    }
  }, [editingJob]);

  // Autocompletar campos con información del usuario
  useEffect(() => {
    if (currentUser || userProfile) {
      setFormData(prev => ({
        ...prev,
        email: prev.email || currentUser?.email || '',
        phoneNumber: prev.phoneNumber || userProfile?.phoneNumber || '',
        website: prev.website || userProfile?.website || ''
      }));
    }
  }, [currentUser, userProfile]);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error obteniendo ubicación:', error);
          // Ubicación por defecto (Asunción, Paraguay)
          setUserLocation({ lat: -25.2637, lng: -57.5759 });
        }
      );
    } else {
      setUserLocation({ lat: -25.2637, lng: -57.5759 });
    }
  }, []); // Convertir imagen a WebP
  const convertToWebP = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Mantener aspect ratio y redimensionar si es muy grande
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/webp', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede ser mayor a 5MB');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Convertir a WebP
      const webpFile = await convertToWebP(file);
      setImageFile(webpFile);
      
      // Crear preview
      const previewUrl = URL.createObjectURL(webpFile);
      setImagePreview(previewUrl);
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      setError('Error al procesar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('El título es obligatorio');
      return false;
    }
    if (!formData.company.trim()) {
      setError('La empresa es obligatoria');
      return false;
    }
    if (!formData.position.trim()) {
      setError('El puesto es obligatorio');
      return false;
    }
    if (!formData.description.trim()) {
      setError('La descripción es obligatoria');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      return false;
    }
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un email válido');
      return false;
    }
    // Validar website si se proporciona
    if (formData.website && formData.website.trim()) {
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlRegex.test(formData.website)) {
        setError('Por favor ingresa una URL válida o deja el campo vacío');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      let imageUrl = editingJob?.url || '';
      
      // Subir imagen si existe una nueva
      if (imageFile) {
        const fileName = `jobs/${Date.now()}_${formData.title.replace(/\s+/g, '_')}.webp`;
        imageUrl = await storageService.uploadFile(imageFile, fileName);
      }

      // Crear objeto del empleo
      const jobData = {
        ...formData,
        url: imageUrl,
        ubication: selectedLocation || null
      };

      let jobId = null;

      if (editingJob) {
        // Actualizar empleo existente
        await jobsService.updateJob(editingJob.id, jobData, currentUser.uid);
        console.log('Empleo actualizado con ID:', editingJob.id);
        jobId = editingJob.id;
      } else {
        // Crear nuevo empleo
        jobData.createdBy = currentUser.uid;
        jobData.createdAt = new Date();
        jobData.updatedAt = new Date();

        jobId = await jobsService.addJob(jobData);
        console.log('Empleo publicado con ID:', jobId);
      }

      if (onJobPublished) {
        onJobPublished(jobId);
      }
      
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error al guardar empleo:', error);
      setError(error.message || 'Error al guardar el empleo. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Componente para manejar clics en el mapa
  const LocationSelector = () => {
    useMapEvents({
      click(e) {
        setSelectedLocation({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      },
    });
    return null;
  };

  // Función para usar ubicación actual
  const useCurrentLocation = () => {
    if (userLocation) {
      setSelectedLocation(userLocation);
    }
  };

  // Función para confirmar ubicación seleccionada
  const confirmLocation = () => {
    if (selectedLocation) {
      setFormData(prev => ({
        ...prev,
        ubication: selectedLocation
      }));
      setShowLocationMap(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative flex items-center justify-center">
      <div className="fixed w-full h-full flex items-center justify-center px-3">
        <div className="relative w-full max-w-sm max-h-[95vh] overflow-y-auto">
          
          {/* Header */}
          <div className="text-center mb-4">
            <FaBriefcase className="w-12 h-12 mx-auto mb-2 text-[#FBB581]" />
            <h2 className="text-white text-lg font-semibold">
              {editingJob ? 'Editar Empleo' : 'Publicar Empleo'}
            </h2>
            <p className="text-white/60 text-xs">
              {editingJob ? 'Modifica la información del puesto' : 'Completa la información del puesto'}
            </p>
          </div>

          {/* Formulario */}
          <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-3 shadow-2xl border border-white/20">
            
            {/* Mensaje de error */}
            {error && (
              <div className="mb-3 p-2 bg-[#FF4438]/20 border border-[#FF4438]/30 rounded-md flex items-center space-x-2">
                <FaExclamationTriangle className="text-[#FF4438] text-xs flex-shrink-0" />
                <span className="text-[#FF4438] text-xs leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2">
              
              {/* Imagen */}
              <div className="space-y-1">
                <label className="text-white/70 text-xs font-medium">Imagen del empleo (opcional)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="w-full h-24 border-2 border-dashed border-white/30 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#FBB581] transition-colors"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                    ) : (
                      <>
                        <FaImage className="text-white/50 text-lg mb-1" />
                        <span className="text-white/70 text-xs text-center">Seleccionar imagen</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Título */}
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                  <FaBriefcase className="text-white/70 text-xs" />
                </div>
                <input
                  type="text"
                  name="title"
                  placeholder="Título del empleo"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                  required
                />
              </div>

              {/* Empresa */}
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                  <FaBuilding className="text-white/70 text-xs" />
                </div>
                <input
                  type="text"
                  name="company"
                  placeholder="Empresa"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                  required
                />
              </div>

              {/* Puesto */}
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                  <FaUser className="text-white/70 text-xs" />
                </div>
                <input
                  type="text"
                  name="position"
                  placeholder="Puesto"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                  required
                />
              </div>

              {/* Descripción */}
              <div className="relative">
                <div className="absolute left-2 top-3 z-10">
                  <FaFileAlt className="text-white/70 text-xs" />
                </div>
                <textarea
                  name="description"
                  placeholder="Descripción del empleo"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200 resize-none"
                  required
                />
              </div>

              {/* Requerimientos */}
              <div className="relative">
                <div className="absolute left-2 top-3 z-10">
                  <FaClipboardList className="text-white/70 text-xs" />
                </div>
                <textarea
                  name="requeriments"
                  placeholder="Requerimientos del puesto"
                  value={formData.requeriments}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200 resize-none"
                />
              </div>

              {/* Ciudad */}
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                  <FaMapMarkerAlt className="text-white/70 text-xs" />
                </div>
                <input
                  type="text"
                  name="city"
                  placeholder="Ciudad"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                />
              </div>

              {/* Dirección */}
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                  <FaMapSigns className="text-white/70 text-xs" />
                </div>
                <input
                  type="text"
                  name="direction"
                  placeholder="Dirección (calle, número, referencias)"
                  value={formData.direction}
                  onChange={handleInputChange}
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                />
              </div>

              {/* Rango Salarial */}
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                  <FaDollarSign className="text-white/70 text-xs" />
                </div>
                <input
                  type="text"
                  name="salary_range"
                  placeholder="Rango salarial (ej: 2.000.000 - 3.000.000 Gs)"
                  value={formData.salary_range}
                  onChange={handleInputChange}
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                />
              </div>

              {/* Vacantes */}
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                  <FaUsers className="text-white/70 text-xs" />
                </div>
                <input
                  type="number"
                  name="vacancies"
                  placeholder="Número de vacantes"
                  value={formData.vacancies}
                  onChange={handleInputChange}
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                />
              </div>

              {/* Tags */}
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                  <FaTags className="text-white/70 text-xs" />
                </div>
                <input
                  type="text"
                  name="tags"
                  placeholder="Tags: remoto, tiempo completo, etc."
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                  <FaEnvelope className="text-white/70 text-xs" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email de contacto"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                  required
                />
              </div>

              {/* Teléfono */}
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                  <FaPhone className="text-white/70 text-xs" />
                </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Teléfono"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                />
              </div>

              {/* Website */}
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                  <FaGlobe className="text-white/70 text-xs" />
                </div>
                <input
                  type="text"
                  name="website"
                  placeholder="Website (opcional)"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full pl-7 pr-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                />
              </div>

              {/* Ubicación en el mapa */}
              <div className="space-y-1">
                <label className="text-white/70 text-xs font-medium">Ubicación en el mapa</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLocationMap(true)}
                    className="flex-1 px-2 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-xs hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <FaMapMarkerAlt className="text-xs" />
                    {selectedLocation ? 'Ubicación seleccionada' : 'Seleccionar ubicación'}
                  </button>
                  {selectedLocation && (
                    <button
                      type="button"
                      onClick={() => setSelectedLocation(null)}
                      className="px-2 py-2 bg-[#FF4438]/20 border border-[#FF4438]/30 rounded-md text-[#FF4438] text-xs hover:bg-[#FF4438]/30 transition-all duration-200"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  )}
                </div>
                {selectedLocation && (
                  <div className="text-xs text-white/60 mt-1">
                    Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="fixed top-0 flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3 rounded-md transition-all duration-200 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-[#FBB581] to-[#673AB7] hover:from-[#FBB581] hover:to-purple-500/80 text-white font-medium py-2 px-3 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs transform hover:scale-[1.02]"
                >
                  {loading && <FaSpinner className="animate-spin mr-2 text-xs" />}
                  <span>{loading ? (editingJob ? 'Actualizando...' : 'Publicando...') : (editingJob ? 'Actualizar' : 'Publicar')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de selección de ubicación */}
      {showLocationMap && userLocation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 w-full max-w-md h-96 flex flex-col">
            {/* Header del mapa */}
            <div className="p-3 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-white font-medium text-sm">Seleccionar Ubicación</h3>
              <button
                onClick={() => setShowLocationMap(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* Mapa */}
            <div className="flex-1 relative">
              <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="rounded-b-lg"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <LocationSelector />
                
                {/* Marcador de ubicación seleccionada */}
                {selectedLocation && (
                  <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
                )}
              </MapContainer>

              {/* Botón de ubicación actual */}
              <button
                onClick={useCurrentLocation}
                className="absolute top-2 right-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md p-2 text-white hover:bg-white/20 transition-all duration-200 z-[1000]"
                title="Usar mi ubicación actual"
              >
                <FaCrosshairs className="text-sm" />
              </button>
            </div>

            {/* Footer con botones */}
            <div className="p-3 border-t border-white/20 flex gap-2">
              <button
                onClick={() => setShowLocationMap(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3 rounded-md transition-all duration-200 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLocation}
                disabled={!selectedLocation}
                className="flex-1 bg-gradient-to-r from-[#FBB581] to-[#673AB7] hover:from-[#FBB581] hover:to-purple-500/80 text-white font-medium py-2 px-3 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishJobScreen;
















