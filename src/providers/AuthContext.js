import { createContext, useContext, useState, useEffect } from 'react';
import { useUserLoginMutation } from '../backend/api/sharedCrud';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [submitLoginForm, {
    data: loginSuccessResponse,
    isLoading: loginProcessing,
    isSuccess: loginSucceeded,
    isError: loginFailed,
    error: loginError,
  }] = useUserLoginMutation();

  const { data: loginErrorMessage } = loginError || {}

  useEffect(() => {
    const { Data: LoggedInUserData } = loginSuccessResponse || {}
    if (LoggedInUserData) {
      setUser(LoggedInUserData)
    }
  }, [loginSucceeded])

  const login = async (email, password) => {
    setLoading(true)
    submitLoginForm({ data: { email, password } })
  }

  async function logout() {
    try {
      setUser(null);
    } catch (error) {
      throw new Error(error.message || 'Failed to logout');
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading: loginProcessing || loading, login, logout, loginFailed, loginErrorMessage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
