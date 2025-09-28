import React, { useState } from 'react';
import { FaBug, FaChevronUp, FaChevronDown } from 'react-icons/fa';

const DebugPanel = ({ currentJob, jobs }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!currentJob) return null;

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

  const coords = getCoordinatesFromGeoPoint(currentJob?.ubication);
  const hasValidLocation = coords &&
                          typeof coords.lat === 'number' &&
                          typeof coords.lng === 'number' &&
                          !isNaN(coords.lat) &&
                          !isNaN(coords.lng);

  const jobsWithLocation = jobs?.filter(job => {
    const jobCoords = getCoordinatesFromGeoPoint(job?.ubication);
    return jobCoords &&
           typeof jobCoords.lat === 'number' &&
           typeof jobCoords.lng === 'number';
  }) || [];

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden max-w-sm">
      {/* Header */}
{/*       <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-white hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FaBug />
          <span className="text-sm font-medium">Debug Info</span>
        </div>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </button> */}

      {/* Content */}
      {isOpen && (
        <div className="p-3 border-t border-white/10 text-xs text-white space-y-3">
          {/* Job actual */}
          <div>
            <h4 className="font-semibold text-[#FBB581] mb-1">Job Actual:</h4>
            <div className="space-y-1 text-white/80">
              <div>ID: {currentJob.id}</div>
              <div>Título: {currentJob.title}</div>
              <div className={`font-medium ${hasValidLocation ? 'text-[#00A888]' : 'text-[#FF4438]'}`}>
                Ubicación válida: {hasValidLocation ? 'SÍ' : 'NO'}
              </div>
            </div>
          </div>

          {/* Datos de ubicación */}
          <div>
            <h4 className="font-semibold text-purple-400 mb-1">Datos de Ubicación:</h4>
            <div className="space-y-1 text-white/80">
              <div>Tipo: {currentJob.ubication?._lat !== undefined ? 'GeoPoint' : 'Objeto estándar'}</div>
              <div>ubication: {JSON.stringify(currentJob.ubication)}</div>
              {coords ? (
                <>
                  <div>lat extraída: {coords.lat} ({typeof coords.lat})</div>
                  <div>lng extraída: {coords.lng} ({typeof coords.lng})</div>
                  <div>lat isNaN: {isNaN(coords.lat) ? 'SÍ' : 'NO'}</div>
                  <div>lng isNaN: {isNaN(coords.lng) ? 'SÍ' : 'NO'}</div>
                </>
              ) : (
                <div className="text-[#FF4438]">No se pudieron extraer coordenadas</div>
              )}
            </div>
          </div>

          {/* Estadísticas generales */}
          <div>
            <h4 className="font-semibold text-orange-400 mb-1">Estadísticas:</h4>
            <div className="space-y-1 text-white/80">
              <div>Total jobs: {jobs?.length || 0}</div>
              <div>Jobs con ubicación: {jobsWithLocation.length}</div>
              <div>Porcentaje: {jobs?.length ? Math.round((jobsWithLocation.length / jobs.length) * 100) : 0}%</div>
            </div>
          </div>

          {/* Lista de jobs con ubicación */}
          {jobsWithLocation.length > 0 && (
            <div>
              <h4 className="font-semibold text-[#00A888] mb-1">Jobs con Ubicación:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1 text-white/80">
                {jobsWithLocation.map(job => {
                  const jobCoords = getCoordinatesFromGeoPoint(job.ubication);
                  return (
                    <div key={job.id} className="text-xs">
                      {job.title}: [{jobCoords?.lat}, {jobCoords?.lng}]
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
