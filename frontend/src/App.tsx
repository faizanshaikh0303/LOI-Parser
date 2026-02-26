import { useEffect } from 'react';
import LOIReview from './components/LOIReview';

function App() {
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // First ping wakes the Python backend; Python background-pings the document
    // service with a 70 s timeout so Render has time to cold-start it.
    fetch(`${apiBase}/health`).catch(() => {});

    // Second ping after 35 s — if Python itself was cold on the first request
    // the document-service wake-up may not have fired. A second ping ensures
    // it is triggered once Python is definitely alive.
    const timer = setTimeout(() => {
      fetch(`${apiBase}/health`).catch(() => {});
    }, 35_000);

    return () => clearTimeout(timer);
  }, []);

  return <LOIReview />;
}

export default App;
