
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { usersService } from '../firebase/services';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Registrarse con email y contraseña
  const signup = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Actualizar perfil de Firebase Auth
    await updateProfile(result.user, { displayName });
    
    // Crear perfil en Firestore
    await usersService.createOrUpdateUserProfile(result.user.uid, {
      email: result.user.email,
      displayName: displayName,
      photoURL: result.user.photoURL
    });
    
    return result;
  };

  // Iniciar sesión
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Iniciar sesión con Google
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    const result = await signInWithPopup(auth, provider);
    
    // Crear o actualizar perfil en Firestore
    await usersService.createOrUpdateUserProfile(result.user.uid, {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL
    });
    
    return result;
  };

  // Cerrar sesión
  const logout = () => {
    return signOut(auth);
  };

  // Resetear contraseña
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Actualizar perfil
  const updateUserProfile = async (profileData) => {
    if (currentUser) {
      await usersService.createOrUpdateUserProfile(currentUser.uid, profileData);
    }
  };

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Suscribirse a cambios del perfil en Firestore
        unsubscribeProfile = usersService.subscribeToUserProfile(
          user.uid, 
          (profile) => {
            setUserProfile(profile);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setLoading(false);
        
        // Limpiar suscripción al perfil
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
