import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
        return;
      }

      if (data?.session) {
        const user = data.session.user;

        // Check if user exists in your users table
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError);
        }

        if (!existingUser) {
          // Create new user record
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
                email: user.email,
                password: 'social_login',
                phone: user.phone || '',
                created_at: new Date().toISOString(),
              },
            ]);
          if (insertError) console.error('Error creating user:', insertError);
        }

        // Store user in localStorage
        const currentUser = {
          id: existingUser?.id || user.id,
          name: existingUser?.name || user.user_metadata?.full_name || user.user_metadata?.name || 'User',
          email: user.email,
          phone: existingUser?.phone || '',
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Redirect
        const redirectTo = localStorage.getItem('redirectAfterLogin') || '/';
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectTo);
      } else {
        navigate('/login');
      }
    };

    handleAuth();
  }, [navigate]);

  return <div className="auth-callback-loading">Signing you in...</div>;
};

export default AuthCallback;