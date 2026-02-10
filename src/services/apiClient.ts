// API Client for Kunlun Backend
const API_BASE_URL = 'http://localhost:3001/api';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  pin: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  user?: T;
  users?: T[];
  token?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage or sessionStorage
    this.token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || localStorage.getItem('auth_token');
    
    // Clear token if it exists but might be invalid
    if (this.token) {
      this.validateToken().catch(() => {
        this.clearToken();
      });
    }
  }

  private async validateToken(): Promise<boolean> {
    if (!this.token) return false;
    
    try {
      const response = await fetch('/api/user/points', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        this.clearToken();
        return false;
      }
      
      return response.ok;
    } catch (error) {
      this.clearToken();
      return false;
    }
  }

  private clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('authChange'));
  }

  // Make public for direct use in components
  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('Making API request to:', url);
    console.log('Request options:', options);
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token exists
    if (this.token) {
      defaultHeaders.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log('Final request config:', config);
      const response = await fetch(url, config);
      
      console.log('API response status:', response.status);
      console.log('API response headers:', response.headers);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text}`);
      }

      console.log('API response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      
      // Check if it's a network error (CORS, connection failed, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network/CORS error detected');
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      }
      
      throw error;
    }
  }

  // Authentication methods
  async register(userData: RegisterData): Promise<ApiResponse> {
    try {
      const response = await this.makeRequest('/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Save token if registration successful
      if (response.success && response.token) {
        this.token = response.token;
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'การลงทะเบียนล้มเหลว'
      };
    }
  }

  async login(credentials: LoginData): Promise<ApiResponse> {
    try {
      const response = await this.makeRequest('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Save token if login successful
      if (response.success && response.token) {
        this.token = response.token;
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'การเข้าสู่ระบบล้มเหลว'
      };
    }
  }

  async getProfile(): Promise<ApiResponse> {
    try {
      if (!this.token) {
        throw new Error('No authentication token');
      }

      return await this.makeRequest('/profile');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลผู้ใช้ได้'
      };
    }
  }

  async getAllUsers(): Promise<ApiResponse> {
    try {
      return await this.makeRequest('/admin/users');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลผู้ใช้ทั้งหมดได้'
      };
    }
  }

  async healthCheck(): Promise<ApiResponse> {
    try {
      return await this.makeRequest('/health');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
      };
    }
  }

  // Admin API methods
  async updateUserPoints(userId: string, points: number): Promise<ApiResponse> {
    try {
      return await this.makeRequest(`/admin/users/${userId}/points`, {
        method: 'PUT',
        body: JSON.stringify({ points })
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถอัปเดตพอยต์ผู้ใช้ได้'
      };
    }
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    try {
      return await this.makeRequest(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถลบผู้ใช้ได้'
      };
    }
  }

  async updateStock(itemId: string, stock: number): Promise<ApiResponse> {
    try {
      return await this.makeRequest(`/admin/stock/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ stock })
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถอัปเดตสต็อกได้'
      };
    }
  }

  async getAdminStats(): Promise<ApiResponse> {
    try {
      return await this.makeRequest('/admin/stats');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลสถิติได้'
      };
    }
  }

  async getAllStock(): Promise<ApiResponse> {
    try {
      return await this.makeRequest('/admin/stock');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลสต็อกได้'
      };
    }
  }

  // Product Management API methods
  async createProduct(productData: any): Promise<ApiResponse> {
    try {
      return await this.makeRequest('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถสร้างสินค้าได้'
      };
    }
  }

  async updateProduct(productId: string, productData: any): Promise<ApiResponse> {
    try {
      return await this.makeRequest(`/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถแก้ไขสินค้าได้'
      };
    }
  }

  async deleteProduct(productId: string): Promise<ApiResponse> {
    try {
      return await this.makeRequest(`/admin/products/${productId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'ไม่สามารถลบสินค้าได้'
      };
    }
  }

  // Utility methods
  logout(): void {
    this.clearToken();
  }

  isAuthenticated(): boolean {
    // Check if token exists and is valid
    const hasToken = !!this.token;
    const hasUser = !!(localStorage.getItem('user') || sessionStorage.getItem('user'));
    return hasToken && hasUser;
  }

  getToken(): string | null {
    return this.token;
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Export users data
  async exportUsers(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/export/users`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'slumzick_users.json';
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
export type { RegisterData, LoginData, ApiResponse };