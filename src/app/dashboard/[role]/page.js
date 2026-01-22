import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { SudoDashboardContent, DefaultDashboardContent } from "@/components/dashboards";
import { validRoles, getPortalTitle } from "@/lib/sidebarConfig";

// Required for static export - generates all role pages at build time
export function generateStaticParams() {
    return validRoles.map((role) => ({
        role: role,
    }));
}

export default function RoleDashboardPage({ params }) {
    const { role } = params;

    // Validate role
    if (!validRoles.includes(role)) {
        notFound();
    }

    // Get title for this role's dashboard
    const title = getPortalTitle(role);

    // Render role-specific dashboard content
    const getDashboardContent = () => {
        switch (role) {
            case "sudo":
                return <SudoDashboardContent />;
            default:
                return <DefaultDashboardContent role={role} />;
        }
    };

    return (
        <DashboardLayout role={role} title={title}>
            {getDashboardContent()}
        </DashboardLayout>
    );
}
