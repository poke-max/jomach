import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaAngleDown, FaChevronDown, FaPlus, FaBriefcase, FaBuilding, FaMapMarkerAlt, FaDollarSign, FaImage, FaSpinner, FaExclamationTriangle, FaEnvelope, FaPhone, FaGlobe, FaTags, FaUsers, FaFileAlt, FaCrosshairs, FaTimes, FaUser, FaClipboardList, FaMapSigns, FaHome, FaBullhorn } from 'react-icons/fa';
import { jobsService, rentsService, adsService } from '../firebase/services';
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
  const [showAllFields, setShowAllFields] = useState(false);
  const [activeTab, setActiveTab] = useState('Empleo'); // Nueva pestaña activa
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    position: '',
    description: '',
    requeriments: '',
    city: '',
    direction: '',
    salary_range: '',
    price: '', // Para alquileres y publicidad
    type: activeTab,
    status: 'disponible',
    tags: '',
    email: '',
    phoneNumber: '',
    website: '',
    vacancies: ''
  });

  // Actualizar tipo cuando cambia la pestaña
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      type: activeTab
    }));
  }, [activeTab]);

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
        price: editingJob.price || '',
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

      // Establecer la pestaña activa según el tipo del elemento que se está editando
      if (editingJob.type) {
        setActiveTab(editingJob.type);
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

    // Validaciones específicas para empleos
    if (activeTab === 'Empleo') {
      if (!formData.company.trim()) {
        setError('La empresa es obligatoria');
        return false;
      }
      if (!formData.position.trim()) {
        setError('El puesto es obligatorio');
        return false;
      }
    }

    // Validaciones específicas para alquileres
    if (activeTab === 'Alquiler') {
      if (!formData.price.trim()) {
        setError('El precio es obligatorio para alquileres');
        return false;
      }
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
        const folderName = activeTab === 'Empleo' ? 'jobs' : activeTab === 'Alquiler' ? 'rents' : 'ads';
        const fileName = `${folderName}/${Date.now()}_${formData.title.replace(/\s+/g, '_')}.webp`;
        imageUrl = await storageService.uploadFile(imageFile, fileName);
      }

      // Crear objeto de datos
      const publicationData = {
        ...formData,
        url: imageUrl,
        ubication: selectedLocation || null
      };

      let publicationId = null;

      // Seleccionar servicio según el tipo
      const getService = () => {
        switch (activeTab) {
          case 'Alquiler':
            return rentsService;
          case 'Publicidad':
            return adsService;
          default:
            return jobsService;
        }
      };

      const service = getService();
      const typeName = activeTab === 'Empleo' ? 'empleo' : activeTab === 'Alquiler' ? 'alquiler' : 'anuncio';

      if (editingJob) {
        // Actualizar publicación existente
        if (activeTab === 'Empleo') {
          await service.updateJob(editingJob.id, publicationData, currentUser.uid);
        } else if (activeTab === 'Alquiler') {
          await service.updateRent(editingJob.id, publicationData, currentUser.uid);
        } else {
          await service.updateAd(editingJob.id, publicationData, currentUser.uid);
        }
        console.log(`${typeName} actualizado con ID:`, editingJob.id);
        publicationId = editingJob.id;
      } else {
        // Crear nueva publicación
        publicationData.createdBy = currentUser.uid;
        publicationData.createdAt = new Date();
        publicationData.updatedAt = new Date();

        if (activeTab === 'Empleo') {
          publicationId = await service.addJob(publicationData);
        } else if (activeTab === 'Alquiler') {
          publicationId = await service.addRent(publicationData);
        } else {
          publicationId = await service.addAd(publicationData);
        }
        console.log(`${typeName} publicado con ID:`, publicationId);
      }

      if (onJobPublished) {
        onJobPublished(publicationId);
      }
      
      if (onClose) {
        onClose();
      }

    } catch (error) {
      const typeName = activeTab === 'Empleo' ? 'empleo' : activeTab === 'Alquiler' ? 'alquiler' : 'anuncio';
      console.error(`Error al guardar ${typeName}:`, error);
      setError(error.message || `Error al guardar el ${typeName}. Inténtalo de nuevo.`);
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
<div className="fixed inset-0 bg-black overflow-hidden py-0 md:py-0 md:pl-50 z-[120] md:md-0 mb-20">
      <div className="h-full overflow-y-auto">
        <div className="min-h-full flex justify-center py-0 ">
          <div className="w-full ">
            
            {/* Header */}
        <div className="flex items-center justify-between p-3  border-b border-white/10">
          <div className="flex items-center gap-2 px-4">
            <FaBriefcase className="text-orange-300 text-sm" />
            <h1 className="text-white text-lg font-semibold">Publicar</h1>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

            {/* Pestañas */}
            <div className="flex border-b border-white/10">
              {['Empleo', 'Alquiler', 'Publicidad'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-orange-300 border-b-2 border-orange-300'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {tab === 'Empleo' && <FaBriefcase />}
                    {tab === 'Alquiler' && <FaHome />}
                    {tab === 'Publicidad' && <FaBullhorn />}
                    {tab}
                  </div>
                </button>
              ))}
            </div>

            {/* Formulario */}
            <div className=" shadow-2xl mb-6 py-4 p-4">
              
              {/* Mensaje de error */}
              {error && (
                <div className="mb-4 p-3 bg-[#FF4438]/20 border border-[#FF4438]/30 rounded-md flex items-center space-x-2">
                  <FaExclamationTriangle className="text-[#FF4438] text-sm flex-shrink-0" />
                  <span className="text-[#FF4438] text-sm leading-relaxed">{error}</span>
                </div>
              )}

              <form id="job-form" onSubmit={handleSubmit} className="space-y-4">
                
                {/* Imagen - Siempre visible */}
                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-medium">
                    Imagen del {activeTab === 'Empleo' ? 'empleo' : activeTab === 'Alquiler' ? 'alquiler' : 'anuncio'} (opcional)
                  </label>
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
                      className="w-full h-40 border-2 border-dashed border-white/30 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#FBB581] transition-colors"
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

                {/* Título - Siempre visible */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <FaBriefcase className="text-white/70 text-sm" />
                  </div>
                  <input
                    type="text"
                    name="title"
                    placeholder={`Título del ${activeTab === 'Empleo' ? 'empleo' : activeTab === 'Alquiler' ? 'alquiler' : 'anuncio'}`}
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                    required
                  />
                </div>

                {/* Botón desplegable */}
                <button
                  type="button"
                  onClick={() => setShowAllFields(!showAllFields)}
                  className="w-full flex items-center justify-between px-3 py-3 bg-transparent text-white text-sm transition-all duration-200"
                >
                  <span className="flex items-center gap-2">
                    {/* <FaPlus className="text-sm" /> */}
                    Información adicional
                  </span>
                  <div className={`transform transition-transform duration-200 ${showAllFields ? 'rotate-180' : ''}`}>
                    <FaAngleDown className="text-sm" />
                  </div>
                </button>

                {/* TODOS los demás campos - Ocultos por defecto */}
                {showAllFields && (
                  <div className="space-y-4">

                    {/* Empresa - Solo para empleos */}
                    {activeTab === 'Empleo' && (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                          <FaBuilding className="text-white/70 text-sm" />
                        </div>
                        <input
                          type="text"
                          name="company"
                          placeholder="Empresa"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                        />
                      </div>
                    )}

                    {/* Puesto - Solo para empleos */}
                    {activeTab === 'Empleo' && (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                          <FaUser className="text-white/70 text-sm" />
                        </div>
                        <input
                          type="text"
                          name="position"
                          placeholder="Puesto"
                          value={formData.position}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                        />
                      </div>
                    )}

                    {/* Descripción */}
                    <div className="relative">
                      <div className="absolute left-3 top-4 z-10">
                        <FaFileAlt className="text-white/70 text-sm" />
                      </div>
                      <textarea
                        name="description"
                        placeholder="Descripción del empleo"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* Requerimientos - Solo para empleos */}
                    {activeTab === 'Empleo' && (
                      <div className="relative">
                        <div className="absolute left-3 top-4 z-10">
                          <FaClipboardList className="text-white/70 text-sm" />
                        </div>
                        <textarea
                          name="requeriments"
                          placeholder="Requerimientos del puesto"
                          value={formData.requeriments}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200 resize-none"
                        />
                      </div>
                    )}

                                        {/* Ubicación en el mapa */}
                    <div className="space-y-2">
              
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowLocationMap(true)}
                          className="flex-1 px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <FaMapMarkerAlt className="text-sm" />
                          {selectedLocation ? 'Ubicación seleccionada' : 'Seleccionar ubicación'}
                        </button>
                        {selectedLocation && (
                          <button
                            type="button"
                            onClick={() => setSelectedLocation(null)}
                            className="px-3 py-3 bg-[#FF4438]/20 border border-[#FF4438]/30 rounded-md text-[#FF4438] text-sm hover:bg-[#FF4438]/30 transition-all duration-200"
                          >
                            <FaTimes className="text-sm" />
                          </button>
                        )}
                      </div>
                      {selectedLocation && (
                        <div className="text-sm text-white/60 mt-2">
                          Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                        </div>
                      )}
                    </div>

                    {/* Ciudad */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <FaMapMarkerAlt className="text-white/70 text-sm" />
                      </div>
                      <input
                        type="text"
                        name="city"
                        placeholder="Ciudad"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                      />
                    </div>

                    {/* Dirección */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <FaMapSigns className="text-white/70 text-sm" />
                      </div>
                      <input
                        type="text"
                        name="direction"
                        placeholder="Dirección (calle, número, referencias)"
                        value={formData.direction}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                      />
                    </div>

                    {/* Rango salarial - Solo para empleos */}
                    {activeTab === 'Empleo' && (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                          <FaDollarSign className="text-white/70 text-sm" />
                        </div>
                        <input
                          type="text"
                          name="salary_range"
                          placeholder="Rango salarial (ej: 2.000.000 - 3.000.000 Gs)"
                          value={formData.salary_range}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                        />
                      </div>
                    )}

                    {/* Precio - Para alquileres y publicidad */}
                    {(activeTab === 'Alquiler' || activeTab === 'Publicidad') && (
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                          <FaDollarSign className="text-white/70 text-sm" />
                        </div>
                        <input
                          type="text"
                          name="price"
                          placeholder={activeTab === 'Alquiler' ? 'Precio del alquiler (ej: 2.000.000 - 3.000.000 Gs)' : 'Precio del producto/servicio'}
                          value={formData.price}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                        />
                      </div>
                    )}

                    {/* Vacantes */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <FaUsers className="text-white/70 text-sm" />
                      </div>
                      <input
                        type="number"
                        name="vacancies"
                        placeholder="Número de vacantes"
                        value={formData.vacancies}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                      />
                    </div>

                    {/* Tags */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <FaTags className="text-white/70 text-sm" />
                      </div>
                      <input
                        type="text"
                        name="tags"
                        placeholder="Tags: remoto, tiempo completo, etc."
                        value={formData.tags}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                      />
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <FaEnvelope className="text-white/70 text-sm" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        placeholder="Email de contacto"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                      />
                    </div>

                    {/* Teléfono */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <FaPhone className="text-white/70 text-sm" />
                      </div>
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="Teléfono"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                      />
                    </div>

                    {/* Website */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <FaGlobe className="text-white/70 text-sm" />
                      </div>
                      <input
                        type="text"
                        name="website"
                        placeholder="Website (opcional)"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                      />
                    </div>

                  </div>
                )}

                {/* Botones - En el flujo normal */}
                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-md transition-all duration-200 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-[#FBB581] to-[#673AB7] hover:from-[#FBB581] hover:to-purple-500/80 text-white font-medium py-3 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm transform hover:scale-[1.02]"
                  >
                    {loading && <FaSpinner className="animate-spin mr-2 text-sm" />}
                    <span>
                      {loading
                        ? (editingJob ? 'Actualizando...' : 'Publicando...')
                        : (editingJob
                          ? 'Actualizar'
                          : `Publicar ${activeTab === 'Empleo' ? 'Empleo' : activeTab === 'Alquiler' ? 'Alquiler' : 'Anuncio'}`
                        )
                      }
                    </span>
                  </button>
                </div>
              </form>
            </div>
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
                className="absolute top-2 right-2 bg-white backdrop-blur-sm border border-white/20 rounded-md p-2 text-white hover:bg-purple-100  transition-all duration-200 z-[1000]"
                title="Usar mi ubicación actual"
              >
                <FaCrosshairs className="text-sm text-black/60" />
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
















