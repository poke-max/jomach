import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaBriefcase, FaDollarSign, FaMapMarkerAlt, FaLocationArrow, FaSearch, FaCrosshairs } from 'react-icons/fa';
import { storageService } from '../firebase/storageService';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para centrar el mapa en una ubicación específica
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [map, center, zoom]);
  
  return null;
};

// Crear icono personalizado para los jobs
const createJobIcon = () => {
  return L.divIcon({
    className: 'custom-job-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(-45deg);
      ">
        <div style="
          color: white;
          font-size: 16px;
          transform: rotate(45deg);
        ">💼</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// Crear icono personalizado para la ubicación del usuario
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        background: #10b981;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 0 0 2px #10b981, 0 4px 12px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: -18px;
          left: -18px;
          width: 50px;
          height: 50px;
          border: 2px solid #10b981;
          border-radius: 50%;
          opacity: 0.3;
          animation: pulse 2s infinite;
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

// Crear un componente separado para la imagen
const JobImage = ({ job }) => {
  const [imageUrl, setImageUrl] = useState(job.url);

  useEffect(() => {
    const loadImage = async () => {
      if (job.url && job.url.startsWith('gs://')) {
        const downloadUrl = await storageService.convertGsUrlToDownloadUrl(job.url);
        setImageUrl(downloadUrl);
      }
    };
    
    loadImage();
  }, [job.url]);

  return (
    <img 
      src={imageUrl}
      alt={job.title}
      className="w-full h-32 object-cover rounded-lg mb-3"
    />
  );
};

const MapView = ({ jobs, onClose, selectedJobLocation = null }) => {
  const [mapCenter, setMapCenter] = useState([-34.6037, -58.3816]); // Buenos Aires por defecto
  const [mapZoom, setMapZoom] = useState(10);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const mapRef = useRef();

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      console.log('📍 Solicitando ubicación del usuario...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('✅ Ubicación del usuario obtenida:', { latitude, longitude });
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationError(null);
        },
        (error) => {
          console.log('❌ Error al obtener ubicación:', error.message);
          setLocationError(error.message);
          // Usar ubicación por defecto (Buenos Aires)
          setUserLocation({ lat: -34.6037, lng: -58.3816 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    } else {
      console.log('❌ Geolocalización no soportada');
      setLocationError('Geolocalización no soportada');
      // Usar ubicación por defecto
      setUserLocation({ lat: -34.6037, lng: -58.3816 });
    }
  }, []);

  // Función para extraer coordenadas de GeoPoint de Firestore
  const getCoordinatesFromGeoPoint = (ubication) => {
    if (!ubication) return null;

    // Manejar GeoPoint de Firestore (_lat, _long)
    if (ubication._lat !== undefined && ubication._long !== undefined) {
      return {
        lat: ubication._lat,
        lng: ubication._long
      };
    }

    // Manejar formato estándar (lat, lng)
    if (ubication.lat !== undefined && ubication.lng !== undefined) {
      return {
        lat: ubication.lat,
        lng: ubication.lng
      };
    }

    return null;
  };

  useEffect(() => {
    console.log('🗺️ MapView - Datos recibidos:');
    console.log('📍 selectedJobLocation:', selectedJobLocation);
    console.log('💼 jobs:', jobs);
    console.log('📊 Total jobs:', jobs?.length);

    // Si hay una ubicación específica seleccionada, centrar en ella
    if (selectedJobLocation) {
      console.log('🎯 Centrando mapa en ubicación específica:', selectedJobLocation);
      setMapCenter([selectedJobLocation.lat, selectedJobLocation.lng]);
      setMapZoom(15);
    } else if (jobs && jobs.length > 0) {
      // Calcular el centro basado en todos los jobs
      console.log('🔍 Analizando ubicaciones de todos los jobs...');

      const validJobs = jobs.filter(job => {
        const coords = getCoordinatesFromGeoPoint(job.ubication);
        const isValid = coords &&
                       typeof coords.lat === 'number' &&
                       typeof coords.lng === 'number';

        console.log(`📍 Job ${job.id}:`, {
          ubication: job.ubication,
          coords: coords,
          isValid: isValid
        });

        return isValid;
      });

      console.log(`✅ Jobs con ubicación válida: ${validJobs.length}/${jobs.length}`);

      if (validJobs.length > 0) {
        const avgLat = validJobs.reduce((sum, job) => {
          const coords = getCoordinatesFromGeoPoint(job.ubication);
          return sum + coords.lat;
        }, 0) / validJobs.length;

        const avgLng = validJobs.reduce((sum, job) => {
          const coords = getCoordinatesFromGeoPoint(job.ubication);
          return sum + coords.lng;
        }, 0) / validJobs.length;

        console.log('📍 Centro calculado:', { avgLat, avgLng });
        setMapCenter([avgLat, avgLng]);
        setMapZoom(12);
      } else {
        console.log('⚠️ No se encontraron jobs con ubicación válida, usando centro por defecto');
      }
    }
  }, [jobs, selectedJobLocation]);

  // Función para centrar el mapa en la ubicación del usuario
  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 15);
          }
        },
        (error) => {
          console.log('Error obteniendo ubicación:', error);
        }
      );
    }
  };

  // Función para manejar la búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    // Aquí puedes implementar la lógica de búsqueda
    console.log('Buscando:', searchTerm);
  };

  const formatSalary = (salary) => {
    if (!salary) return 'No especificado';
    return `$${salary.toLocaleString()}`;
  };

  useEffect(() => {
    const loadImages = async () => {
      if (!jobs) return;
      
      const urls = {};
      for (const job of jobs) {
        if (job.url && job.url.startsWith('gs://')) {
          urls[job.id] = await storageService.convertGsUrlToDownloadUrl(job.url);
        } else {
          urls[job.id] = job.url;
        }
      }
      setImageUrls(urls);
    };
    
    loadImages();
  }, [jobs]);

  return (
    <>
      <div className="fixed inset-0 z-10 bg-black">

        {/* Contenedor del mapa */}
        <div className="w-full h-full">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController center={mapCenter} zoom={mapZoom} />
            
            {/* Marcadores de empleos */}
            {jobs && jobs.map((job) => {
              // Si hay un job específico seleccionado, mostrar solo ese
              if (selectedJobLocation && selectedJobLocation.job && job.id !== selectedJobLocation.job.id) {
                return null;
              }

              // Verificar que la ubicación sea válida
              const coords = getCoordinatesFromGeoPoint(job.ubication);
              const hasValidCoords = coords &&
                                    typeof coords.lat === 'number' &&
                                    typeof coords.lng === 'number';

              console.log(`🏷️ Renderizando marcador para job ${job.id}:`, {
                ubication: job.ubication,
                coords: coords,
                hasValidCoords: hasValidCoords,
                isSelectedJob: selectedJobLocation?.job?.id === job.id
              });

              if (!hasValidCoords) {
                console.log(`❌ Saltando job ${job.id} - coordenadas inválidas`);
                return null;
              }

              console.log(`✅ Creando marcador para job ${job.id} en [${coords.lat}, ${coords.lng}]`);
              return (
                <Marker
                  key={job.id}
                  position={[coords.lat, coords.lng]}
                  icon={createJobIcon()}
                >
                  <Popup className="custom-popup">
                    <div className="p-3 min-w-[250px]">
                      {/* Imagen del job */}
                      {job.url && <JobImage job={job} />}
                      
                      {/* Información del job */}
                      <h3 className="font-bold text-lg mb-2 text-gray-800">{job.title}</h3>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaBriefcase className="text-[#FBB581]" />
                          <span>{job.company || 'Empresa no especificada'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <FaDollarSign className="text-[#00A888]" />
                          <span>{formatSalary(job.salary)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-[#FF4438]" />
                          <span>{job.location || 'Ubicación no especificada'}</span>
                        </div>
                      </div>
                      
                      {/* Descripción */}
                      {job.description && (
                        <p className="mt-3 text-sm text-gray-700 line-clamp-3">
                          {job.description}
                        </p>
                      )}
                      
                      {/* Botón de acción */}
                      <button className="w-full mt-3 bg-[#FBB581] hover:bg-[#FBB581] text-white py-2 px-4 rounded-lg transition-colors duration-200">
                        Ver detalles
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Marcador de ubicación del usuario */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={createUserLocationIcon()}
              >
                <Popup className="custom-popup">
                  <div className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <FaLocationArrow className="text-[#00A888]" />
                      <h3 className="font-bold text-lg text-gray-800">Mi Ubicación</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {locationError ? (
                        <span className="text-orange-600">Ubicación aproximada</span>
                      ) : (
                        'Ubicación actual'
                      )}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      Lat: {userLocation.lat.toFixed(6)}<br/>
                      Lng: {userLocation.lng.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Botón desplegable con empleos y alquileres */}
<div className="fixed bottom-20 md:bottom-8 left-3 md:left-60 z-20">
  {/* Dropdown menu - aparece arriba del botón */}
  {isDropdownOpen && (
    <div className="bg-black border border-white/10 rounded-xl p-3 text-white space-y-3 mb-2 animate-fade-in">
      <button 
        onClick={() => {
          // Lógica para mostrar empleos
          setIsDropdownOpen(false);
        }}
        className="flex items-center gap-1.5 text-sm hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors duration-200 w-max"
      >
      <div className="w-3 h-3 bg-gradient-to-r from-[#1565C0] to-[#81D4FA] rounded-full"></div>
        <span>
          {selectedJobLocation && selectedJobLocation.job ? (
            `${selectedJobLocation.job.title}`
          ) : (
            `${jobs ? jobs.filter(job => {
              const coords = getCoordinatesFromGeoPoint(job.ubication);
              return coords && typeof coords.lat === 'number' && typeof coords.lng === 'number';
            }).length : 0} empleos disponibles`
          )}
        </span>
      </button>
      
      <button 
        onClick={() => {
          // Lógica para mostrar alquileres
          setIsDropdownOpen(false);
        }}
        className="flex items-center gap-1.5 text-sm hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors duration-200 w-max"
      >
<div className="w-3 h-3 bg-gradient-to-r from-[#FF8C42] to-[#FFF275] rounded-full"></div>
        <span>245 alquileres disponibles</span>
      </button>
    </div>
  )}
  
  {/* Botón principal */}
  <button 
    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    className="bg-black border border-white/10 rounded-xl p-3 text-white transition-colors duration-200 flex items-center gap-2 w-max"
  >
    <div className="w-3 h-3 bg-gradient-to-r from-[#FBB581] to-purple-500 rounded-full"></div>
    <span className="text-sm whitespace-nowrap">Ver disponibilidad</span>
    <svg 
      className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  </button>
</div>

      {/* CSS para la animación */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>

      {/* Barra de búsqueda superior */}
{/*         <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-md px-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 pr-12 bg-white border border-gray-300 rounded-full text-gray-600 placeholder-gray-400 focus:outline-none shadow-lg"
              />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-500 text-white p-2 rounded-full"
              >
                <FaSearch className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
 */}
        {/* Botón flotante de mi ubicación */}
        <button
          onClick={centerOnUserLocation}
          className="absolute bottom-20 md:bottom-8 right-3 z-30 bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105"
        >
          <FaCrosshairs className="w-5 h-5" />
        </button>
    </>
  );
};

export default MapView;