import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated, logout, getToken, getCurrentUser } from "@/services/authService";

const AuthDebug = () => {
  const [authInfo, setAuthInfo] = useState<any>({});

  const checkAuth = () => {
    const isAuth = isAuthenticated();
    const token = getToken();
    const user = getCurrentUser();
    const localStorageAuth = localStorage.getItem('authToken');
    const sessionStorageAuth = sessionStorage.getItem('authToken');
    const localStorageUser = localStorage.getItem('user');
    const sessionStorageUser = sessionStorage.getItem('user');

    setAuthInfo({
      isAuthenticated: isAuth,
      hasToken: !!token,
      token: token ? `${token.substring(0, 20)}...` : 'None',
      user: user ? user.username : 'None',
      localStorage: {
        auth: localStorageAuth ? `${localStorageAuth.substring(0, 20)}...` : 'None',
        user: localStorageUser ? JSON.parse(localStorageUser).username : 'None'
      },
      sessionStorage: {
        auth: sessionStorageAuth ? `${sessionStorageAuth.substring(0, 20)}...` : 'None',
        user: sessionStorageUser ? JSON.parse(sessionStorageUser).username : 'None'
      }
    });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const clearAuth = () => {
    logout();
    localStorage.clear();
    sessionStorage.clear();
    window.dispatchEvent(new CustomEvent('authChange'));
    setTimeout(() => {
      checkAuth();
      window.location.reload();
    }, 100);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-white/90 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">🐛 Auth Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div>
            <strong>Status:</strong> {authInfo.isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
          </div>
          <div>
            <strong>Token:</strong> {authInfo.token}
          </div>
          <div>
            <strong>User:</strong> {authInfo.user}
          </div>
          <div>
            <strong>LocalStorage:</strong>
            <div className="ml-2">Auth: {authInfo.localStorage?.auth}</div>
            <div className="ml-2">User: {authInfo.localStorage?.user}</div>
          </div>
          <div>
            <strong>SessionStorage:</strong>
            <div className="ml-2">Auth: {authInfo.sessionStorage?.auth}</div>
            <div className="ml-2">User: {authInfo.sessionStorage?.user}</div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={checkAuth} variant="outline">
              🔄 Refresh
            </Button>
            <Button size="sm" onClick={clearAuth} variant="destructive">
              🗑️ Clear Auth
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDebug;