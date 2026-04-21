import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { loginRequest, registerRequest } from '../services/auth.service';
import { setAuthToken } from '../services/api';
import { AuthUser } from '../types/models';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  profileComplete: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  markProfileComplete: () => Promise<void>;
};

const TOKEN_KEY = '@cofound/token';
const USER_KEY = '@cofound/user';
const PROFILE_COMPLETE_KEY = '@cofound/profileComplete';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedToken, storedUser, storedProfileComplete] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(PROFILE_COMPLETE_KEY),
        ]);

        if (storedToken) {
          setToken(storedToken);
          setAuthToken(storedToken);
          // Si no existe el flag (usuario antiguo), se considera completo
          setProfileComplete(storedProfileComplete === null ? true : storedProfileComplete === 'true');
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const persistSession = async (
    sessionToken: string,
    sessionUser: AuthUser,
    complete: boolean,
  ) => {
    setToken(sessionToken);
    setUser(sessionUser);
    setAuthToken(sessionToken);
    setProfileComplete(complete);

    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, sessionToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(sessionUser)),
      AsyncStorage.setItem(PROFILE_COMPLETE_KEY, complete ? 'true' : 'false'),
    ]);
  };

  const signIn = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    await persistSession(response.token, response.user, true);
  };

  const signUp = async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await registerRequest(payload);
    // Tras el registro redirigimos al wizard de perfil
    await persistSession(response.token, response.user, false);
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    setProfileComplete(false);

    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
      AsyncStorage.removeItem(PROFILE_COMPLETE_KEY),
    ]);
  };

  const updateUser = (nextUser: AuthUser) => {
    setUser(nextUser);
    AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser)).catch(() => undefined);
  };

  const markProfileComplete = async () => {
    setProfileComplete(true);
    await AsyncStorage.setItem(PROFILE_COMPLETE_KEY, 'true');
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      profileComplete,
      signIn,
      signUp,
      signOut,
      updateUser,
      markProfileComplete,
    }),
    [token, user, isLoading, profileComplete],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
