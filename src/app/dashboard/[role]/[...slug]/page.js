import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { validRoles } from "@/lib/sidebarConfig";
import { getPageConfig, getAllStaticParams } from "@/lib/pageConfig";
import {
    EventsPageContent,
    SubmissionsPageContent,
    ApprovalsPageContent,
    StudentsPageContent,
    FacultyPageContent,
    SettingsPageContent,
    DepartmentsPageContent,
    ImportPageContent
} from "@/components/pages";

// Required for static export - generates all sub-pages at build time
export function generateStaticParams() {
    return getAllStaticParams();
}

export default async function CatchAllPage({ params }) {
    // Next.js 15 requires awaiting params
    const { role, slug } = await params;

    // Validate role
    if (!validRoles.includes(role)) {
        notFound();
    }

    // Join slug array to form the path
    const slugPath = Array.isArray(slug) ? slug.join("/") : slug;

    // Get page config for this route
    const pageInfo = getPageConfig(role, slugPath);

    // If no config found, show 404
    if (!pageInfo) {
        notFound();
    }

    // Determine which content component to render
    const renderContent = () => {
        // Match base slug (e.g., 'events' in 'sudo/events')
        const baseSlug = Array.isArray(slug) ? slug[0] : slug;

        switch (baseSlug) {
            case "events":
                return <EventsPageContent role={role} />;
            case "submissions":
                return <SubmissionsPageContent role={role} />;
            case "approvals":
                return <ApprovalsPageContent role={role} />;
            case "students":
                return <StudentsPageContent role={role} />;
            case "faculty":
                return <FacultyPageContent role={role} />;
            case "admins":
                return <FacultyPageContent role={role} filterRole="admin" />;
            case "settings":
                return <SettingsPageContent role={role} />;
            case "departments":
            case "department":
            case "class":
                return <DepartmentsPageContent role={role} />;
            case "import":
                return <ImportPageContent role={role} />;
            default:
                return (
                    <PlaceholderPage
                        title={pageInfo.title}
                        description={pageInfo.description}
                        icon={pageInfo.icon}
                    />
                );
        }
    };

    return (
        <DashboardLayout role={role} title={pageInfo.title}>
            {renderContent()}
        </DashboardLayout>
    );
}
