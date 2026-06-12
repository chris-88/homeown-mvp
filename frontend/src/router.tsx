import { createHashRouter } from 'react-router-dom'
import { CalcWizardProvider } from '@/lib/calcWizard'
import HomePage from '@/pages/public/HomePage'
import HowItWorksPage from '@/pages/public/HowItWorksPage'
import FaqPage from '@/pages/public/FaqPage'
import CalcPage from '@/pages/calc/CalcPage'
import ResultsPage from '@/pages/calc/ResultsPage'
import SavePage from '@/pages/calc/SavePage'
import LoginPage from '@/pages/auth/LoginPage'
import ForgotPage from '@/pages/auth/ForgotPage'
import LogoutPage from '@/pages/auth/LogoutPage'
import SignUpPage from '@/pages/auth/SignUpPage'
import JoinPage from '@/pages/circle/join/JoinPage'
import ClientLayout from '@/pages/client/ClientLayout'
import ClientDashboard from '@/pages/client/DashboardPage'
import ClientDocuments from '@/pages/client/DocumentsPage'
import ClientProperty from '@/pages/client/PropertyPage'
import ClientTimeline from '@/pages/client/TimelinePage'
import ClientProfile from '@/pages/client/ProfilePage'
import CircleLayout from '@/pages/circle/CircleLayout'
import CircleDashboard from '@/pages/circle/DashboardPage'
import CircleOpportunities from '@/pages/circle/OpportunitiesPage'
import CircleDacDetail from '@/pages/circle/DacDetailPage'
import CirclePortfolio from '@/pages/circle/PortfolioPage'
import CircleSubscriptionDetail from '@/pages/circle/SubscriptionDetailPage'
import CircleDocuments from '@/pages/circle/DocumentsPage'
import CircleProfile from '@/pages/circle/ProfilePage'
import StaffLayout from '@/pages/staff/StaffLayout'
import StaffDashboard from '@/pages/staff/DashboardPage'
import ClientListPage from '@/pages/staff/ClientListPage'
import ClientDetailPage from '@/pages/staff/ClientDetailPage'
import DocReviewPage from '@/pages/staff/DocReviewPage'
import StaffCircleList from '@/pages/staff/circle/CircleListPage'
import StaffCircleNew from '@/pages/staff/circle/CircleMemberNewPage'
import StaffCircleDetail from '@/pages/staff/circle/CircleMemberDetailPage'
import DacListPage from '@/pages/staff/dacs/DacListPage'
import DacNewPage from '@/pages/staff/dacs/DacNewPage'
import StaffDacDetail from '@/pages/staff/dacs/DacDetailPage'

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
  { path: '/circle/join', element: <JoinPage /> },
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
      { index: true, element: <StaffDashboard /> },
      { path: 'clients', element: <ClientListPage /> },
      { path: 'clients/:id', element: <ClientDetailPage /> },
      { path: 'documents', element: <DocReviewPage /> },
      { path: 'circle', element: <StaffCircleList /> },
      { path: 'circle/new', element: <StaffCircleNew /> },
      { path: 'circle/:id', element: <StaffCircleDetail /> },
      { path: 'dacs', element: <DacListPage /> },
      { path: 'dacs/new', element: <DacNewPage /> },
      { path: 'dacs/:id', element: <StaffDacDetail /> },
    ],
  },
])
