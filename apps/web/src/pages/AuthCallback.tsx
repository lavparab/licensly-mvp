import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback - Supabase auto-detects tokens in the URL
    // because detectSessionInUrl is true in the client config.
    // We just need to wait for the session to be established.
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { replace: true });
        return;
      }

      if (session) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // If no session yet, listen for auth state change (token might still be processing)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          navigate('/dashboard', { replace: true });
        } else if (event === 'SIGNED_OUT') {
          subscription.unsubscribe();
          navigate('/login', { replace: true });
        }
      });

      // Timeout fallback - if nothing happens in 10 seconds, redirect to login
      setTimeout(() => {
        subscription.unsubscribe();
        navigate('/login', { replace: true });
      }, 10000);
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="ml-3">Logging you in...</p>
    </div>
  );
}