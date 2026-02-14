// Test API Client - Using dynamic URL
export const getTestAPIBaseURL = (): string => {
  const currentOrigin = window.location.origin;
  return `${currentOrigin}/api`;
};

export const TEST_API_BASE_URL = getTestAPIBaseURL();

console.log('🧪 Test API Base URL:', TEST_API_BASE_URL);
console.log('🌍 Test Current origin:', window.location.origin);