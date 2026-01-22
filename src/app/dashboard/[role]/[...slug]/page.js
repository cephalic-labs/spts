import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { validRoles } from "@/lib/sidebarConfig";
import { getPageConfig, getAllStaticParams } from "@/lib/pageConfig";

// Required for static export - generates all sub-pages at build time
export function generateStaticParams() {
    return getAllStaticParams();
}

export default function CatchAllPage({ params }) {
    const { role, slug } = params;

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

    return (
        <DashboardLayout role={role} title={pageInfo.title}>
            <PlaceholderPage
                title={pageInfo.title}
                description={pageInfo.description}
                icon={pageInfo.icon}
            />
        </DashboardLayout>
    );
}
