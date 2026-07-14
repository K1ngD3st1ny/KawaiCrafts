import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Scissors, ArrowLeft, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const [, setLocation] = useLocation();

  // Already logged in? Go home
  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Button>

        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-2">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Scissors className="h-10 w-10 text-primary rotate-45 relative" />
              </div>
              <span className="text-2xl font-heading font-bold">Kawai Craft</span>
            </div>

            <CardTitle className="text-2xl font-heading">Join KawaiCrafts</CardTitle>
            <CardDescription className="text-base mt-1">
              Create your account to start exploring beautiful anime papercraft patterns.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Google Sign-Up Button */}
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-border bg-card px-4 py-3.5 text-sm font-medium transition-all hover:bg-muted hover:border-primary/40 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="button-google-register"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Info Text */}
            <div className="mt-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Your account is created instantly via Google</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold"
                  onClick={() => setLocation("/login")}
                  data-testid="link-to-login"
                >
                  Sign in
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
