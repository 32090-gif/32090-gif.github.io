// Dashboard Service for Kunlun Backend
const API_BASE_URL = window.location.hostname.includes('getkunlun.me') 
  ? 'https://getkunlun.me/api' 
  : '/api';

export const fetchDashboardKeys = async () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return {};
  
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/keys`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return {};
  } catch (error) {
    console.error('Error fetching dashboard keys:', error);
    return {};
  }
};

export const generateDashboardKey = async (game: string) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) throw new Error('No token found');
  
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/generate-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ game_name: game })
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to generate key');
  } catch (error) {
    console.error('Error generating dashboard key:', error);
    throw error;
  }
};
