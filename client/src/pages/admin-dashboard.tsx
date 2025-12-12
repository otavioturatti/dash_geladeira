import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { AlertTriangle, Trash2, Plus, DollarSign, Users, Package, CheckCircle, Coffee, Zap, Droplets, Wine, Beer, Milk, UserPlus, Calendar, Pencil, X, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type ProductType = "monster" | "coke" | "other";

export default function AdminDashboard() {
  const {
    products, transactions, users,
    addProduct, removeProduct, updateProduct, updateProductPrice, resetMonth,
    getUserBalance, clearUserTransactions, createUser, updateUser, deleteUser,
    purchaseHistory, availableMonths, getPurchaseHistoryByMonth
  } = useBeverage();

  const [newProduct, setNewProduct] = useState({ name: "", price: "", type: "other" as const, icon: "Coffee", borderColor: "#22c55e" });
  const [newUserName, setNewUserName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editProductData, setEditProductData] = useState<{ name: string; type: ProductType; icon: string; borderColor: string }>({ name: "", type: "other", icon: "Coffee", borderColor: "#22c55e" });
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editUserName, setEditUserName] = useState("");

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
        icon: newProduct.icon,
        borderColor: newProduct.borderColor
      });
      setNewProduct({ name: "", price: "", type: "other", icon: "Coffee", borderColor: "#22c55e" });
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      createUser(newUserName.trim());
      setNewUserName("");
    }
  };

  const startEditProduct = (product: typeof products[0]) => {
    setEditingProduct(product.id);
    setEditProductData({
      name: product.name,
      type: product.type,
      icon: product.icon || "Coffee",
      borderColor: product.borderColor || "#22c55e"
    });
  };

  const saveEditProduct = () => {
    if (editingProduct && editProductData.name.trim()) {
      updateProduct(editingProduct, editProductData);
      setEditingProduct(null);
    }
  };

  const cancelEditProduct = () => {
    setEditingProduct(null);
  };

  const startEditUser = (user: typeof users[0]) => {
    setEditingUser(user.id);
    setEditUserName(user.name);
  };

  const saveEditUser = () => {
    if (editingUser && editUserName.trim()) {
      updateUser(editingUser, editUserName.trim());
      setEditingUser(null);
    }
  };

  const cancelEditUser = () => {
    setEditingUser(null);
  };

  const formatMonthLabel = (month: string) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  const filteredHistory = useMemo(() => {
    if (selectedMonth === "all") return purchaseHistory;
    return getPurchaseHistoryByMonth(selectedMonth);
  }, [selectedMonth, purchaseHistory, getPurchaseHistoryByMonth]);

  const historyTotalByUser = useMemo(() => {
    const totals: Record<string, { name: string; total: number; count: number }> = {};
    filteredHistory.forEach(h => {
      if (!totals[h.userId]) {
        totals[h.userId] = { name: h.userName, total: 0, count: 0 };
      }
      totals[h.userId].total += h.price;
      totals[h.userId].count += 1;
    });
    return Object.values(totals).sort((a, b) => b.total - a.total);
  }, [filteredHistory]);

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
          <TabsTrigger value="history">Histórico</TabsTrigger>
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
                      {editingProduct === product.id ? (
                        <>
                          <div className="flex-1 flex flex-wrap gap-3 items-center">
                            <Input
                              value={editProductData.name}
                              onChange={(e) => setEditProductData({...editProductData, name: e.target.value})}
                              className="w-40 h-8"
                              placeholder="Nome"
                            />
                            <Select
                              value={editProductData.type}
                              onValueChange={(val: ProductType) => setEditProductData({...editProductData, type: val})}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monster">Monster</SelectItem>
                                <SelectItem value="coke">Coca</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={editProductData.icon}
                              onValueChange={(val) => setEditProductData({...editProductData, icon: val})}
                            >
                              <SelectTrigger className="w-36 h-8">
                                <SelectValue />
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
                            <input
                              type="color"
                              value={editProductData.borderColor}
                              onChange={(e) => setEditProductData({...editProductData, borderColor: e.target.value})}
                              className="w-10 h-8 rounded cursor-pointer border border-border"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" className="text-green-500 hover:text-green-600" onClick={saveEditProduct}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={cancelEditProduct}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: product.borderColor || '#6b7280' }}
                            />
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground capitalize">{product.type}</div>
                            </div>
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
                              className="text-muted-foreground hover:text-primary"
                              onClick={() => startEditProduct(product)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir <strong>{product.name}</strong>?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => removeProduct(product.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
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
                    <div className="space-y-2">
                      <Label>Cor da Borda</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newProduct.borderColor}
                          onChange={(e) => setNewProduct({...newProduct, borderColor: e.target.value})}
                          className="w-12 h-10 rounded cursor-pointer border border-border"
                        />
                      </div>
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

        <TabsContent value="users" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Membro</CardTitle>
              <CardDescription>Cadastre novos membros no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Nome do Membro</Label>
                  <Input
                    placeholder="Ex: João Silva"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={!newUserName.trim()}>
                  <UserPlus className="w-4 h-4 mr-2" /> Adicionar
                </Button>
              </form>

              {users.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Membros cadastrados ({users.length})</h4>
                  <div className="space-y-2">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        {editingUser === user.id ? (
                          <>
                            <Input
                              value={editUserName}
                              onChange={(e) => setEditUserName(e.target.value)}
                              className="flex-1 h-8 mr-2"
                              placeholder="Nome do membro"
                            />
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600" onClick={saveEditUser}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={cancelEditUser}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">{user.name}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => startEditUser(user)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Membro</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir <strong>{user.name}</strong>?
                                      Todas as transações deste usuário serão mantidas no histórico.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteUser(user.id)}>Excluir</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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

        <TabsContent value="history" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Histórico de Compras
              </CardTitle>
              <CardDescription>Todas as compras registradas (não afeta saldo devedor)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Label className="mb-2 block">Filtrar por mês</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={month}>
                        {formatMonthLabel(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {historyTotalByUser.length > 0 && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">Resumo por Usuário</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {historyTotalByUser.map((u, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-background rounded">
                        <span className="font-medium">{u.name}</span>
                        <div className="text-right">
                          <span className="font-mono text-primary">R$ {u.total.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground ml-2">({u.count} itens)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-between">
                    <span className="font-bold">Total Geral</span>
                    <span className="font-mono font-bold text-primary">
                      R$ {filteredHistory.reduce((sum, h) => sum + h.price, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {filteredHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">Nenhum histórico de compras.</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredHistory.slice(0, 100).map((h) => (
                    <div key={h.id} className="flex justify-between items-center p-3 border-b last:border-0">
                      <div className="flex flex-col">
                        <span className="font-medium">{h.userName}</span>
                        <span className="text-sm text-muted-foreground">{h.productName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(h.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <span className="font-mono">R$ {h.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {filteredHistory.length > 100 && (
                    <p className="text-center text-muted-foreground text-sm py-2">
                      Mostrando 100 de {filteredHistory.length} registros
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
