import { useState } from "react";
import { useBeverage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, LineChart, Line 
} from "recharts";
import { AlertTriangle, Trash2, Plus, DollarSign, Users, Package, CheckCircle, Coffee, Zap, Droplets, Wine, Beer, Milk } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminDashboard() {
  const { 
    products, transactions, users, 
    addProduct, removeProduct, updateProductPrice, resetMonth,
    getUserBalance, clearUserTransactions
  } = useBeverage();

  const [newProduct, setNewProduct] = useState({ name: "", price: "", type: "other" as const, icon: "Coffee" });
  
  const availableIcons = [
    { value: "Coffee", label: "Café", icon: Coffee },
    { value: "Zap", label: "Energético", icon: Zap },
    { value: "Droplets", label: "Refrigerante", icon: Droplets },
    { value: "Beer", label: "Cerveja", icon: Beer },
    { value: "Wine", label: "Vinho", icon: Wine },
    { value: "Milk", label: "Leite/Suco", icon: Milk },
  ];

  // Stats Calculations
  const totalRevenue = transactions.reduce((sum, t) => sum + t.price, 0);
  const totalItems = transactions.length;
  
  // Ranking Data
  const userRanking = users.map(user => {
    const userTx = transactions.filter(t => t.userId === user.id);
    return {
      name: user.name,
      count: userTx.length,
      spent: userTx.reduce((sum, t) => sum + t.price, 0)
    };
  }).sort((a, b) => b.count - a.count).slice(0, 5);

  // Preference Data
  const typeStats = transactions.reduce((acc, t) => {
    const product = products.find(p => p.id === t.productId);
    const type = product ? product.type : "other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Monster', value: typeStats['monster'] || 0, color: 'var(--color-monster)' },
    { name: 'Coca Zero', value: typeStats['coke'] || 0, color: 'var(--color-coke)' },
    { name: 'Outros', value: typeStats['other'] || 0, color: 'hsl(var(--muted-foreground))' },
  ].filter(d => d.value > 0);

  // Peak Hours Data
  const hourStats = transactions.reduce((acc, t) => {
    const hour = new Date(t.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lineData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}h`,
    count: hourStats[i] || 0
  }));

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.name && newProduct.price) {
      addProduct({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        type: newProduct.type,
        icon: newProduct.icon
      });
      setNewProduct({ name: "", price: "", type: "other", icon: "Coffee" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Painel de Controle</h1>
          <p className="text-muted-foreground">Gestão financeira e de estoque.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <AlertTriangle className="mr-2 w-4 h-4" />
              Zerar Mês (Novo Ciclo)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso arquivará todas as transações do mês atual e zerará os saldos devedores.
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={resetMonth}>Sim, iniciar novo mês</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Previsto para dia 5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Bebidas consumidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="users">Usuários e Dívidas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Consumidores</CardTitle>
                <CardDescription>Quem bebe mais?</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userRanking} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fill: 'hsl(var(--foreground))'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferência</CardTitle>
                <CardDescription>Monster vs Coca Zero</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                       itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Horários de Pico</CardTitle>
                <CardDescription>Quando a sede bate?</CardDescription>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <XAxis dataKey="hour" tick={{fill: 'hsl(var(--muted-foreground))'}} />
                    <YAxis tick={{fill: 'hsl(var(--muted-foreground))'}} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                       itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Produtos</CardTitle>
              <CardDescription>Adicione itens ou altere preços.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  {products.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{product.type}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`price-${product.id}`} className="sr-only">Preço</Label>
                          <span className="text-muted-foreground">R$</span>
                          <Input 
                            id={`price-${product.id}`}
                            type="number" 
                            className="w-24 h-8 text-right font-mono"
                            value={product.price}
                            onChange={(e) => updateProductPrice(product.id, parseFloat(e.target.value))}
                            step="0.50"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium mb-4">Adicionar Novo Produto</h3>
                  <form onSubmit={handleAddProduct} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Nome</Label>
                      <Input 
                        placeholder="Nome do Produto (ex: Red Bull)" 
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      />
                    </div>
                    <div className="w-32 space-y-2">
                       <Label>Preço</Label>
                      <Input 
                        type="number" 
                        placeholder="Preço" 
                        step="0.50"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      />
                    </div>
                    <div className="w-40 space-y-2">
                      <Label>Ícone</Label>
                      <Select 
                        value={newProduct.icon} 
                        onValueChange={(val) => setNewProduct({...newProduct, icon: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ícone" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableIcons.map((iconOption) => (
                            <SelectItem key={iconOption.value} value={iconOption.value}>
                              <div className="flex items-center gap-2">
                                <iconOption.icon className="w-4 h-4" />
                                <span>{iconOption.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit">
                      <Plus className="w-4 h-4 mr-2" /> Adicionar
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Dívidas</CardTitle>
              <CardDescription>Valores a receber por usuário.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map(user => {
                  const debt = getUserBalance(user.id);
                  if (debt === 0) return null;
                  return (
                    <div key={user.id} className="flex justify-between items-center p-3 border-b last:border-0">
                      <span className="font-medium">{user.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-red-400">R$ {debt.toFixed(2)}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-green-500 border-green-500/20 hover:bg-green-500/10 hover:text-green-600">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Pago
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Confirmar que <strong>{user.name}</strong> pagou o valor de <strong>R$ {debt.toFixed(2)}</strong>?
                                <br />
                                O saldo devedor deste usuário será zerado.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => clearUserTransactions(user.id)}>Confirmar Pagamento</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
                {users.every(u => getUserBalance(u.id) === 0) && (
                   <div className="text-center text-muted-foreground py-8">Nenhuma dívida pendente.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
