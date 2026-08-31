import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import EnhancedAdminDashboard from "./pages/admin/enhanced-dashboard";
import Members from "./pages/members/member";
import Signup from "./pages/auth/signup";
import Login from "./pages/auth/login";
import ForgotEmail from "./pages/auth/forgot-email";
import ForgotNoEmail from "./pages/auth/forgot-no-email";
import ResetPassword from "./pages/auth/reset-password";
import AddMember from "./pages/members/add";
import UserApprovals from "./pages/admin/user-approvals";
import SupportTickets from "./pages/admin/support-tickets";
import EditMember from "./pages/members/edit";
import SearchResults from "./pages/search/search-results";
import MemberProfile from "./pages/members/profile";
import HistoricalMembers from "./pages/members/historical";
import MyProfile from "./pages/myprofile";
import RequireAuth from "./components/requireauth";
import UserManagement from "./pages/usermanagement";
import PublicDashboard from "./pages/dashboard/public";
import Settings from "./pages/settings";
import DevTools from "./components/devtools";
import PrivateDashboard from "./pages/dashboard/private";
import Support from "./pages/support";
import AppSettings from "./pages/app-settings";
import BulkImport from "./pages/admin/import";
import AccountSettings from "./pages/account-settings";
import Statistics from "./pages/members/statistics";

function App() {
  return (
    <Router basename="/membership">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<RequireAuth allowedRoles={["admin"]}><EnhancedAdminDashboard /></RequireAuth>} />
        <Route path="/dashboard/private" element={<RequireAuth allowedRoles={["private"]}><PrivateDashboard /></RequireAuth>} />
        <Route path="/admin/stats" element={<RequireAuth allowedRoles={["admin"]}><Navigate to="/dashboard" /></RequireAuth>} />
        <Route path="/admin/approvals" element={<RequireAuth allowedRoles={["admin"]}><UserApprovals /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth allowedRoles={["admin"]}><UserManagement /></RequireAuth>} />
        <Route path="/admin/support-tickets" element={<RequireAuth allowedRoles={["admin"]}><SupportTickets /></RequireAuth>} />
        <Route path="/admin/import" element={<RequireAuth allowedRoles={["admin"]}><BulkImport /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth allowedRoles={["admin"]}><Settings /></RequireAuth>} />
        <Route path="/app-settings" element={<RequireAuth allowedRoles={["private","admin","public"]}><AppSettings /></RequireAuth>} />
        <Route path="/account-settings" element={<RequireAuth allowedRoles={["admin","private","public"]}><AccountSettings /></RequireAuth>} />
        <Route path="/my-profile" element={<RequireAuth allowedRoles={["admin","private","public"]}><MyProfile /></RequireAuth>} />
        <Route path="/members" element={<RequireAuth allowedRoles={["admin","private","public"]}><Members /></RequireAuth>} />
        <Route path="/support" element={<RequireAuth allowedRoles={["admin","private"]}><Support /></RequireAuth>} />
        <Route path="/members/new" element={<RequireAuth allowedRoles={["admin"]}><AddMember /></RequireAuth>} />
        <Route path="/members/edit/:id" element={<RequireAuth allowedRoles={["admin"]}><EditMember /></RequireAuth>} />
        <Route path="/members/statistics" element={<RequireAuth allowedRoles={["admin","private","public"]}><Statistics /></RequireAuth>} />
        <Route path="/members/historical" element={<RequireAuth allowedRoles={["admin","private","public"]}><HistoricalMembers /></RequireAuth>} />
        <Route path="/members/:id" element={<RequireAuth allowedRoles={["admin","private","public"]}><MemberProfile /></RequireAuth>} />
        <Route path="/search" element={<RequireAuth allowedRoles={["admin","private","public"]}><SearchResults /></RequireAuth>} />
        <Route path="/public" element={<PublicDashboard />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password/email" element={<ForgotEmail />} />
        <Route path="/forgot-password/manual" element={<ForgotNoEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<div className="p-6">404: Page not found</div>} />
      </Routes>
      <DevTools />
    </Router>
  );
}

export default App;
