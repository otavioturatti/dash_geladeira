import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useBeverage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Droplets, History, CheckCircle2, AlertCircle, Coffee, Wine, Beer, Milk, LucideIcon, LogOut, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UserDashboard() {
  const [, setLocation] = useLocation();
  const { currentUser, products, recordTransaction, getUserBalance, getUserHistory, logoutUser, getUserPurchaseHistory, availableMonths } = useBeverage();
  const [showConfetti, setShowConfetti] = useState<string | null>(null);
  const [confirmProduct, setConfirmProduct] = useState<{id: number, name: string} | null>(null);

  const handleChangeUser = () => {
    logoutUser();
    setLocation("/");
  };

  // Redirect to login if no user is logged in
  useEffect(() => {
    if (!currentUser) {
      setLocation("/");
    }
  }, [currentUser, setLocation]);

  if (!currentUser) return null;

  if (products.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Nenhum produto cadastrado</h2>
        <p className="text-muted-foreground">Entre no painel administrativo para cadastrar produtos.</p>
      </div>
    );
  }

  const handleConfirmPurchase = async () => {
    if (!currentUser || !confirmProduct) return;

    await recordTransaction(currentUser.id, confirmProduct.id);
    setShowConfetti(confirmProduct.name);
    setConfirmProduct(null);
    setTimeout(() => setShowConfetti(null), 3000);
  };

  const initiatePurchase = (id: number, name: string) => {
    setConfirmProduct({ id, name });
  };

  const balance = getUserBalance(currentUser.id);
  const history = getUserHistory(currentUser.id);
  const fullHistory = getUserPurchaseHistory(currentUser.id);

  const monsterProduct = products.find(p => p.type === "monster") || products[0];
  const cokeProduct = products.find(p => p.type === "coke") || products[1] || products[0];
  const otherProducts = products.filter(p => p.id !== monsterProduct?.id && p.id !== cokeProduct?.id);

  const iconMap: Record<string, LucideIcon> = {
    "Zap": Zap,
    "Droplets": Droplets,
    "Coffee": Coffee,
    "Wine": Wine,
    "Beer": Beer,
    "Milk": Milk
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold">Olá, <span className="text-primary">{currentUser.name}</span></h1>
            <Button variant="ghost" size="sm" onClick={handleChangeUser} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1" />
              Trocar
            </Button>
          </div>
          <p className="text-muted-foreground">O que vamos beber hoje?</p>
        </div>
        <Card className="bg-card/40 border-primary/20 backdrop-blur-md w-full md:w-auto min-w-[200px]">
          <CardContent className="p-4 flex flex-col items-center md:items-end">
            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Saldo Devedor</span>
            <span className="text-3xl font-mono font-bold text-primary">
              R$ {balance.toFixed(2).replace('.', ',')}
            </span>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Registrado! Você pegou: {showConfetti}
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!confirmProduct} onOpenChange={(open) => !open && setConfirmProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Confirmar Consumo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Você está pegando <strong>{confirmProduct?.name}</strong>.
              <br />
              Isso será adicionado ao seu saldo devedor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPurchase}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monster Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => initiatePurchase(monsterProduct.id, monsterProduct.name)}
          className="group relative overflow-hidden rounded-2xl h-64 flex flex-col items-center justify-center border-2 border-monster/50 bg-gradient-to-br from-card to-background hover:border-monster hover:shadow-[0_0_30px_-5px_hsl(var(--monster))] transition-all duration-300"
        >
          <div className="absolute inset-0 bg-monster/5 group-hover:bg-monster/10 transition-colors" />
          <Zap className="w-24 h-24 text-monster mb-4 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
          <span className="text-3xl font-display font-bold text-white z-10">{monsterProduct.name}</span>
          <span className="text-xl font-mono text-monster z-10 mt-2">R$ {monsterProduct.price.toFixed(2).replace('.', ',')}</span>
        </motion.button>

        {/* Coke Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => initiatePurchase(cokeProduct.id, cokeProduct.name)}
          className="group relative overflow-hidden rounded-2xl h-64 flex flex-col items-center justify-center border-2 border-coke/50 bg-gradient-to-br from-card to-background hover:border-coke hover:shadow-[0_0_30px_-5px_hsl(var(--coke))] transition-all duration-300"
        >
          <div className="absolute inset-0 bg-coke/5 group-hover:bg-coke/10 transition-colors" />
          <Droplets className="w-24 h-24 text-coke mb-4 drop-shadow-[0_0_10px_rgba(244,0,9,0.5)]" />
          <span className="text-3xl font-display font-bold text-white z-10">{cokeProduct.name}</span>
          <span className="text-xl font-mono text-coke z-10 mt-2">R$ {cokeProduct.price.toFixed(2).replace('.', ',')}</span>
        </motion.button>
      </div>

      {otherProducts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
          {otherProducts.map(product => {
             const IconComponent = product.icon && iconMap[product.icon] ? iconMap[product.icon] : Coffee;
             const borderColor = product.borderColor || '#6b7280';
             return (
              <Button
                key={product.id}
                variant="outline"
                className="h-24 flex flex-col gap-1 border-2 border-dashed hover:border-solid hover:bg-accent/10 transition-all"
                style={{
                  borderColor: borderColor,
                  boxShadow: `0 0 0 0 ${borderColor}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 15px -3px ${borderColor}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 0 ${borderColor}`;
                }}
                onClick={() => initiatePurchase(product.id, product.name)}
              >
                <IconComponent className="w-5 h-5 mb-1" style={{ color: borderColor }} />
                <span className="font-semibold">{product.name}</span>
                <span className="text-muted-foreground">R$ {product.price.toFixed(2).replace('.', ',')}</span>
              </Button>
            );
          })}
        </div>
      )}

      <Card className="mt-8 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Meu Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current">
            <TabsList className="mb-4">
              <TabsTrigger value="current">Saldo Atual</TabsTrigger>
              <TabsTrigger value="all">Histórico Completo</TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              {history.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum consumo registrado este mês.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((t) => (
                    <div key={t.id} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="font-medium">{t.productName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(t.timestamp), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <span className="font-mono text-sm">R$ {t.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all">
              {fullHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum histórico de compras.</p>
              ) : (
                <div className="space-y-4">
                  {fullHistory.map((h) => (
                    <div key={h.id} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="font-medium">{h.productName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(h.timestamp), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <span className="font-mono text-sm">R$ {h.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
