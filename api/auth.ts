import { appendToGoogleSheets, checkEmailExists, authenticateUser, UserData } from './googleSheets';

// Mock API endpoints for development
// In production, these would be proper backend endpoints

export async function registerUser(userData: UserData): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Check if email already exists
    const emailExists = await checkEmailExists(userData.email);
    
    if (emailExists) {
      return {
        success: false,
        message: 'อีเมลนี้มีการใช้งานแล้ว'
      };
    }

    // Add user to Google Sheets
    const success = await appendToGoogleSheets(userData);
    
    if (success) {
      return {
        success: true,
        message: 'สมัครสมาชิกสำเร็จ',
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email
        }
      };
    } else {
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
      };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดภายในระบบ'
    };
  }
}

export async function loginUser(email: string, password: string): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const user = await authenticateUser(email, password);
    
    if (user) {
      return {
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        }
      };
    } else {
      return {
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดภายในระบบ'
    };
  }
}