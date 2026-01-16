import {
    Home,
    HelpCircleIcon,
    Tag,
    Users,
    Building2,
    Briefcase,
    FileText,
    Blocks,
    Repeat,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { NavUser } from "./nav-user";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { useAuthStore } from "@/store/auth";
import { VERSION } from "../version";
import { useLocalizedTranslation } from "@/hooks/useTranslation";

import { OrganizationSwitcher } from "./organization-switcher";
import { useOrganizationStore } from "@/store/organization";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const user = useAuthStore((state) => state.user);
    const { currentOrganization, organizations } = useOrganizationStore();
    const { t } = useLocalizedTranslation();

    const slug = currentOrganization?.slug || organizations?.[0]?.organization?.slug;
    const prefix = slug ? `/${slug}` : "";

    const data = {
        user: {
            name: "shadcn",
            email: "m@example.com",
            avatar: "/avatars/shadcn.jpg",
        },
        navMain: [
            {
                title: t("navigation.home", "Home"),
                url: `${prefix}`,
                icon: Home,
            },
            {
                title: t("clients.title", "Clients"),
                url: `${prefix}/clients`,
                icon: Briefcase,
                createUrl: `${prefix}/clients/new`,
            },
            {
                title: t("catalog_item.title", "Catalog Items"),
                url: `${prefix}/catalog-items`,
                icon: Tag,
                createUrl: `${prefix}/catalog-items/new`,
            },
            {
                title: t("invoice.title", "Invoices"),
                url: `${prefix}/invoices`,
                icon: FileText,
                createUrl: `${prefix}/invoices/new`,
            },
            {
                title: t("invoice.recurring_title", "Recurring Invoices"),
                url: `${prefix}/recurring-invoices`,
                icon: Repeat,
                createUrl: `${prefix}/recurring-invoices/new`,
            },
        ],
        navSecondary: [
            {
                title: "Get Help",
                url: "https://docs.vigi.run",
                icon: HelpCircleIcon,
                target: "_blank",
            },
        ],
    };

    const menuItems = [
        {
            title: t("navigation.members"),
            url: `${prefix}/settings/members`,
            icon: Users,
        },
        {
            title: t("navigation.organization_settings"),
            url: `${prefix}/settings/organization`,
            icon: Building2,
        },
        {
            title: t("navigation.integrations", "Integrations"),
            url: `${prefix}/settings/integrations`,
            icon: Blocks,
        },
    ]

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <OrganizationSwitcher />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavSecondary items={data.navSecondary} className="mt-auto">
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                                <Link to={item.url}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </NavSecondary>
                <div className="text-xs text-muted-foreground w-full mb-2 select-none px-4">
                    v{VERSION}
                </div>
            </SidebarContent>

            <SidebarFooter>
                {user && (
                    <NavUser
                        user={{
                            name: user.name || user.email!, // Use name if available
                            email: user.email!,
                            avatar: user.imageUrl, // Pass avatar url
                        }}
                    />
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
