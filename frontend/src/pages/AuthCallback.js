import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error("No session ID found");
          navigate('/');
          return;
        }

        // Exchange session_id for user data
        const response = await axios.post(
          `${BACKEND_URL}/api/auth/session`,
          {},
          {
            headers: {
              'X-Session-ID': sessionId
            },
            withCredentials: true
          }
        );

        const { user, has_profile } = response.data;

        toast.success(`Welcome, ${user.name}!`);

        // Redirect based on profile status
        if (has_profile) {
          navigate('/dashboard', { state: { user } });
        } else {
          navigate('/ikigai-chat', { state: { user } });
        }
      } catch (error) {
        console.error('Session processing error:', error);
        toast.error("Authentication failed. Please try again.");
        navigate('/');
      }
    };

    processSession();
  }, [location.hash, navigate]);

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse-glow inline-block mb-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-400 text-lg">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;