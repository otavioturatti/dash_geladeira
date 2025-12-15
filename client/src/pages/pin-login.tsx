import { useState } from "react";
import { useLocation } from "wouter";
import { useBeverage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";

export default function PinLogin() {
  const [, setLocation] = useLocation();
  const { loginUserWithPin } = useBeverage();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length !== 4) {
      setError("PIN deve ter 4 dígitos");
      return;
    }

    setLoading(true);
    setError("");

    const result = await loginUserWithPin(pin);

    setLoading(false);

    if (result.success && result.user) {
      if (result.mustResetPin) {
        setLocation(`/reset-pin/${result.user.id}`);
      } else {
        setLocation("/dashboard");
      }
    } else {
      setError(result.message || "PIN inválido");
      setPin("");
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
    setError("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle>Entrar com PIN</CardTitle>
          <CardDescription>Digite seu PIN de 4 dígitos para acessar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={handlePinChange}
                className={error ? "border-destructive text-center text-2xl tracking-[0.5em]" : "text-center text-2xl tracking-[0.5em]"}
                placeholder="••••"
                autoFocus
                maxLength={4}
              />
              {error && <p className="text-xs text-destructive text-center">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading || pin.length !== 4}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mt-4">
                Primeiro acesso? Seu PIN inicial é <span className="font-mono">0000</span>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
