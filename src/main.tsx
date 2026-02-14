import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getTestAPIBaseURL } from "./services/testApiClient.ts";
import "./uniqueTest.js";
import AOS from 'aos';
import 'aos/dist/aos.css';

// Force use testApiClient
console.log('🧪 Test API URL:', getTestAPIBaseURL());

// Initialize AOS - ปรับให้เร็วขึ้น
AOS.init({
  duration: 500,
  easing: 'ease-out',
  once: true,
  mirror: false,
  delay: 0,
});

createRoot(document.getElementById("root")!).render(<App />);
