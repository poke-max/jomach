import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import { FaTimes, FaEnvelope, FaCalendar, FaBriefcase, FaBookmark, FaPhone, FaSpinner, FaExclamationTriangle, FaSms, FaCheck, FaPencilAlt, FaEdit, FaTrash, FaMapMarkerAlt, FaUser, FaFilePdf, FaUpload } from 'react-icons/fa';
import { RecaptchaVerifier, signInWithPhoneNumber, getAuth, updateProfile } from 'firebase/auth';
import { usersService, jobsService } from '../firebase/services';
import { storageService } from '../firebase/storageService';

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
  onEditJob,
  onSendMessage, // Nueva prop para abrir chat
  onViewJob // Nueva prop para abrir JobModal
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

  // Agregar estados para CV
  const [cvFile, setCvFile] = useState(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvUrl, setCvUrl] = useState(displayProfile?.cvUrl || '');

  // Función para subir CV
  const handleCVUpload = async (file) => {
    if (!file || !currentUser) return;
    
    try {
      setUploadingCV(true);
      const cvPath = `cvs/${currentUser.uid}/${file.name}`;
      const downloadUrl = await storageService.uploadFile(file, cvPath);
      
      // Actualizar perfil con URL del CV
      await updateUserProfile({ cvUrl: downloadUrl });
      setCvUrl(downloadUrl);
      
    } catch (error) {
      console.error('Error uploading CV:', error);
      setError('Error al subir el CV');
    } finally {
      setUploadingCV(false);
    }
  };

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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[90] overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="min-h-full flex justify-center px-4 py-6">
          <div className="w-full max-w-lg">
            
            {/* Header */}
            <div className="text-center mb-6">
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
            <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-white/20">
              
              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 z-10"
              >
                <FaTimes className="text-sm" />
              </button>

              {/* Botón Enviar Mensaje (solo para otros usuarios) */}
              {!isOwnProfile && onSendMessage && (
                <div className="mb-6">
                  <button
                    onClick={() => {
                      onSendMessage(userId, displayName);
                      onClose();
                    }}
                    className="w-full bg-[#FBB581] hover:bg-[#FBB581]/90 text-black font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <FaEnvelope className="text-sm" />
                    Enviar mensaje
                  </button>
                </div>
              )}

              {/* Mensaje de error */}
              {error && (
                <div className="mb-4 p-3 bg-[#FF4438]/20 border border-[#FF4438]/30 rounded-md flex items-center space-x-2">
                  <FaExclamationTriangle className="text-[#FF4438] text-sm flex-shrink-0" />
                  <span className="text-[#FF4438] text-sm leading-relaxed">{error}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                    Información personal
                  </h3>

                  <div className="space-y-3">
                    {/* Nombre con edición (solo perfil propio) */}
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <FaUser className="text-[#FBB581] text-sm" />
                      <div className="flex-1">
                        <p className="text-white/60 text-xs mb-1">Nombre</p>
                        {isOwnProfile && isEditingName ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm flex-1 focus:outline-none focus:border-[#FBB581]/50"
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                              autoFocus
                            />
                            <button
                              onClick={handleSaveName}
                              disabled={loading}
                              className="p-2 text-[#00A888] hover:text-[#00A888] transition-colors"
                            >
                              {loading ? <FaSpinner className="animate-spin text-sm" /> : <FaCheck className="text-sm" />}
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingName(false);
                                setEditedName(displayName);
                                setError('');
                              }}
                              className="p-2 text-[#FF4438] hover:text-[#FF4438] transition-colors"
                            >
                              <FaTimes className="text-sm" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm">{displayName}</p>
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
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <FaEnvelope className="text-blue-400 text-sm" />
                          <div>
                            <p className="text-white/60 text-xs mb-1">Email</p>
                            <p className="text-white text-sm">{email}</p>
                          </div>
                        </div>

                        {/* Teléfono con edición */}
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FaPhone className="text-[#00A888] text-sm" />
                            <div className="flex-1">
                              <p className="text-white/60 text-xs mb-1">Teléfono</p>
                              {!isEditingPhone ? (
                                <div className="flex items-center gap-2">
                                  <p className="text-white text-sm">
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
                                          <span className="text-white text-sm font-medium">+595</span>
                                          <div className="w-px h-4 bg-white/30"></div>
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
                                          className="w-full pl-20 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#FBB581]/50"
                                          maxLength="9"
                                        />
                                      </div>

                                      <div id="recaptcha-container-profile" className="flex justify-center"></div>

                                      <div className="flex gap-2">
                                        <button
                                          onClick={handlePhoneVerification}
                                          disabled={loading || !phoneNumber || phoneNumber.length !== 9}
                                          className="flex-1 bg-[#00A888] hover:bg-[#00A888]/90 disabled:bg-white/10 disabled:text-white/40 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                          {loading ? <FaSpinner className="animate-spin text-sm" /> : <FaSms className="text-sm" />}
                                          Verificar
                                        </button>
                                        <button
                                          onClick={resetPhoneEdit}
                                          className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </>
                                  )}

                                  {phoneStep === 'verification' && (
                                    <>
                                      <div className="text-center">
                                        <p className="text-white/80 text-sm mb-2">
                                          Código enviado a +595{phoneNumber}
                                        </p>
                                        <input
                                          type="text"
                                          placeholder="123456"
                                          value={verificationCode}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setVerificationCode(value);
                                            if (error) setError('');
                                          }}
                                          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm text-center focus:outline-none focus:border-[#FBB581]/50"
                                          maxLength="6"
                                        />
                                      </div>

                                      <div className="flex gap-2">
                                        <button
                                          onClick={handleVerifyCode}
                                          disabled={loading || verificationCode.length !== 6}
                                          className="flex-1 bg-[#00A888] hover:bg-[#00A888]/90 disabled:bg-white/10 disabled:text-white/40 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                          {loading ? <FaSpinner className="animate-spin text-sm" /> : <FaCheck className="text-sm" />}
                                          Confirmar
                                        </button>
                                        <button
                                          onClick={resetPhoneEdit}
                                          className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                                        >
                                          Cancelar
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

                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <FaCalendar className="text-purple-400 text-sm" />
                      <div>
                        <p className="text-white/60 text-xs mb-1">Miembro desde</p>
                        <p className="text-white text-sm">{formatDate(createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas (solo perfil propio) */}
                {isOwnProfile && (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                      Actividad
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-white/5 rounded-lg text-center">
                        <div className="flex items-center justify-center mb-2">
                          <FaBriefcase className="text-purple-400 text-lg" />
                        </div>
                        <p className="text-xl font-bold text-white">{appliedJobs}</p>
                        <p className="text-white/60 text-sm">Aplicaciones</p>
                      </div>

                      <div className="p-4 bg-white/5 rounded-lg text-center">
                        <div className="flex items-center justify-center mb-2">
                          <FaBookmark className="text-orange-400 text-lg" />
                        </div>
                        <p className="text-xl font-bold text-white">{savedJobs}</p>
                        <p className="text-white/60 text-sm">Guardados</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Publicaciones */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                    Empleos publicados ({publishedJobs.length})
                  </h3>
                  
                  {loadingJobs ? (
                    <div className="flex justify-center py-8">
                      <FaSpinner className="animate-spin text-[#FBB581] text-xl" />
                    </div>
                  ) : publishedJobs.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {publishedJobs.map((job) => (
                        <div key={job.id} className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group">
                          <div className="flex items-start justify-between">
                            <div
                              className="flex-1 min-w-0"
                              onClick={() => onViewJob?.(job)}
                            >
                              <h4 className="text-white text-sm font-medium truncate group-hover:text-[#FBB581] transition-colors">{job.title}</h4>
                              <p className="text-white/60 text-sm">{job.company}</p>
                              <p className="text-white/40 text-xs">{formatDate(job.createdAt?.toDate?.())}</p>
                            </div>
                            {isOwnProfile && (
                              <div className="flex gap-2 ml-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditJob?.(job);
                                  }}
                                  className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                  title="Editar"
                                >
                                  <FaEdit className="text-sm" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteJob(job.id);
                                  }}
                                  className="p-2 text-[#FF4438] hover:text-[#FF4438] transition-colors"
                                  title="Eliminar"
                                >
                                  <FaTrash className="text-sm" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm text-center py-8">
                      {isOwnProfile ? 'No has publicado empleos aún' : 'No ha publicado empleos'}
                    </p>
                  )}
                </div>

                {/* Mensaje predeterminado (solo perfil propio) */}
                {isOwnProfile && (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                      Mensaje de contacto
                    </h3>
                    
                    <div className="space-y-3">
                      <label className="text-white/60 text-sm">Mensaje predeterminado para aplicaciones</label>
                      <textarea
                        value={defaultMessage || `Estimado equipo de [EMPRESA],

Les escribo con gran interés por la vacante de [PUESTO]. Adjunto mi Currículum Vitae para su consideración.

Mi experiencia y habilidades se alinean con los requisitos del puesto y estoy convencido de que puedo aportar valor a su equipo.

Agradezco su tiempo y quedo a su entera disposición para una futura entrevista.

Atentamente,
[NOMBRE]`}
                        onChange={(e) => setDefaultMessage(e.target.value)}
                        className="w-full h-40 p-4 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-[#FBB581]/50 transition-colors"
                        placeholder="Escribe tu mensaje predeterminado aquí..."
                      />
                      <p className="text-white/40 text-sm">
                        Usa [EMPRESA], [PUESTO] y [NOMBRE] como marcadores que se reemplazarán automáticamente.
                      </p>
                    </div>
                  </div>
                )}

                {/* CV (solo perfil propio) */}
                {isOwnProfile && (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                      Curriculum Vitae
                    </h3>
                    
                    {cvUrl ? (
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                        <FaFilePdf className="text-red-400 text-lg" />
                        <span className="text-white text-sm flex-1">CV subido</span>
                        <button
                          onClick={() => window.open(cvUrl, '_blank')}
                          className="text-[#FBB581] hover:text-[#FBB581]/80 text-sm font-medium"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => setCvUrl('')}
                          className="text-red-400 hover:text-red-300 text-sm font-medium ml-3"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleCVUpload(e.target.files[0])}
                          className="hidden"
                          id="cv-upload"
                          disabled={uploadingCV}
                        />
                        <label
                          htmlFor="cv-upload"
                          className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-[#FBB581]/50 transition-colors"
                        >
                          {uploadingCV ? (
                            <FaSpinner className="animate-spin text-[#FBB581] text-lg" />
                          ) : (
                            <FaUpload className="text-white/60 text-lg" />
                          )}
                          <span className="text-white/80 text-sm font-medium">
                            {uploadingCV ? 'Subiendo...' : 'Subir CV (PDF)'}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
