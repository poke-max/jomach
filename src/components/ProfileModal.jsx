import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import { FaTimes, FaEnvelope, FaCalendar, FaBriefcase, FaBookmark, FaPhone, FaSpinner, FaExclamationTriangle, FaSms, FaCheck, FaPencilAlt, FaEdit, FaTrash, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { RecaptchaVerifier, signInWithPhoneNumber, getAuth, updateProfile } from 'firebase/auth';
import { usersService, jobsService } from '../firebase/services';

// Componente de bandera de Paraguay
const ParaguayFlag = () => (
  <div className="w-4 h-3 flex flex-col">
    <div className="flex-1 bg-[#FF4438]"></div>
    <div className="flex-1 bg-white"></div>
    <div className="flex-1 bg-blue-500"></div>
  </div>
);

const ProfileModal = ({
  isOpen,
  onClose,
  defaultMessage,
  setDefaultMessage,
  userId = null, // Para ver perfil de otros usuarios
  onEditJob
}) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const isOwnProfile = !userId || userId === currentUser?.uid;
  
  // Estados para el perfil a mostrar
  const [displayProfile, setDisplayProfile] = useState(null);
  const [publishedJobs, setPublishedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Estados para edición de nombre
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Estados para teléfono
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneStep, setPhoneStep] = useState('phone');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Estados generales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar perfil y publicaciones
  useEffect(() => {
    if (isOpen) {
      if (isOwnProfile) {
        setDisplayProfile(userProfile);
        setEditedName(userProfile?.displayName || currentUser?.displayName || '');
        setPhoneNumber(userProfile?.phoneNumber || '');
      } else if (userId) {
        loadUserProfile();
      }
      loadPublishedJobs();
    }
  }, [isOpen, userId, userProfile, currentUser]);

  const loadUserProfile = async () => {
    try {
      const profile = await usersService.getPublicUserProfile(userId);
      setDisplayProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Error al cargar el perfil del usuario');
    }
  };

  const loadPublishedJobs = async () => {
    try {
      setLoadingJobs(true);
      const targetUserId = userId || currentUser?.uid;
      if (targetUserId) {
        console.log('🔍 ProfileModal - Cargando empleos publicados para usuario:', targetUserId);

        // Usar jobsService.getUserPublishedJobs que busca directamente por createdBy
        // Esto es más confiable que depender del array publishedJobs del perfil
        const jobs = await jobsService.getUserPublishedJobs(targetUserId);
        console.log('📊 ProfileModal - Empleos encontrados:', jobs.length, jobs);
        setPublishedJobs(jobs);
      }
    } catch (error) {
      console.error('Error loading published jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Función para eliminar empleo
  const handleDeleteJob = async (jobId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleo?')) {
      try {
        await jobsService.deleteJob(jobId, currentUser.uid);
        setPublishedJobs(prev => prev.filter(job => job.id !== jobId));
      } catch (error) {
        console.error('Error al eliminar empleo:', error);
        setError('Error al eliminar el empleo');
      }
    }
  };

  // Función para cambiar estado del empleo
  const handleToggleJobStatus = async (jobId) => {
    try {
      const newStatus = await jobsService.toggleJobStatus(jobId, currentUser.uid);
      setPublishedJobs(prev =>
        prev.map(job =>
          job.id === jobId
            ? { ...job, isActive: newStatus }
            : job
        )
      );
    } catch (error) {
      console.error('Error al cambiar estado del empleo:', error);
      setError('Error al cambiar el estado del empleo');
    }
  };

  // Función para formatear fecha
  const formatDate = (date) => {
    if (!date) return 'No disponible';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para obtener mensajes de error en español
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/invalid-phone-number': 'El número de teléfono no es válido',
      'auth/missing-phone-number': 'Se requiere un número de teléfono',
      'auth/quota-exceeded': 'Cuota de SMS excedida',
      'auth/invalid-verification-code': 'El código de verificación no es válido',
      'auth/invalid-verification-id': 'ID de verificación no válido',
      'auth/code-expired': 'El código de verificación ha expirado',
      'default': 'Ha ocurrido un error. Por favor, inténtalo de nuevo'
    };
    return errorMessages[errorCode] || errorMessages['default'];
  };

  const validatePhoneNumber = (phone) => {
    // Validación para número paraguayo (9 dígitos después del código de país)
    const phoneRegex = /^[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  // Función para guardar el nombre editado
  const handleSaveName = async () => {
    if (!editedName.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Actualizar en Firebase Auth
      if (currentUser) {
        await updateProfile(currentUser, { displayName: editedName.trim() });
      }

      // Actualizar en Firestore
      await updateUserProfile({ displayName: editedName.trim() });

      setIsEditingName(false);
    } catch (error) {
      console.error('Error al actualizar nombre:', error);
      setError('Error al actualizar el nombre');
    } finally {
      setLoading(false);
    }
  };

  // Función para resetear edición de teléfono
  const resetPhoneEdit = () => {
    setIsEditingPhone(false);
    setPhoneStep('phone');
    setPhoneNumber(userProfile?.phoneNumber || '');
    setVerificationCode('');
    setConfirmationResult(null);
    setError('');

    // Limpiar reCAPTCHA
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  };

  // Función para configurar reCAPTCHA
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(getAuth(), 'recaptcha-container-profile', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA resuelto');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expirado');
          setError('reCAPTCHA expirado. Inténtalo de nuevo.');
        }
      });
    }
  };

  // Función para verificar teléfono
  const handlePhoneVerification = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('El número de teléfono debe tener 9 dígitos');
      return;
    }

    setupRecaptcha();

    try {
      setLoading(true);
      setError('');

      const auth = getAuth();
      const appVerifier = window.recaptchaVerifier;
      const fullPhoneNumber = `+595${phoneNumber}`;

      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      setConfirmationResult(result);
      setPhoneStep('verification');
    } catch (error) {
      console.error('Error al enviar SMS:', error);
      setError(getErrorMessage(error.code));

      // Resetear reCAPTCHA en caso de error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar código SMS
  const handleVerifyPhoneCode = async () => {
    if (!verificationCode.trim()) {
      setError('El código de verificación es obligatorio');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await confirmationResult.confirm(verificationCode);

      // Guardar número de teléfono en el perfil
      await updateUserProfile({ phoneNumber: phoneNumber });

      // Reset phone editing state
      setIsEditingPhone(false);
      setPhoneStep('phone');
      setVerificationCode('');
      setConfirmationResult(null);

    } catch (error) {
      console.error('Error al verificar código:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const profile = displayProfile || userProfile;
  const displayName = profile?.displayName || currentUser?.displayName || 'Usuario';
  const email = isOwnProfile ? currentUser?.email || '' : profile?.email || '';
  const photoURL = profile?.photoURL || currentUser?.photoURL;
  const createdAt = profile?.createdAt?.toDate?.() || currentUser?.metadata?.creationTime;
  const appliedJobs = isOwnProfile ? (userProfile?.appliedJobs?.length || 0) : 0;
  const savedJobs = isOwnProfile ? (userProfile?.savedJobs?.length || 0) : 0;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[90] overflow-hidden flex items-center justify-center">
      <div className="fixed w-full h-full flex items-center justify-center px-3">
        <div className="relative w-full max-w-sm max-h-[95vh] overflow-y-auto">
          
          {/* Header */}
          <div className="text-center mb-4">
            <div className="mb-3">
              <UserAvatar
                user={{ ...currentUser, ...profile }}
                size="xl"
                showName={false}
                className="justify-center"
              />
            </div>
            <h2 className="text-white text-lg font-semibold">
              {isOwnProfile ? 'Mi Perfil' : `Perfil de ${displayName}`}
            </h2>
            <p className="text-white/60 text-xs">
              {isOwnProfile ? 'Gestiona tu información personal' : 'Información del usuario'}
            </p>
          </div>

          {/* Contenido */}
          <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-3 shadow-2xl border border-white/20">
            
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 z-10"
            >
              <FaTimes className="text-sm" />
            </button>

            {/* Mensaje de error */}
            {error && (
              <div className="mb-3 p-2 bg-[#FF4438]/20 border border-[#FF4438]/30 rounded-md flex items-center space-x-2">
                <FaExclamationTriangle className="text-[#FF4438] text-xs flex-shrink-0" />
                <span className="text-[#FF4438] text-xs leading-relaxed">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Información básica */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-white border-b border-white/10 pb-1.5">
                  Información personal
                </h3>

                <div className="space-y-2">
                  {/* Nombre con edición (solo perfil propio) */}
                  <div className="flex items-center gap-2.5 p-2.5 bg-white/5 rounded-lg">
                    <FaUser className="text-[#FBB581] text-sm" />
                    <div className="flex-1">
                      <p className="text-white/60 text-xs">Nombre</p>
                      {isOwnProfile && isEditingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs flex-1 focus:outline-none focus:border-[#FBB581]/50"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveName}
                            disabled={loading}
                            className="p-1 text-[#00A888] hover:text-[#00A888] transition-colors"
                          >
                            {loading ? <FaSpinner className="animate-spin text-xs" /> : <FaCheck className="text-xs" />}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingName(false);
                              setEditedName(displayName);
                              setError('');
                            }}
                            className="p-1 text-[#FF4438] hover:text-[#FF4438] transition-colors"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-white text-xs">{displayName}</p>
                          {isOwnProfile && (
                            <button
                              onClick={() => setIsEditingName(true)}
                              className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                            >
                              <FaPencilAlt className="text-xs" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isOwnProfile && (
                    <>
                      <div className="flex items-center gap-2.5 p-2.5 bg-white/5 rounded-lg">
                        <FaEnvelope className="text-blue-400 text-sm" />
                        <div>
                          <p className="text-white/60 text-xs">Email</p>
                          <p className="text-white text-xs">{email}</p>
                        </div>
                      </div>

                      {/* Teléfono con edición */}
                      <div className="p-2.5 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2.5">
                          <FaPhone className="text-[#00A888] text-sm" />
                          <div className="flex-1">
                            <p className="text-white/60 text-xs">Teléfono</p>
                            {!isEditingPhone ? (
                              <div className="flex items-center gap-2">
                                <p className="text-white text-xs">
                                  {userProfile?.phoneNumber ? `+595${userProfile.phoneNumber}` : 'No configurado'}
                                </p>
                                <button
                                  onClick={() => setIsEditingPhone(true)}
                                  className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                                >
                                  <FaPencilAlt className="text-xs" />
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2 space-y-3">
                                {phoneStep === 'phone' && (
                                  <>
                                    <div className="relative">
                                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 flex items-center space-x-2">
                                        <ParaguayFlag />
                                        <span className="text-white text-xs font-medium">+595</span>
                                        <div className="w-px h-3 bg-white/30"></div>
                                      </div>
                                      <input
                                        type="tel"
                                        placeholder="987654321"
                                        value={phoneNumber}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                                          setPhoneNumber(value);
                                          if (error) setError('');
                                        }}
                                        className="w-full pl-16 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:border-[#FBB581]/50"
                                        maxLength="9"
                                      />
                                    </div>

                                    <div id="recaptcha-container-profile" className="flex justify-center"></div>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={resetPhoneEdit}
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg text-xs transition-all duration-200"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={handlePhoneVerification}
                                        disabled={loading || phoneNumber.length !== 9}
                                        className="flex-1 bg-gradient-to-r from-[#FBB581] to-[#673AB7] hover:from-[#FBB581] hover:to-purple-500/80 text-white py-2 px-3 rounded-lg text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                      >
                                        {loading && <FaSpinner className="animate-spin mr-1 text-xs" />}
                                        <FaSms className="mr-1 text-xs" />
                                        <span>{loading ? 'Enviando...' : 'Enviar SMS'}</span>
                                      </button>
                                    </div>
                                  </>
                                )}

                                {phoneStep === 'verification' && (
                                  <>
                                    <div className="text-center">
                                      <FaSms className="mx-auto text-[#FBB581] text-lg mb-1" />
                                      <p className="text-white text-xs font-medium">Código enviado</p>
                                      <p className="text-white/70 text-xs">
                                        Revisa tu teléfono (+595{phoneNumber})
                                      </p>
                                    </div>

                                    <input
                                      type="text"
                                      placeholder="123456"
                                      value={verificationCode}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setVerificationCode(value);
                                        if (error) setError('');
                                      }}
                                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center text-sm tracking-widest focus:outline-none focus:border-[#FBB581]/50"
                                      maxLength="6"
                                    />

                                    <div className="flex gap-2">
                                      <button
                                        onClick={resetPhoneEdit}
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg text-xs transition-all duration-200"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={handleVerifyPhoneCode}
                                        disabled={loading || verificationCode.length !== 6}
                                        className="flex-1 bg-gradient-to-r from-[#FBB581] to-[#673AB7] hover:from-[#FBB581] hover:to-purple-500/80 text-white py-2 px-3 rounded-lg text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                      >
                                        {loading && <FaSpinner className="animate-spin mr-1 text-xs" />}
                                        <span>{loading ? 'Verificando...' : 'Verificar'}</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2.5 p-2.5 bg-white/5 rounded-lg">
                    <FaCalendar className="text-purple-400 text-sm" />
                    <div>
                      <p className="text-white/60 text-xs">Miembro desde</p>
                      <p className="text-white text-xs">{formatDate(createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas (solo perfil propio) */}
              {isOwnProfile && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-white border-b border-white/10 pb-1.5">
                    Actividad
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-white/5 rounded-lg text-center">
                      <div className="flex items-center justify-center mb-1.5">
                        <FaBriefcase className="text-purple-400 text-sm" />
                      </div>
                      <p className="text-lg font-bold text-white">{appliedJobs}</p>
                      <p className="text-white/60 text-xs">Aplicaciones</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-lg text-center">
                      <div className="flex items-center justify-center mb-1.5">
                        <FaBookmark className="text-orange-400 text-sm" />
                      </div>
                      <p className="text-lg font-bold text-white">{savedJobs}</p>
                      <p className="text-white/60 text-xs">Guardados</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Publicaciones */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-white border-b border-white/10 pb-1.5">
                  Empleos publicados ({publishedJobs.length})
                </h3>
                
                {loadingJobs ? (
                  <div className="flex justify-center py-4">
                    <FaSpinner className="animate-spin text-[#FBB581] text-lg" />
                  </div>
                ) : publishedJobs.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {publishedJobs.map((job) => (
                      <div key={job.id} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white text-sm font-medium truncate">{job.title}</h4>
                            <p className="text-white/60 text-xs">{job.company}</p>
                            <p className="text-white/40 text-xs">{formatDate(job.createdAt?.toDate?.())}</p>
                          </div>
                          {isOwnProfile && (
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() => onEditJob?.(job)}
                                className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                title="Editar"
                              >
                                <FaEdit className="text-xs" />
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-1 text-[#FF4438] hover:text-[#FF4438] transition-colors"
                                title="Eliminar"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-xs text-center py-4">
                    {isOwnProfile ? 'No has publicado empleos aún' : 'No ha publicado empleos'}
                  </p>
                )}
              </div>

              {/* Mensaje predeterminado (solo perfil propio) */}
              {isOwnProfile && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-white border-b border-white/10 pb-1.5">
                    Mensaje de contacto
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="text-white/60 text-xs">Mensaje predeterminado para aplicaciones</label>
                    <textarea
                      value={defaultMessage || `Estimado equipo de [EMPRESA],

Les escribo con gran interés por la vacante de [PUESTO]. Adjunto mi Currículum Vitae para su consideración.

Mi experiencia y habilidades se alinean con los requisitos del puesto y estoy convencido de que puedo aportar valor a su equipo.

Agradezco su tiempo y quedo a su entera disposición para una futura entrevista.

Atentamente,
[NOMBRE]`}
                      onChange={(e) => setDefaultMessage(e.target.value)}
                      className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-lg text-white text-xs resize-none focus:outline-none focus:border-[#FBB581]/50 transition-colors"
                      placeholder="Escribe tu mensaje predeterminado aquí..."
                    />
                    <p className="text-white/40 text-xs">
                      Usa [EMPRESA], [PUESTO] y [NOMBRE] como marcadores que se reemplazarán automáticamente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
