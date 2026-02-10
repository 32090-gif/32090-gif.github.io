import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Promotions = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to products page instead
    navigate('/products', { replace: true });
  }, [navigate]);

  return null;
};

export default Promotions;