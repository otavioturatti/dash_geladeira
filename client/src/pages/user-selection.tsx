import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useBeverage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";

export default function UserSelection() {
  const [, setLocation] = useLocation();
  const { users, loginUser, currentUser } = useBeverage();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Redirecionar automaticamente se já tiver usuário logado
  useEffect(() => {
    if (currentUser) {
      setLocation(`/dashboard/${currentUser.id}`);
    }
  }, [currentUser, setLocation]);

  const handleLogin = () => {
    if (selectedUserId) {
      loginUser(parseInt(selectedUserId));
      setLocation(`/dashboard/${selectedUserId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
      <div className="text-center space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-display font-bold tracking-tighter"
        >
          QUEM É <span className="text-primary">VOCÊ?</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-lg"
        >
          Identifique-se para registrar seu consumo.
        </motion.p>
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Selecionar Usuário</CardTitle>
            <CardDescription>
              Escolha seu nome na lista abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue placeholder="Selecione seu nome..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="w-full h-12 text-lg font-display tracking-wide"
                onClick={handleLogin}
                disabled={!selectedUserId}
              >
                ACESSAR <LogIn className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
