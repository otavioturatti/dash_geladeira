import { useEffect } from "react";
import { useLocation } from "wouter";
import { useBeverage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { User } from "lucide-react";

export default function UserSelection() {
  const [, setLocation] = useLocation();
  const { users, loading, currentUser } = useBeverage();

  // Redirecionar automaticamente se já tiver usuário logado
  useEffect(() => {
    if (currentUser) {
      setLocation("/dashboard");
    }
  }, [currentUser, setLocation]);

  const handleUserSelect = (userId: number) => {
    setLocation(`/login/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="text-center">
            <CardTitle>Nenhum usuário cadastrado</CardTitle>
            <CardDescription>
              Entre no painel administrativo para cadastrar usuários
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
          Identifique-se para continuar.
        </motion.p>
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <User className="w-6 h-6" />
            </div>
            <CardTitle>Selecione seu nome</CardTitle>
            <CardDescription>Clique no seu nome para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {users.map((user) => (
                <Button
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  variant="outline"
                  className="h-auto py-6 text-lg font-medium hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  {user.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
