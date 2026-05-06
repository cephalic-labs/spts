# Security Fix: Authorization Bypass on OD Approval Actions

## Vulnerability Description

**Issue**: Authorization Bypass on Approval Actions  
**Severity**: High  
**Location**: `src/lib/services/odRequestService.js` - `approveODRequest()` and `rejectODRequest()`

### The Problem

The original implementation accepted `approverId` as a parameter from the client side. This created a critical security vulnerability where:

1. A malicious user could intercept the approval request
2. Modify the `approverId` parameter to any faculty ID
3. Approve/reject OD requests they were not assigned to
4. Bypass the entire approval workflow hierarchy

**Example Attack**:
```javascript
// Malicious user could call:
await approveODRequest(odId, "hod", userId, "Approved", "any-faculty-id-here");
// Even if they're not the assigned HOD
```

## Solution Implemented

### 1. Server Actions with Server-Side Validation

Created new secure server actions in `src/actions/odApproval.js`:
- `approveODRequestSecure()`
- `rejectODRequestSecure()`

These functions:
- Run exclusively on the server (marked with `"use server"`)
- Resolve the approver's faculty ID from the authenticated session
- Validate that the approver is actually assigned to the request
- Never trust client-provided approver IDs

### 2. Key Security Improvements

**Before** (Vulnerable):
```javascript
// Client passes approverId - can be manipulated
await approveODRequest(odId, role, userId, remarks, approverId);
```

**After** (Secure):
```javascript
// Server resolves faculty ID from authenticated session
const faculty = await getFacultyByAppwriteUserId(userId);
const facultyIds = [faculty.faculty_id, faculty.$id].filter(Boolean);

// Verify assignment
const assignedApproverId = odRequest[`${role}_id`];
if (assignedApproverId && !facultyIds.includes(assignedApproverId)) {
    throw new Error("You are not assigned as the approver for this request.");
}
```

### 3. Validation Flow

```
Client Request
    ↓
Server Action (approveODRequestSecure)
    ↓
Fetch Faculty Record from DB using authenticated userId
    ↓
Verify faculty exists
    ↓
Get OD Request
    ↓
Verify role can approve current status
    ↓
Verify faculty is assigned as approver for this role
    ↓
Process approval
    ↓
Return result
```

## Files Modified

1. **Created**: `src/actions/odApproval.js`
   - New secure server actions
   - Server-side approver validation
   - No client-controlled parameters for authorization

2. **Updated**: `src/components/pages/ApprovalsPageContent.js`
   - Replaced `approveODRequest()` with `approveODRequestSecure()`
   - Replaced `rejectODRequest()` with `rejectODRequestSecure()`
   - Removed client-side `approverId` parameter

3. **Updated**: `src/lib/services/odRequestService.js`
   - Added deprecation warnings to old functions
   - Documented that they should only be used server-side

## Testing Recommendations

### 1. Positive Tests
- ✅ Assigned mentor can approve pending_mentor requests
- ✅ Assigned advisor can approve pending_advisor requests
- ✅ Assigned coordinator can approve pending_coordinator requests
- ✅ Assigned HOD can approve pending_hod requests
- ✅ Rejection with valid reason works

### 2. Negative Tests (Should Fail)
- ❌ Faculty not assigned to request cannot approve
- ❌ Faculty with wrong role cannot approve
- ❌ Approval without valid session fails
- ❌ Rejection without reason fails
- ❌ Manipulated faculty ID in request is ignored

### 3. Manual Testing Steps

```bash
# 1. Login as a mentor assigned to a student
# 2. Try to approve an OD request assigned to you
# Expected: Success

# 3. Try to approve an OD request NOT assigned to you
# Expected: Error "You are not assigned as the approver for this request."

# 4. Try to manipulate the request in browser DevTools
# Expected: Server-side validation prevents unauthorized approval
```

## Additional Security Considerations

### Current Implementation
- ✅ Server-side validation of approver identity
- ✅ Role-based access control
- ✅ Assignment verification
- ✅ Audit logging of all actions

### Future Enhancements
1. **Rate Limiting**: Add rate limiting to prevent approval spam
2. **IP Logging**: Log IP addresses for approval actions
3. **Two-Factor Auth**: Require 2FA for HOD-level approvals
4. **Approval Windows**: Restrict approvals to business hours
5. **Notification System**: Alert admins of suspicious approval patterns

## Rollback Plan

If issues arise, you can temporarily:
1. Keep the new server actions
2. Add additional logging
3. Monitor for false positives
4. Adjust validation logic if needed

The old functions remain in place (deprecated) for backward compatibility with any server-side code that may use them.

## Compliance Notes

This fix addresses:
- **OWASP A01:2021** - Broken Access Control
- **CWE-639** - Authorization Bypass Through User-Controlled Key
- **OWASP A07:2021** - Identification and Authentication Failures

## Questions or Issues?

Contact the development team:
- [Saumyajit Purakayastha](https://github.com/agspades)
- [Shankar L](https://github.com/Shankar-CSE)
