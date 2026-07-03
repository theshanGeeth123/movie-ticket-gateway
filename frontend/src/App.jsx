import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import PublicOnlyRoute from "./components/routes/PublicOnlyRoute";
import DashboardRedirect from "./pages/shared/DashboardRedirect";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import VerifyResetOtpPage from "./pages/auth/VerifyResetOtpPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

import HomePage from "./pages/public/HomePage";
import MoviesPage from "./pages/public/MoviesPage";
import MovieDetailsPage from "./pages/public/MovieDetailsPage";
import BookingPage from "./pages/customer/BookingPage";
import PaymentPage from "./pages/customer/PaymentPage";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminMoviesPage from "./pages/admin/AdminMoviesPage";
import AdminHallsPage from "./pages/admin/AdminHallsPage";
import AdminShowtimesPage from "./pages/admin/AdminShowtimesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";

import CustomerDashboardPage from "./pages/customer/CustomerDashboardPage";
import StaffDashboardPage from "./pages/staff/StaffDashboardPage";
import StaffVerifyPage from "./pages/staff/StaffVerifyPage";
import StaffShowtimesPage from "./pages/staff/StaffShowtimesPage";

import BookingsPage from "./pages/shared/BookingsPage";
import TicketsPage from "./pages/shared/TicketsPage";
import TicketDetailPage from "./pages/shared/TicketDetailPage";

import CustomerShowtimesPage from "./pages/customer/CustomerShowtimesPage";

const App = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/movies" element={<MoviesPage />} />
      <Route path="/movies/:id" element={<MovieDetailsPage />} />
    </Route>

    <Route element={<PublicOnlyRoute />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="/tickets/:id" element={<DashboardLayout />}>
        <Route index element={<TicketDetailPage />} />
      </Route>
      <Route path="/tickets/booking/:bookingId" element={<DashboardLayout />}>
        <Route index element={<TicketDetailPage byBooking />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
      <Route path="/book/:showtimeId" element={<BookingPage />} />
      <Route path="/payment/:bookingId" element={<PaymentPage />} />
      <Route path="/customer" element={<DashboardLayout />}>
        <Route path="dashboard" element={<CustomerDashboardPage />} />
        <Route path="bookings" element={<BookingsPage scope="customer" />} />
        <Route path="tickets" element={<TicketsPage scope="customer" />} />
        <Route path="/customer" element={<DashboardLayout />}></Route>
        <Route path="showtimes" element={<CustomerShowtimesPage />} />
      </Route>
      
    </Route>

    <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
      <Route path="/admin" element={<DashboardLayout />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="movies" element={<AdminMoviesPage />} />
        <Route path="halls" element={<AdminHallsPage />} />
        <Route path="showtimes" element={<AdminShowtimesPage />} />
        <Route path="bookings" element={<BookingsPage scope="admin" />} />
        <Route path="tickets" element={<TicketsPage scope="admin" />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
      <Route path="/staff" element={<DashboardLayout />}>
        <Route path="dashboard" element={<StaffDashboardPage />} />
        <Route path="showtimes" element={<StaffShowtimesPage />} />
        <Route path="verify" element={<StaffVerifyPage />} />
        <Route path="tickets" element={<TicketsPage scope="staff" />} />
        <Route path="bookings" element={<BookingsPage scope="staff" />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
