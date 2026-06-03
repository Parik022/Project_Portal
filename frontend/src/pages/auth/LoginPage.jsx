import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[44%] flex-col justify-between bg-primary p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(242,184,36,0.15),transparent_50%)]" />
        <div className="relative">
          <img src="/srm-logo-seal-sm.png" alt="" className="h-20 w-20 drop-shadow-md" />
        </div>
        <div className="relative space-y-4">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Faculty Project Portal
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-white/80">
            Manage projects, teams, weekly reports, and attendance — aligned with SRMIST Academia.
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
            Learn · Leap · Lead
          </p>
        </div>
        <p className="relative text-xs text-white/50">
          SRM Institute of Science and Technology
        </p>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="border-b border-border bg-white px-6 py-5 lg:hidden">
          <img
            src="/srm-logo-full.png"
            alt="SRMIST"
            className="mx-auto h-12 w-auto object-contain"
          />
        </div>

        <div className="flex flex-1 items-center justify-center page-shell p-6">
          <Card className="w-full max-w-[400px] border-border/90 shadow-[var(--shadow-card-hover)]">
            <CardHeader className="space-y-1 border-b border-border bg-accent-soft/40 pb-5 text-center">
              <CardTitle className="text-xl text-primary">Sign in</CardTitle>
              <CardDescription>Use your SRMIST email credentials</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email / NetID</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@srmist.edu.in"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in…" : "Login"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted">
                New here?{" "}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  Create account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
