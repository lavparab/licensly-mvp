import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Key } from 'lucide-react';

export const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { session, isLoading: authLoading } = useAuth();
    const [email, setEmail] = useState('admin@acmecorp.com');
    const [password, setPassword] = useState('password123');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const from = location.state?.from?.pathname || '/dashboard';

    useEffect(() => {
        if (!authLoading && session) {
            navigate(from, { replace: true });
        }
    }, [session, authLoading, navigate, from]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            navigate(from, { replace: true });
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'azure') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
        }
    };

    return (
        <div className="flex min-h-screen animate-fade-up">
            {/* Left Panel — Dark Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#0f0f0f] relative overflow-hidden">
                {/* Grid Pattern BG */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="relative z-10">
                    <div className="flex items-center gap-2.5">
                        <Key className="h-6 w-6 text-white" strokeWidth={1.5} />
                        <span className="font-serif text-2xl text-white tracking-tight">Licensly</span>
                    </div>
                </div>
                <div className="relative z-10">
                    <h1 className="font-serif text-[40px] text-white leading-tight tracking-tight">
                        Take control of every<br />SaaS license across<br />your organization.
                    </h1>
                    <p className="mt-4 text-[var(--sidebar-muted)] text-[16px] max-w-md">
                        AI-powered license management for modern teams. Optimize spend, ensure compliance, and gain full visibility.
                    </p>
                </div>
                <div className="relative z-10">
                    <p className="text-[var(--sidebar-muted)] text-[13px]">&copy; 2026 Licensly. All rights reserved.</p>
                </div>
            </div>

            {/* Right Panel — Clean White Form */}
            <div className="flex flex-1 items-center justify-center bg-[var(--bg-primary)] p-8">
                <div className="w-full max-w-[400px]">
                    {/* Mobile Logo */}
                    <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                        <Key className="h-5 w-5 text-[var(--text-primary)]" strokeWidth={1.5} />
                        <span className="font-serif text-xl text-[var(--text-primary)] tracking-tight">Licensly</span>
                    </div>

                    <div className="space-y-1.5 mb-8">
                        <h2 className="font-serif text-[24px] text-[var(--text-primary)] tracking-tight">Sign in</h2>
                        <p className="text-[14px] text-[var(--text-muted)]">
                            Enter your credentials to access your dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-[var(--text-primary)]" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="flex h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[14px] transition-all outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-[var(--text-primary)]" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="flex h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[14px] transition-all outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full h-10 rounded-[6px] text-[14px]" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-[var(--border)]" />
                            </div>
                            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                                <span className="bg-[var(--bg-primary)] px-3 text-[var(--text-muted)]">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className="h-10 rounded-[6px] text-[14px]" onClick={() => handleOAuthLogin('google')}>
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Google
                            </Button>
                            <Button type="button" variant="outline" className="h-10 rounded-[6px] text-[14px]" onClick={() => handleOAuthLogin('azure')}>
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                                </svg>
                                Microsoft
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
