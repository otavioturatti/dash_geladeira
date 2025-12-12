import { Switch, Route } from "wouter";
import { BeverageProvider } from "@/lib/store";
import Layout from "@/components/layout";
import UserSelection from "@/pages/user-selection";
import UserDashboard from "@/pages/user-dashboard";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={UserSelection} />
        <Route path="/dashboard/:userId" component={UserDashboard} />
        <Route path="/admin" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <BeverageProvider>
      <Router />
      <Toaster />
    </BeverageProvider>
  );
}

export default App;
