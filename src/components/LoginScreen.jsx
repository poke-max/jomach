import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSpinner, FaExclamationTriangle, FaPhone, FaArrowLeft, FaSms } from 'react-icons/fa';
import { RecaptchaVerifier, signInWithPhoneNumber, getAuth } from 'firebase/auth';

const LoginScreen = () => {
  const { loginWithGoogle, login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
  const [phoneStep, setPhoneStep] = useState('phone'); // 'phone' | 'verification'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  // Configurar reCAPTCHA al montar el componente
  useEffect(() => {
    if (authMethod === 'phone' && !window.recaptchaVerifier) {
      const auth = getAuth();
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': (response) => {
          console.log('reCAPTCHA resuelto');
        },
        'expired-callback': () => {
          setError('reCAPTCHA expirado. Inténtalo de nuevo.');
        }
      });
    }
  }, [authMethod]);

  // Limpiar reCAPTCHA al desmontar
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // Función para obtener mensajes de error en español
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/email-already-in-use': 'Este correo electrónico ya está registrado',
      'auth/invalid-email': 'El formato del correo electrónico no es válido',
      'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
      'auth/wrong-password': 'La contraseña es incorrecta',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
      'auth/operation-not-allowed': 'Este método de autenticación no está habilitado. Contacta al administrador',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/requires-recent-login': 'Por seguridad, inicia sesión nuevamente',
      'auth/popup-closed-by-user': 'Ventana de Google cerrada por el usuario',
      'auth/popup-blocked': 'El navegador bloqueó la ventana emergente',
      'auth/cancelled-popup-request': 'Solicitud de ventana emergente cancelada',
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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (phone) => {
    // Validación para número paraguayo (9 dígitos después del código de país)
    const fullNumber = `+595${phone}`;
    const phoneRegex = /^\+595[0-9]{9}$/;
    return phoneRegex.test(fullNumber);
  };

  const handlePhoneAuth = async () => {
    if (!phoneNumber.trim()) {
      setError('El número de teléfono es obligatorio');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Ingresa un número válido de 9 dígitos (ej: 987654321)');
      return;
    }

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

  const handleVerifyCode = async () => {
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

      const result = await confirmationResult.confirm(verificationCode);
      console.log('Usuario autenticado:', result.user);
      // El usuario ya está autenticado, el contexto se encargará del resto
    } catch (error) {
      console.error('Error al verificar código:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const resetPhoneAuth = () => {
    setPhoneStep('phone');
    setPhoneNumber('');
    setVerificationCode('');
    setConfirmationResult(null);
    setError('');
    
    // Limpiar y recrear reCAPTCHA
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('El correo electrónico es obligatorio');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('La contraseña es obligatoria');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    if (!isLogin && !formData.displayName.trim()) {
      setError('El nombre completo es obligatorio');
      return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('El formato del correo electrónico no es válido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password, formData.displayName);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
  };

  const handleAuthMethodChange = (method) => {
    setAuthMethod(method);
    setError('');
    if (method === 'email') {
      resetPhoneAuth();
    }
  };

  // Componente de la bandera paraguaya
  const ParaguayFlag = () => (
    <svg width="20" height="15" viewBox="0 0 20 15" className="flex-shrink-0">
      <rect width="20" height="5" fill="#D52B1E"/>
      <rect y="5" width="20" height="5" fill="#FFFFFF"/>
      <rect y="10" width="20" height="5" fill="#0038A8"/>
      <circle cx="10" cy="7.5" r="2" fill="#FFD700" stroke="#8B4513" strokeWidth="0.2"/>
    </svg>
  );

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative flex items-center justify-center">
      <div className="fixed w-full h-full flex items-center justify-center px-4">
        <div className="relative w-full max-w-xs">
          
          {/* Header compacto */}
          <div className="text-center mb-6">
            <img src="favicon.svg" alt="Logo" className="w-20 h-20 mx-auto mb-3" />
            <p className="text-white/70 text-xs">
              {isLogin ? 'Ingresa a tu cuenta' : 'Únete a nosotros'}
            </p>
          </div>

          {/* Formulario compacto */}
          <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/20">
            
            {/* Mensaje de error */}
            {error && (
              <div className="mb-4 p-3 bg-[#FF4438]/20 border border-[#FF4438]/30 rounded-lg flex items-center space-x-2">
                <FaExclamationTriangle className="text-[#FF4438] text-sm flex-shrink-0" />
                <span className="text-[#FF4438] text-xs leading-relaxed">{error}</span>
              </div>
            )}

            {/* Selector de método de autenticación */}
            {authMethod === 'email' && (
              <div className="flex space-x-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleAuthMethodChange('email')}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-[#FBB581]/20 text-[#FBB581] rounded-lg text-xs font-medium border border-[#FBB581]/30"
                >
                  <FaEnvelope />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAuthMethodChange('phone')}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-white/10 text-white/70 hover:bg-white/20 rounded-lg text-xs font-medium transition-all duration-200 border border-white/20"
                >
                  <FaPhone />
                  <span>Teléfono</span>
                </button>
              </div>
            )}

            {/* Formulario de Email/Contraseña */}
            {authMethod === 'email' && (
              <form onSubmit={handleSubmit} className="space-y-3">
                
                {/* Campo nombre - solo en registro */}
                {!isLogin && (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                      <FaUser className="text-white/70 text-sm" />
                    </div>
                    <input
                      type="text"
                      name="displayName"
                      placeholder="Nombre completo"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                      required={!isLogin}
                    />
                  </div>
                )}

                {/* Campo email */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <FaEnvelope className="text-white/70 text-sm" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Correo electrónico"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                    required
                  />
                </div>

                {/* Campo contraseña */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <FaLock className="text-white/70 text-sm" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Contraseña (mín. 6 caracteres)"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-all duration-200 z-10"
                  >
                    {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                  </button>
                </div>

                {/* Indicador de fortaleza de contraseña */}
                {formData.password && (
                  <div className="text-xs text-white/70">
                    Fortaleza: {formData.password.length < 6 ? 'Débil' : formData.password.length < 8 ? 'Regular' : 'Fuerte'}
                  </div>
                )}

                {/* Botón principal */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#FBB581] to-[#673AB7] hover:from-[#FBB581] hover:to-purple-500/80 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm transform hover:scale-105"
                >
                  {loading && <FaSpinner className="animate-spin mr-2 text-sm" />}
                  <span>
                    {loading ? 'Procesando...' : (isLogin ? 'Iniciar sesión' : 'Crear cuenta')}
                  </span>
                </button>
              </form>
            )}

            {/* Formulario de Autenticación por Teléfono */}
            {authMethod === 'phone' && (
              <div className="space-y-4">
                {/* Botón de regreso */}
                <button
                  onClick={() => handleAuthMethodChange('email')}
                  className="flex items-center space-x-2 text-white/70 hover:text-white text-xs transition-colors"
                >
                  <FaArrowLeft />
                  <span>Volver a email</span>
                </button>

                {phoneStep === 'phone' && (
                  <>
                    <div className="text-center mb-4">
                      <FaPhone className="mx-auto text-[#FBB581] text-2xl mb-2" />
                      <h3 className="text-white text-sm font-medium">Autenticación por teléfono</h3>
                      <p className="text-white/70 text-xs mt-1">Te enviaremos un código de verificación por SMS</p>
                    </div>

                    {/* Campo de teléfono con bandera paraguaya */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 flex items-center space-x-2">
                        <ParaguayFlag />
                        <span className="text-white text-sm font-medium">+595</span>
                        <div className="w-px h-4 bg-white/30"></div>
                      </div>
                      <input
                        type="tel"
                        placeholder=""
                        value={phoneNumber}
                        onChange={(e) => {
                          // Solo permitir números y limitar a 9 dígitos
                          const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setPhoneNumber(value);
                          if (error) setError('');
                        }}
                        className="w-full pl-20 pr-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                        maxLength="9"
                      />
                    </div>

                    <div className="text-xs text-white/70">
                      Ingresa tu número sin el código de país
                    </div>

                    {/* Contenedor de reCAPTCHA */}
                    <div id="recaptcha-container" className="flex justify-center"></div>

                    <button
                      onClick={handlePhoneAuth}
                      disabled={loading || phoneNumber.length !== 9}
                      className="w-full bg-gradient-to-r from-[#FBB581] to-[#673AB7] hover:from-[#FBB581] hover:to-purple-500/80 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm transform hover:scale-105"
                    >
                      {loading && <FaSpinner className="animate-spin mr-2 text-sm" />}
                      <FaSms className="mr-2 text-sm" />
                      <span>{loading ? 'Enviando...' : 'Enviar código SMS'}</span>
                    </button>
                  </>
                )}

                {phoneStep === 'verification' && (
                  <>
                    <div className="text-center mb-4">
                      <FaSms className="mx-auto text-[#FBB581] text-2xl mb-2" />
                      <h3 className="text-white text-sm font-medium">Código enviado</h3>
                      <p className="text-white/70 text-xs mt-1">
                        Revisa tu teléfono (+595{phoneNumber}) y ingresa el código de 6 dígitos
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setVerificationCode(value);
                          if (error) setError('');
                        }}
                        className="w-full px-3 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-center text-lg tracking-widest placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#FBB581] focus:border-[#FBB581] transition-all duration-200"
                        maxLength="6"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={resetPhoneAuth}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-xs"
                      >
                        Cambiar número
                      </button>
                      <button
                        onClick={handleVerifyCode}
                        disabled={loading || verificationCode.length !== 6}
                        className="flex-1 bg-gradient-to-r from-[#FBB581] to-[#673AB7] hover:from-[#FBB581] hover:to-purple-500/80 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs transform hover:scale-105"
                      >
                        {loading && <FaSpinner className="animate-spin mr-2 text-xs" />}
                        <span>{loading ? 'Verificando...' : 'Verificar'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Divider */}
            {authMethod === 'email' && (
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-3 text-white/70 text-xs">O</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>
            )}

            {/* Botón Google */}
            {authMethod === 'email' && (
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm transform hover:scale-105"
              >
                {loading ? (
                  <FaSpinner className="animate-spin mr-2 text-sm" />
                ) : (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>Continuar con Google</span>
              </button>
            )}


            {/* Link de contraseña olvidada */}
            {isLogin && authMethod === 'email' && (
              <div className="text-center mt-3">
                <button className="text-white/70 hover:text-white text-xs transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
          </div>

          {/* Toggle Login/Signup - solo para email */}
          {authMethod === 'email' && (
            <div className="text-center mt-4">
              <span className="text-white/70 text-xs">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              </span>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(''); // Limpiar errores al cambiar de modo
                }}
                className="ml-2 text-white hover:text-white/80 font-semibold text-xs transition-colors transform hover:scale-105"
              >
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;