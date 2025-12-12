import { useState } from "react";
import { useLocation } from "wouter";
import { useBeverage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { loginAdmin } = useBeverage();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await loginAdmin(password);
    if (success) {
      setLocation("/admin/dashboard");
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <CardTitle>Área Administrativa</CardTitle>
          <CardDescription>Acesso restrito ao gestor da geladeira.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha de Acesso</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={error ? "border-destructive" : ""}
                placeholder="••••••••"
                autoFocus
              />
              {error && <p className="text-xs text-destructive">Senha incorreta.</p>}
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mt-4">
                Dica: a senha é <span className="font-mono">admin123</span>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
