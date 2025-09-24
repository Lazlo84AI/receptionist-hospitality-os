import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [hierarchy, setHierarchy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message === 'Invalid login credentials') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(error.message);
      }
    } else {
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    // Debug: vérifier les valeurs avant envoi
    const metadata = {
      full_name: `${firstName} ${lastName}`.trim(),
      first_name: firstName,
      last_name: lastName,
      job_role: jobRole,
      hierarchy: hierarchy
    };
    
    console.log('Form data:', {
      email,
      firstName,
      lastName,
      jobRole,
      hierarchy,
      metadata
    });
    
    const { error } = await signUp(email, password, metadata);
    
    if (error) {
      console.error('SignUp error received:', error);
      if (error.message === 'User already registered') {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(error.message);
      }
    } else {
      setMessage('Account created successfully! You can now sign in.');
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetMessage('');
    
    // Detect current environment and set appropriate redirect URL
    const currentOrigin = window.location.origin; // http://localhost:8080 or https://vercel.app
    const redirectUrl = `${currentOrigin}/reset-password`;
    
    console.log('🔄 Reset password request from:', currentOrigin);
    console.log('📧 Email will redirect to:', redirectUrl);
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: redirectUrl
    });
    
    if (error) {
      setResetError(error.message);
    } else {
      setResetMessage('Password reset email sent! Please check your inbox.');
      setResetEmail('');
    }
    
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#1E1A37' }}>
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        
        {/* Logo Decœur Hotels - Côté Gauche */}
        <div className="flex-1 flex justify-center">
          <div className="w-96 h-96 lg:w-[48rem] lg:h-[48rem]">
            <img 
              src="/LOGO_DECOEUR_Gold.svg" 
              alt="Decœur Hotels Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        
        {/* Module de Login - Côté Droit */}
        <div className="flex-1 flex justify-center w-full">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-3xl decoeur-title text-hotel-navy mb-2">
                SOKLE
              </CardTitle>
              <CardDescription className="decoeur-body text-hotel-navy/70">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="hotel-hover"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="hotel-hover"
                    required
                  />
                  <div className="flex justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-sm text-primary hover:underline hover:text-hotel-yellow transition-colors duration-300"
                        >
                          Forgot your password?
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Reset Password</DialogTitle>
                          <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="Enter your email"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              className="hotel-hover"
                              required
                            />
                          </div>
                          {resetError && (
                            <Alert variant="destructive">
                              <AlertDescription>{resetError}</AlertDescription>
                            </Alert>
                          )}
                          {resetMessage && (
                            <Alert>
                              <AlertDescription>{resetMessage}</AlertDescription>
                            </Alert>
                          )}
                          <Button type="submit" className="w-full gold-metallic-gradient text-hotel-navy hover:shadow-xl border border-hotel-gold-dark/30 shadow-lg" disabled={resetLoading}>
                            {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reset Password
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full gold-metallic-gradient text-hotel-navy hover:shadow-xl border border-hotel-gold-dark/30 shadow-lg" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="job-role">What's your role</Label>
                  <Select value={jobRole} onValueChange={setJobRole} required>
                    <SelectTrigger className="hotel-hover">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Receptionist">Receptionist</SelectItem>
                      <SelectItem value="Director">Director</SelectItem>
                      <SelectItem value="Housekeeping Supervisor">Housekeeping Supervisor</SelectItem>
                      <SelectItem value="Room Attendant">Room Attendant</SelectItem>
                      <SelectItem value="Restaurant staff">Restaurant staff</SelectItem>
                      <SelectItem value="Tech maintenance team">Tech maintenance team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hierarchy">Hierarchy</Label>
                  <Select value={hierarchy} onValueChange={setHierarchy} required>
                    <SelectTrigger className="hotel-hover">
                      <SelectValue placeholder="Select your hierarchy level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Collaborator">Collaborator</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="hotel-hover"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="hotel-hover"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="hotel-hover"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="hotel-hover"
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {message && (
                  <Alert>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full gold-metallic-gradient text-hotel-navy hover:shadow-xl border border-hotel-gold-dark/30 shadow-lg" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;