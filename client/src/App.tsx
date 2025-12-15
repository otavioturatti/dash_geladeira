import { Switch, Route } from "wouter";
import { BeverageProvider } from "@/lib/store";
import Layout from "@/components/layout";
import PinLogin from "@/pages/pin-login";
import ResetPin from "@/pages/reset-pin";
import UserDashboard from "@/pages/user-dashboard";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={PinLogin} />
        <Route path="/reset-pin/:userId" component={ResetPin} />
        <Route path="/dashboard" component={UserDashboard} />
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
