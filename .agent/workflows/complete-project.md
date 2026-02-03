---
description: Comprehensive workflow to complete unimplemented features in SPTS
---

// turbo-all
## Task 1: Dashboard Data Integration
1. Connect `DefaultDashboardContent.js` and `SudoDashboardContent.js` to real data.
2. Use `odRequestService` and `eventService` to fetch counts for:
   - Total Events
   - My Submissions
   - Pending Approvals
   - Total Students/Faculty

## Task 2: OD Request Lifecycle
1. Implement `CreateODModal.js` in `src/components/pages/`.
   - Form fields: Event Selection, Date Range, Reason, Attachments.
   - Integration with `createODRequest` in `odRequestService.js`.
2. Implement `ODDetailsModal.js` to view request details, status logs, and attachments.
3. Hook up the "View" button in `SubmissionsPageContent.js`.

## Task 3: Management Features
1. Implement `AddStudentModal` and `AddFacultyModal`.
2. Implement Search and Filter synchronization with the backend in `StudentsPageContent.js` and `FacultyPageContent.js`.
3. Connectivity for "Edit" actions in the tables.

## Task 4: Bulk Import & Exports
1. Functionalize `ImportPageContent.js` to handle CSV parsing and batch calls to `createStudent`/`createFaculty`.
2. Implement CSV export for all tables.

## Task 5: Reports & Analytics
1. Replace static cards in `ReportsPageContent.js` with dynamic counts.
2. Implement basic chart visualizations (e.g., using CSS bars or lightweight SVG charts).

## Task 6: Cleanup & Refinement
1. Ensure `AuthContext` provides all necessary user metadata (roles, department, etc.).
2. Final visual polish for consistency with the premium design theme.
