import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useBeverage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";

export default function ResetPin() {
  const [, params] = useRoute("/reset-pin/:userId");
  const [, setLocation] = useLocation();
  const { resetUserPin } = useBeverage();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = params?.userId ? parseInt(params.userId) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      setError("Usuário inválido");
      return;
    }

    if (newPin.length !== 4) {
      setError("PIN deve ter 4 dígitos");
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError("PIN deve conter apenas números");
      return;
    }

    if (newPin === "0000") {
      setError("PIN não pode ser 0000");
      return;
    }

    if (newPin !== confirmPin) {
      setError("Os PINs não coincidem");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetUserPin(userId, newPin);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao resetar PIN");
      setLoading(false);
    }
  };

  const handlePinChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setter(value);
    setError("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-destructive/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4 text-destructive">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <CardTitle>Resetar PIN</CardTitle>
          <CardDescription>
            Por segurança, você deve alterar seu PIN padrão antes de continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPin">Novo PIN (4 dígitos)</Label>
              <Input
                id="newPin"
                type="password"
                inputMode="numeric"
                value={newPin}
                onChange={handlePinChange(setNewPin)}
                className="text-center text-2xl tracking-[0.5em]"
                placeholder="••••"
                autoFocus
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirmar PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={handlePinChange(setConfirmPin)}
                className="text-center text-2xl tracking-[0.5em]"
                placeholder="••••"
                maxLength={4}
              />
            </div>
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}>
              {loading ? "Resetando..." : "Confirmar Novo PIN"}
            </Button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mt-4">
                Escolha um PIN fácil de lembrar, mas diferente de 0000
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
