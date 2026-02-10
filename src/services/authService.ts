import apiClient from './apiClient';

export interface UserData {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  pin: string;
  createdAt?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    username: string;
    pin: string;
  };
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const registerUser = async (userData: UserData): Promise<AuthResponse> => {
  try {
    console.log('Registering user via API:', userData.username);
    
    const response = await apiClient.register({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      pin: userData.pin
    });

    if (response.success) {
      console.log('Registration successful via API:', response.user);
      return {
        success: true,
        message: response.message,
        user: response.user
      };
    } else {
      return {
        success: false,
        message: response.message
      };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการลงทะเบียน'
    };
  }
};

export const loginUser = async (loginData: LoginData): Promise<AuthResponse> => {
  try {
    console.log('Logging in via API:', loginData.username);
    
    const response = await apiClient.login({
      username: loginData.username,
      password: loginData.password
    });

    if (response.success) {
      // Store auth token
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
      console.log('Login successful via API:', response.user);
      return {
        success: true,
        message: response.message,
        user: response.user
      };
    } else {
      return {
        success: false,
        message: response.message
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    };
  }
};

export const logout = (): void => {
  apiClient.logout();
  console.log('User logged out');
};

export const getCurrentUser = () => {
  // Check both storage locations
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return apiClient.isAuthenticated();
};

export const getToken = (): string | null => {
  return localStorage.getItem('authToken') || localStorage.getItem('auth_token');
};

export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const response = await apiClient.getAllUsers();
    return response.success ? response.users || [] : [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const downloadJSON = async (): Promise<void> => {
  try {
    await apiClient.exportUsers();
    console.log('Users data exported successfully');
  } catch (error) {
    console.error('Export error:', error);
  }
};

export const getJSONData = async (): Promise<string> => {
  try {
    const users = await getAllUsers();
    return JSON.stringify({ users }, null, 2);
  } catch (error) {
    console.error('Error getting JSON data:', error);
    return JSON.stringify({ users: [] }, null, 2);
  }
};

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.healthCheck();
    return response.success;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};
