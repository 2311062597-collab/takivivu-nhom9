import ProviderRoomTypeDetailPage from './pages/provider/ProviderRoomTypeDetailPage'
import HotelProfileGate from './routes/HotelProfileGate'
import ProviderIndex from './routes/ProviderIndex'
import { Navigate, Route, Routes } from 'react-router-dom'
import GlobalValidationFeedback from './components/GlobalValidationFeedback'
import GlobalToast from './components/GlobalToast'
import PublicLayout from './layouts/PublicLayout'
import ProviderLayout from './layouts/ProviderLayout'
import AdminLayout from './layouts/AdminLayout'
import { RequireAuth, RequireProviderType, RequireRole } from './routes/Guards'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import HomePage from './pages/customer/HomePage'
import FlightsPage from './pages/customer/FlightsPage'
import FlightDetailPage from './pages/customer/FlightDetailPage'
import FlightSeatSelectionPage from './pages/customer/FlightSeatSelectionPage'
import HotelsPage from './pages/customer/HotelsPage'
import HotelDetailPage from './pages/customer/HotelDetailPage'
import HotelRoomTypeDetailPage from './pages/customer/HotelRoomTypeDetailPage'
import HotelRoomMapPage from './pages/customer/HotelRoomMapPage'
import AttractionsPage from './pages/customer/AttractionsPage'
import AttractionDetailPage from './pages/customer/AttractionDetailPage'
import BookingCreatePage from './pages/customer/BookingCreatePage'
import PaymentsPage from './pages/customer/PaymentsPage'
import BookingsPage from './pages/customer/BookingsPage'
import BookingDetailPage from './pages/customer/BookingDetailPage'
import NotificationsPage from './pages/customer/NotificationsPage'
import AiPage from './pages/customer/AiPage'
import ProfilePage from './pages/customer/ProfilePage'
import PromotionsPage from './pages/customer/PromotionsPage'
import PromotionDetailPage from './pages/customer/PromotionDetailPage'
import MyPromotionsPage from './pages/customer/MyPromotionsPage'
import ProviderDashboardPage from './pages/provider/ProviderDashboardPage'
import ProviderFlightsPage from './pages/provider/ProviderFlightsPage'
import ProviderFlightFormPage from './pages/provider/ProviderFlightFormPage'
import ProviderFlightSeatsPage from './pages/provider/ProviderFlightSeatsPage'
import ProviderHotelsPage from './pages/provider/ProviderHotelsPage'
import ProviderHotelFormPage from './pages/provider/ProviderHotelFormPage'
import ProviderRoomsPage from './pages/provider/ProviderRoomsPage'
import ProviderRoomTypesPage from './pages/provider/ProviderRoomTypesPage'
import ProviderRoomTypeFormPage from './pages/provider/ProviderRoomTypeFormPage'
import ProviderPhysicalRoomFormPage from './pages/provider/ProviderPhysicalRoomFormPage'
import ProviderRoomFormPage from './pages/provider/ProviderRoomFormPage'
import ProviderAttractionsPage from './pages/provider/ProviderAttractionsPage'
import ProviderAttractionFormPage from './pages/provider/ProviderAttractionFormPage'
import ProviderAttractionDetailPage from './pages/provider/ProviderAttractionDetailPage'
import ProviderTicketsPage from './pages/provider/ProviderTicketsPage'
import ProviderTicketFormPage from './pages/provider/ProviderTicketFormPage'
import ProviderTicketDetailPage from './pages/provider/ProviderTicketDetailPage'
import ProviderUnsupportedPage from './pages/provider/ProviderUnsupportedPage'
import ProviderOrdersPage from './pages/provider/ProviderOrdersPage'
import ProviderOrderDetailPage from './pages/provider/ProviderOrderDetailPage'
import ProviderRevenuePage from './pages/provider/ProviderRevenuePage'
import ProviderProfilePage from './pages/provider/ProviderProfilePage'
import ProviderReviewsPage from './pages/provider/ProviderReviewsPage'
import ProviderPromotionsPage from './pages/provider/ProviderPromotionsPage'
import ProviderPromotionFormPage from './pages/provider/ProviderPromotionFormPage'
import ProviderPromotionDetailPage from './pages/provider/ProviderPromotionDetailPage'
import AdminProvidersPage from './pages/admin/AdminProvidersPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'

