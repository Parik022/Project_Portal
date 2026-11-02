import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, FieldError } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "BIOTECH", "Other"];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    registerNo: "",
    department: "CSE",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(null);
  const [pendingMessage, setPendingMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isStudent = form.role === "STUDENT";
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors(null);
    setLoading(true);
    try {
      const payload = { ...form, registerNo: isStudent ? form.registerNo.trim().toUpperCase() : undefined };
      const result = await register(payload);
      if (result.pendingApproval) {
        setPendingMessage(result.message);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center page-shell p-6">
      <Card className="w-full max-w-[460px] border-border/90 shadow-[var(--shadow-card-hover)]">
        <CardHeader className="border-b border-border bg-white pb-5 text-center">
          <img src="/srm-logo-full.png" alt="SRMIST" className="mx-auto mb-4 h-14 w-auto object-contain" />
          <CardTitle className="text-xl text-primary">Create account</CardTitle>
          <CardDescription>ProjectFlow · use your @srmist.edu.in email</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {pendingMessage ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="font-semibold text-foreground">Registration received</p>
              <p className="text-sm text-muted">{pendingMessage}</p>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Alert tone="error">{error && error !== "Validation failed" ? error : ""}</Alert>

              <div className="grid grid-cols-2 gap-2 rounded-lg bg-background p-1">
                {["STUDENT", "FACULTY"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm({ ...form, role })}
                    className={`rounded-md py-2 text-sm font-medium transition-colors ${
                      form.role === role ? "bg-white text-primary shadow-sm" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {role === "STUDENT" ? "Student" : "Faculty"}
                  </button>
                ))}
              </div>
              {!isStudent && (
                <Alert tone="info">Faculty accounts are activated after an admin approves them.</Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={form.name} onChange={set("name")} required />
                <FieldError errors={fieldErrors} name="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">SRM email</Label>
                <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="ab1234@srmist.edu.in" required />
                <FieldError errors={fieldErrors} name="email" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {isStudent && (
                  <div className="space-y-2">
                    <Label htmlFor="registerNo">Register number</Label>
                    <Input id="registerNo" value={form.registerNo} onChange={set("registerNo")} placeholder="RA2411030010438" required />
                    <FieldError errors={fieldErrors} name="registerNo" />
                  </div>
                )}
                <div className={`space-y-2 ${isStudent ? "" : "sm:col-span-2"}`}>
                  <Label htmlFor="department">Department</Label>
                  <Select id="department" value={form.department} onChange={set("department")}>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                  <FieldError errors={fieldErrors} name="department" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} required />
                <p className="text-xs text-muted">At least 8 characters, with a letter and a number.</p>
                <FieldError errors={fieldErrors} name="password" />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creating…" : "Create account"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-muted">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
