import { Route, Navigate } from "react-router-dom";
import MonitorsPage from "@/app/monitors/page";
import NewMonitor from "@/app/monitors/new/page";
import SettingsPage from "@/app/settings/page";
import ProxiesPage from "@/app/proxies/page";
import NewProxy from "@/app/proxies/new/page";
import NotificationChannelsPage from "@/app/notification-channels/page";
import NewNotificationChannel from "@/app/notification-channels/new/page";
import EditNotificationChannel from "@/app/notification-channels/edit/page";
import MonitorPage from "@/app/monitors/view/page";
import EditMonitor from "@/app/monitors/edit/page";
import StatusPagesPage from "@/app/status-pages/page";
import NewStatusPage from "@/app/status-pages/new/page";
import SecurityPage from "@/app/security/page";
import EditProxy from "@/app/proxies/edit/page";
import MaintenancePage from "@/app/maintenance/page";
import NewMaintenance from "@/app/maintenance/new/page";
import EditMaintenance from "@/app/maintenance/edit/page";
import EditStatusPage from "@/app/status-pages/edit/page";
import TagsPage from "@/app/tags/page";
import NewTag from "@/app/tags/new/page";
import EditTag from "@/app/tags/edit/page";
import { OrganizationLayout } from "@/components/organization-layout";
import CreateOrganizationPage from "@/app/create-organization/page";
import OrganizationSettingsPage from "@/app/organization/settings/page";
import OrganizationMembersPage from "@/app/organization/members/page";
import { RootRedirect } from "@/components/root-redirect";
import UserInvitationsPage from "@/app/user/invitations/page";
import OnboardingPage from "@/app/onboarding/page";
import ClientsPage from "@/app/clients/page";
import NewClientPage from "@/app/clients/new/page";
import EditClientPage from "@/app/clients/edit/page";
import ClientDetailsPage from "@/app/clients/view/page";
import CatalogItemsPage from "@/app/catalog-items/page";
import NewCatalogItemPage from "@/app/catalog-items/new/page";
import EditCatalogItemPage from "@/app/catalog-items/[id]/edit/page";
import CatalogItemDetailsPage from "@/app/catalog-items/[id]/view/page";
import InvoicesPage from "@/app/invoices/page";
import NewInvoicePage from "@/app/invoices/new/page";
import EditInvoicePage from "@/app/invoices/[id]/edit/page";
import InvoiceDetailsPage from "@/app/invoices/[id]/view/page";
import InvoiceEmailPage from "@/app/invoices/[id]/email/page";
import DashboardPage from "@/app/dashboard/page";
import { RequireAdmin } from "@/components/require-admin";
import { BackofficeLayout } from "@/components/backoffice-layout";
import BackofficeDashboardPage from "@/app/backoffice/page";
import BackofficeUsersPage from "@/app/backoffice/users/page";
import BackofficeOrgsPage from "@/app/backoffice/organizations/page";

export const protectedRoutes = [
    <Route key="root" path="/" element={<RootRedirect />} />,
    <Route key="onboarding" path="/onboarding" element={<OnboardingPage />} />,
    <Route key="create-organization" path="/create-organization" element={<CreateOrganizationPage />} />,
    // Account routes (Global)
    <Route key="account" path="/account" element={<OrganizationLayout isGlobal={true} />}>
        <Route path="settings" element={<SettingsPage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="invitations" element={<UserInvitationsPage />} />
    </Route>,
    <Route key="slug" path="/:slug" element={<OrganizationLayout />}>
        <Route index element={<DashboardPage />} />


        {/* Monitor routes */}
        <Route path="monitors" element={<MonitorsPage />} />
        <Route path="monitors/:id" element={<MonitorPage />} />
        <Route path="monitors/new" element={<NewMonitor />} />
        <Route path="monitors/:id/edit" element={<EditMonitor />} />

        {/* Status page routes */}
        <Route path="status-pages" element={<StatusPagesPage />} />
        <Route path="status-pages/new" element={<NewStatusPage />} />
        <Route path="status-pages/:id/edit" element={<EditStatusPage />} />

        {/* Proxy routes */}
        <Route path="proxies" element={<ProxiesPage />} />
        <Route path="proxies/new" element={<NewProxy />} />
        <Route path="proxies/:id/edit" element={<EditProxy />} />

        {/* Notification channel routes */}
        <Route path="notification-channels" element={<NotificationChannelsPage />} />
        <Route path="notification-channels/new" element={<NewNotificationChannel />} />
        <Route path="notification-channels/:id/edit" element={<EditNotificationChannel />} />

        {/* Maintenance routes */}
        <Route path="maintenances" element={<MaintenancePage />} />
        <Route path="maintenances/new" element={<NewMaintenance />} />
        <Route path="maintenances/:id/edit" element={<EditMaintenance />} />

        {/* Organization routes */}
        <Route path="settings/organization" element={<OrganizationSettingsPage />} />
        <Route path="settings/members" element={<OrganizationMembersPage />} />

        {/* Client routes */}
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<NewClientPage />} />
        <Route path="clients/:id" element={<ClientDetailsPage />} />
        <Route path="clients/:id/edit" element={<EditClientPage />} />

        {/* Catalog Item routes */}
        <Route path="catalog-items" element={<CatalogItemsPage />} />
        <Route path="catalog-items/new" element={<NewCatalogItemPage />} />
        <Route path="catalog-items/:id" element={<CatalogItemDetailsPage />} />
        <Route path="catalog-items/:id/edit" element={<EditCatalogItemPage />} />

        {/* Invoice routes */}
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/new" element={<NewInvoicePage />} />
        <Route path="invoices/:id" element={<InvoiceDetailsPage />} />
        <Route path="invoices/:id/edit" element={<EditInvoicePage />} />
        <Route path="invoices/:id/email" element={<div className="w-full"><InvoiceEmailPage /></div>} />



        {/* Tag routes */}
        <Route path="tags" element={<TagsPage />} />
        <Route path="tags/new" element={<NewTag />} />
        <Route path="tags/:id/edit" element={<EditTag />} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="" replace />} />
        <Route path="*" element={<Navigate to="monitors" replace />} />
    </Route>,

    // Backoffice routes (Global Admin)
    <Route key="backoffice" path="/backoffice" element={<RequireAdmin />}>
        <Route element={<BackofficeLayout />}>
            <Route index element={<BackofficeDashboardPage />} />
            <Route path="users" element={<BackofficeUsersPage />} />
            <Route path="organizations" element={<BackofficeOrgsPage />} />
        </Route>
    </Route>
]; 