/**
 * Custom Hook to monitor backend health and connection status
 */
import { useState, useEffect } from 'react';
import { fetchHealthStatus } from '../services/healthService';

export const useHealthCheck = () => {
  const [health, setHealth] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const check = async () => {
    setIsLoading(true);
    try {
      const data = await fetchHealthStatus();
      setHealth(data);
      setIsConnected(data?.status === 'healthy');
      setError(null);
    } catch (err) {
      setIsConnected(false);
      setError(err.message || 'Cannot reach VidTube API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  return { health, isConnected, isLoading, error, refetch: check };
};
