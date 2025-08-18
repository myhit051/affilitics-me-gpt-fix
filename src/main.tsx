import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize Facebook configuration on app startup
import { initializeFacebookConfig } from '@/config/facebook'

// Initialize and validate Facebook configuration
const configResult = initializeFacebookConfig();
if (!configResult.success) {
  console.error('Facebook configuration initialization failed:', configResult.errors);
}

createRoot(document.getElementById("root")!).render(<App />);
