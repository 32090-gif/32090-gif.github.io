// Debug API Configuration
// Add this to your browser console to check current API settings

console.group('🔍 API Configuration Debug');
console.log('🔗 Current URL:', window.location.href);
console.log('🌐 Host:', window.location.host); 
console.log('🏠 Hostname:', window.location.hostname);
console.log('🔒 Protocol:', window.location.protocol);
console.log('📁 Pathname:', window.location.pathname);

// Check environment variables (if available)
try {
  console.log('🌍 Environment Mode:', import.meta?.env?.MODE || 'unknown');
  console.log('🔧 API Base URL (env):', import.meta?.env?.VITE_API_BASE_URL || 'not set');
} catch (e) {
  console.log('⚠️ Environment variables not accessible in console');
}

// Test API URL detection logic
const detectAPIURL = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (hostname.includes('getkunlun.me')) {
    return `${protocol}//${hostname}/api`;
  }
  return `${protocol}//${hostname}:3001/api`;
};

console.log('🎯 Detected API URL:', detectAPIURL());

// Test if API is reachable
const testAPI = async () => {
  const apiUrl = detectAPIURL();
  console.log('🧪 Testing API connection...');
  
  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      console.log('✅ API is reachable!');
      const data = await response.json();
      console.log('📦 Response:', data);
    } else {
      console.log('❌ API responded with error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ API connection failed:', error.message);
    console.log('💡 Possible solutions:');
    console.log('  1. Check if API server is running');
    console.log('  2. Verify API URL in .env.production');
    console.log('  3. Check CORS settings');
    console.log('  4. Verify firewall/network settings');
  }
};

console.log('🚀 Run testAPI() to test connection');
console.groupEnd();

// Make testAPI available globally
window.testAPI = testAPI;