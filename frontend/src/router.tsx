import { createHashRouter } from 'react-router-dom'
import { CalcWizardProvider } from '@/lib/calcWizard'

// Public
import HomePage from '@/pages/public/HomePage'
import HowItWorksPage from '@/pages/public/HowItWorksPage'
import FaqPage from '@/pages/public/FaqPage'

// Calc
import CalcPage from '@/pages/calc/CalcPage'
import ResultsPage from '@/pages/calc/ResultsPage'
import SavePage from '@/pages/calc/SavePage'

// Auth
import LoginPage from '@/pages/auth/LoginPage'
import ForgotPage from '@/pages/auth/ForgotPage'
import LogoutPage from '@/pages/auth/LogoutPage'
import SignUpPage from '@/pages/auth/SignUpPage'

// Legal pages
import PrivacyPage from '@/pages/legal/PrivacyPage'
import CookiePage from '@/pages/legal/CookiePage'
import TermsPage from '@/pages/legal/TermsPage'
import KfsPage from '@/pages/legal/KfsPage'
import ComplaintsPage from '@/pages/legal/ComplaintsPage'

// Circle join (public)
import CircleJoinPage from '@/pages/circle/join/JoinPage'

// Staff join (public)
import StaffJoinPage from '@/pages/staff/join/JoinPage'

// Client portal
import ClientLayout from '@/pages/client/ClientLayout'
import ClientDashboard from '@/pages/client/DashboardPage'
import ClientDocuments from '@/pages/client/DocumentsPage'
import ClientProperty from '@/pages/client/PropertyPage'
import ClientTimeline from '@/pages/client/TimelinePage'
import ClientProfile from '@/pages/client/ProfilePage'

// Circle portal
import CircleLayout from '@/pages/circle/CircleLayout'
import CircleDashboard from '@/pages/circle/DashboardPage'
import CircleOpportunities from '@/pages/circle/OpportunitiesPage'
import CircleDacDetail from '@/pages/circle/DacDetailPage'
import CirclePortfolio from '@/pages/circle/PortfolioPage'
import CircleSubscriptionDetail from '@/pages/circle/SubscriptionDetailPage'
import CircleDocuments from '@/pages/circle/DocumentsPage'
import CircleProfile from '@/pages/circle/ProfilePage'

// Staff portal — layout
import StaffLayout from '@/pages/staff/StaffLayout'

// Staff portal — core
import OverviewPage from '@/pages/staff/overview/OverviewPage'
import QueuePage from '@/pages/staff/queue/QueuePage'
import StaffProfilePage from '@/pages/staff/profile/ProfilePage'

// Staff portal — prospects (Phase 1)
import ProspectsPage from '@/pages/staff/prospects/ProspectsPage'
import ProspectDetailPage from '@/pages/staff/prospects/ProspectDetailPage'

// Staff portal — clients (Phase 2+3)
import ClientsPage from '@/pages/staff/clients/ClientsPage'
import StaffClientDetailPage from '@/pages/staff/clients/ClientDetailPage'

// Staff portal — circle CRM
import StaffCircleList from '@/pages/staff/circle/CircleListPage'
import StaffCircleNew from '@/pages/staff/circle/CircleMemberNewPage'
import StaffCircleDetail from '@/pages/staff/circle/CircleMemberDetailPage'

// Staff portal — DACs
import DacListPage from '@/pages/staff/dacs/DacListPage'
import DacNewPage from '@/pages/staff/dacs/DacNewPage'
import StaffDacDetail from '@/pages/staff/dacs/DacDetailPage'

// Staff portal — team management
import TeamListPage from '@/pages/staff/team/TeamListPage'
import TeamNewPage from '@/pages/staff/team/TeamNewPage'
import TeamDetailPage from '@/pages/staff/team/TeamDetailPage'

export const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/how-it-works', element: <HowItWorksPage /> },
  { path: '/faq', element: <FaqPage /> },
  {
    path: '/calc',
    element: <CalcWizardProvider />,
    children: [
      { index: true, element: <CalcPage /> },
      { path: 'results', element: <ResultsPage /> },
      { path: 'save', element: <SavePage /> },
    ],
  },
  { path: '/auth/login', element: <LoginPage /> },
  { path: '/auth/forgot', element: <ForgotPage /> },
  { path: '/auth/logout', element: <LogoutPage /> },
  { path: '/auth/signup', element: <SignUpPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/cookies', element: <CookiePage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/kfs', element: <KfsPage /> },
  { path: '/complaints', element: <ComplaintsPage /> },
  { path: '/circle/join', element: <CircleJoinPage /> },
  { path: '/staff/join', element: <StaffJoinPage /> },
  {
    path: '/app/client',
    element: <ClientLayout />,
    children: [
      { index: true, element: <ClientDashboard /> },
      { path: 'documents', element: <ClientDocuments /> },
      { path: 'property', element: <ClientProperty /> },
      { path: 'timeline', element: <ClientTimeline /> },
      { path: 'profile', element: <ClientProfile /> },
    ],
  },
  {
    path: '/app/circle',
    element: <CircleLayout />,
    children: [
      { index: true, element: <CircleDashboard /> },
      { path: 'opportunities', element: <CircleOpportunities /> },
      { path: 'opportunities/:dacId', element: <CircleDacDetail /> },
      { path: 'portfolio', element: <CirclePortfolio /> },
      { path: 'portfolio/:subscriptionId', element: <CircleSubscriptionDetail /> },
      { path: 'documents', element: <CircleDocuments /> },
      { path: 'profile', element: <CircleProfile /> },
    ],
  },
  {
    path: '/app/staff',
    element: <StaffLayout />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'queue', element: <QueuePage /> },
      { path: 'prospects', element: <ProspectsPage /> },
      { path: 'prospects/:id', element: <ProspectDetailPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <StaffClientDetailPage /> },
      { path: 'circle', element: <StaffCircleList /> },
      { path: 'circle/new', element: <StaffCircleNew /> },
      { path: 'circle/:id', element: <StaffCircleDetail /> },
      { path: 'dacs', element: <DacListPage /> },
      { path: 'dacs/new', element: <DacNewPage /> },
      { path: 'dacs/:id', element: <StaffDacDetail /> },
      { path: 'team', element: <TeamListPage /> },
      { path: 'team/new', element: <TeamNewPage /> },
      { path: 'team/:id', element: <TeamDetailPage /> },
      { path: 'profile', element: <StaffProfilePage /> },
    ],
  },
])
