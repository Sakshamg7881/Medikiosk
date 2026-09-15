import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, Phone, ArrowLeft, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { MediKioskLogo } from '@/components/common/MediKioskLogo';
import { loginDoctor, DEFAULT_DEMO_DOCTOR } from '@/lib/doctorAuth';

export function DoctorLogin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!phone.trim()) {
      setErrorMessage('Please enter your doctor registered phone number.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const result = await loginDoctor(phone, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/doctor/dashboard');
    } else {
      setErrorMessage(result.error);
    }
  };

  const fillDemoCredentials = () => {
    setPhone(DEFAULT_DEMO_DOCTOR.phone);
    setPassword(DEFAULT_DEMO_DOCTOR.password);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <MediKioskLogo size="md" showSubtitle={true} subtitle="Doctor Consultation Portal" asLink={true} to="/" />

          <Link to="/provider/login">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Provider Gateway</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <Card className="border-border shadow-xs">
          <CardHeader className="space-y-2 pb-4 text-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Badge variant="outline" className="text-[11px] font-mono">
                Doctor Portal
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Demo Auth
              </Badge>
            </div>
            <CardTitle className="font-serif text-2xl font-bold">
              Doctor Consultation Login
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your doctor phone number and credentials assigned by your clinic administrator.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  Doctor Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="e.g. 9876500001"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    Password
                  </label>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full font-semibold mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Login to Doctor Workspace'}
                {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>

              <Separator className="my-2" />

              {/* Demo Quick Fill Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillDemoCredentials}
                className="w-full text-xs gap-1.5 border-dashed border-primary/40 hover:bg-primary/5 text-primary"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Fill Demo Doctor Credentials ({DEFAULT_DEMO_DOCTOR.phone})</span>
              </Button>
            </CardContent>
          </form>

          <CardFooter className="pt-0 flex flex-col space-y-3">
            <div className="p-3 rounded-md bg-muted/40 border border-border/80 text-[11px] text-muted-foreground text-center w-full">
              <span className="font-semibold text-foreground">Note:</span> Doctor accounts are created by the clinic administrator. Contact your clinic administrator if you do not have an account.
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
              <span>Are you a clinic administrator?</span>
              <Link to="/clinic/login" className="text-primary font-semibold hover:underline">
                Clinic Login
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Security & Access Notice */}
        <div className="mt-6 p-4 rounded-md bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 text-secondary shrink-0" />
          <span>
            Authorized clinical practitioners only. All case reviews and clinical notes are logged with provider timestamps.
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <MediKioskLogo size="sm" showSubtitle={false} asLink={true} to="/" />
          <p>MediKiosk Clinical Intake System • Healthcare Provider Gateway</p>
        </div>
      </footer>
    </div>
  );
}

export default DoctorLogin;
