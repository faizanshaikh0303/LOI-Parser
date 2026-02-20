import { useEffect } from 'react';
import LOIReview from './components/LOIReview';

function App() {
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${apiBase}/health`).catch(() => {});
  }, []);

  return <LOIReview />;
}

export default App;
