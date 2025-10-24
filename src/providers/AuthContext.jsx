import { createContext, useContext, useState, useEffect } from 'react';
import { useUserLoginMutation } from '../backend/api/sharedCrud';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [submitLoginForm, {
    data: loginSuccessResponse,
    isLoading: loginProcessing,
    isSuccess: loginSucceeded,
    isError: loginFailed,
    error: loginError,
  }] = useUserLoginMutation();

  const { data: loginErrorMessage } = loginError || {}

  console.log("<<+++>>-loginSuccessResponse.user =", loginSuccessResponse?.user)

  useEffect(() => {
    const { user: LoggedInUserData } = loginSuccessResponse || {}
    if (LoggedInUserData) {
      setUser(LoggedInUserData)
      setLoading(false)
    }
    if (loginFailed) {
      setLoading(false)
    }
  }, [loginSucceeded, loginFailed])

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

  console.log("user=",user,", loginProcessing = ", loginProcessing,", loading =",loading,", loginFailed =",loginFailed,", loginSucceeded =",loginSucceeded,", loginErrorMessage =", loginErrorMessage)

  return (
    <AuthContext.Provider value={{ user, loading: loginProcessing || loading, login, logout, loginFailed, loginSucceeded, loginErrorMessage }}>
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