export default function App(){return <><GlobalValidationFeedback/><GlobalToast/><Routes>
  <Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/>
  <Route element={<PublicLayout/>}>
    <Route index element={<HomePage/>}/><Route path="flights" element={<FlightsPage/>}/><Route path="flights/:id" element={<FlightDetailPage/>}/><Route path="flights/:id/seats" element={<FlightSeatSelectionPage/>}/><Route path="hotels" element={<HotelsPage/>}/><Route path="hotels/:id" element={<HotelDetailPage/>}/><Route path="hotels/:id/room-types/:roomId" element={<HotelRoomTypeDetailPage/>}/><Route path="hotels/:id/rooms-map" element={<HotelRoomMapPage/>}/><Route path="attractions" element={<AttractionsPage/>}/><Route path="attractions/:id" element={<AttractionDetailPage/>}/><Route path="promotions" element={<PromotionsPage/>}/><Route path="promotions/:id" element={<PromotionDetailPage/>}/><Route path="my-promotions" element={<MyPromotionsPage/>}/><Route path="ai" element={<AiPage/>}/>
    <Route element={<RequireAuth/>}><Route path="profile" element={<ProfilePage/>}/><Route path="notifications" element={<NotificationsPage/>}/></Route>
    <Route element={<RequireRole roles={['CUSTOMER']}/>}><Route path="booking/new" element={<BookingCreatePage/>}/><Route path="payments/new" element={<PaymentsPage/>}/><Route path="bookings" element={<BookingsPage/>}/><Route path="bookings/:id" element={<BookingDetailPage/>}/></Route>
  </Route>
  <Route element={<RequireRole roles={['PROVIDER']}/>}><Route path="provider" element={<ProviderLayout/>}><Route index element={<ProviderIndex/>}/><Route element={<RequireProviderType types={['FLIGHT']}/>}> <Route path="flights" element={<ProviderFlightsPage/>}/><Route path="flights/new" element={<ProviderFlightFormPage/>}/><Route path="flights/:id/edit" element={<ProviderFlightFormPage/>}/><Route path="flights/:id/seats" element={<ProviderFlightSeatsPage/>}/></Route><Route element={<RequireProviderType types={['HOTEL']}/>}> <Route path="hotels" element={<Navigate to="/provider/profile" replace/>}/><Route path="hotels/new" element={<Navigate to="/provider/profile" replace/>}/><Route path="hotels/:id/edit" element={<Navigate to="/provider/profile" replace/>}/><Route path="room-types" element={<ProviderRoomTypesPage/>}/><Route path="room-types/new" element={<ProviderRoomTypeFormPage/>}/><Route path="room-types/:id" element={<ProviderRoomTypeDetailPage/>}/><Route path="room-types/:id/edit" element={<ProviderRoomTypeFormPage/>}/><Route path="rooms" element={<ProviderRoomsPage/>}/><Route path="rooms/new" element={<ProviderPhysicalRoomFormPage/>}/><Route path="rooms/:id" element={<ProviderPhysicalRoomFormPage/>}/><Route path="rooms/:id/edit" element={<ProviderPhysicalRoomFormPage/>}/></Route><Route element={<RequireProviderType types={['ATTRACTION']}/>}> <Route path="attractions" element={<ProviderAttractionsPage/>}/><Route path="attractions/new" element={<ProviderAttractionFormPage/>}/><Route path="attractions/:id" element={<ProviderAttractionDetailPage/>}/><Route path="attractions/:id/edit" element={<ProviderAttractionFormPage/>}/><Route path="tickets" element={<ProviderTicketsPage/>}/><Route path="tickets/new" element={<ProviderTicketFormPage/>}/><Route path="tickets/:id" element={<ProviderTicketDetailPage/>}/><Route path="tickets/:id/edit" element={<ProviderTicketFormPage/>}/></Route><Route path="orders" element={<ProviderOrdersPage/>}/><Route path="orders/:id" element={<ProviderOrderDetailPage/>}/><Route path="promotions" element={<ProviderPromotionsPage/>}/><Route path="promotions/new" element={<ProviderPromotionFormPage/>}/><Route path="promotions/:id" element={<ProviderPromotionDetailPage/>}/><Route path="promotions/:id/edit" element={<ProviderPromotionFormPage/>}/><Route path="revenue" element={<ProviderRevenuePage/>}/><Route path="notifications" element={<NotificationsPage/>}/><Route path="profile" element={<ProviderProfilePage/>}/><Route path="reviews" element={<ProviderReviewsPage/>}/></Route></Route>
  <Route element={<RequireRole roles={['ADMIN']}/>}>
    <Route path="admin" element={<AdminLayout/>}>
      <Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<AdminDashboardPage/>}/>
      <Route path="users" element={<AdminUsersPage/>}/>
      <Route path="settings" element={<AdminSettingsPage/>}/>
      <Route path="providers" element={<AdminProvidersPage/>}/>
      <Route path="customers" element={<Navigate to="/admin/users?role=CUSTOMER" replace/>}/>
    </Route>
  </Route>
  <Route path="*" element={<Navigate to="/" replace/>}/>
</Routes></>}
