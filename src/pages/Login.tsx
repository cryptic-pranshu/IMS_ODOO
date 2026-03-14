import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Warehouse, Mail, Lock, ArrowRight } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('admin@ims.com');
  const [password, setPassword] = useState('admin');
  const [isSignup, setIsSignup] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { login } = useInventoryStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error('Invalid credentials');
    }
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true);
      toast.success('OTP sent to ' + email);
    } else if (otp === '1234') {
      toast.success('Password reset successful');
      setShowReset(false);
      setOtpSent(false);
      setOtp('');
    } else {
      toast.error('Invalid OTP. Try 1234');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <Warehouse className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">IMS Pro</h1>
          <p className="text-sm text-muted-foreground mt-1">Inventory Management System</p>
        </div>

        <div className="glass-card rounded-lg p-6">
          {showReset ? (
            <form onSubmit={handleReset} className="space-y-4">
              <h2 className="text-sm font-medium text-foreground">Reset Password</h2>
              <div>
                <Label>Email</Label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} className="pl-9" type="email" required />
                </div>
              </div>
              {otpSent && (
                <div>
                  <Label>OTP Code</Label>
                  <Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP (try 1234)" className="font-mono" />
                </div>
              )}
              <Button type="submit" className="w-full">{otpSent ? 'Verify OTP' : 'Send OTP'}</Button>
              <button type="button" onClick={() => { setShowReset(false); setOtpSent(false); }} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-sm font-medium text-foreground">{isSignup ? 'Create Account' : 'Sign In'}</h2>
              <div>
                <Label>Email</Label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} className="pl-9" type="email" required />
                </div>
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={password} onChange={e => setPassword(e.target.value)} className="pl-9" type="password" required />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {isSignup ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <div className="flex justify-between text-xs">
                <button type="button" onClick={() => setShowReset(true)} className="text-muted-foreground hover:text-foreground transition-colors">Forgot password?</button>
                <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-primary hover:underline">
                  {isSignup ? 'Sign in instead' : 'Create account'}
                </button>
              </div>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">Demo: any email + 4+ char password</p>
      </div>
    </div>
  );
}
