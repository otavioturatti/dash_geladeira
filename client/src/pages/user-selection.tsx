import { useState } from "react";
import { useLocation } from "wouter";
import { useBeverage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { UserPlus, LogIn } from "lucide-react";

export default function UserSelection() {
  const [, setLocation] = useLocation();
  const { users, loginUser, createUser } = useBeverage();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [newUserName, setNewUserName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleLogin = () => {
    if (selectedUserId) {
      loginUser(parseInt(selectedUserId));
      setLocation(`/dashboard/${selectedUserId}`);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      createUser(newUserName.trim());
      // createUser updates currentUser automatically, but we need to redirect manually based on the new user list logic or just let the user pick their name now.
      // Actually store updates state, simpler to just switch back to list or auto-login.
      // For simplicity, let's reset view and let them pick (or we could auto-login).
      setIsCreating(false);
      setNewUserName("");
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
            <CardTitle>{isCreating ? "Novo Perfil" : "Selecionar Usuário"}</CardTitle>
            <CardDescription>
              {isCreating 
                ? "Digite seu nome para começar." 
                : "Escolha seu nome na lista abaixo."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCreating ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Seu Nome</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Ana Silva" 
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreating(false)}>
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={!newUserName.trim()}>
                    Criar <UserPlus className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </form>
            ) : (
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou
                    </span>
                  </div>
                </div>

                <Button variant="secondary" className="w-full" onClick={() => setIsCreating(true)}>
                  Criar Novo Perfil
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
