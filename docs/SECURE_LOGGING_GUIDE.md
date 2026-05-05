# Secure Logging - Quick Reference Guide

## Import

```javascript
import { secureLog } from '@/lib/secureLogger';
```

## Basic Usage

### Info Logging
```javascript
// ✅ Safe - No sensitive data
secureLog.info('User logged in successfully');
secureLog.info('Processing request', requestId);
```

### Warning Logging
```javascript
// ✅ Safe - Generic warnings
secureLog.warn('Rate limit approaching');
secureLog.warn('Cache miss detected');
```

### Error Logging
```javascript
// ✅ Safe - Sanitized in production
secureLog.error('Database connection failed', error);
secureLog.error('Validation error', validationError);
```

### Debug Logging
```javascript
// ✅ Only logs in development
secureLog.debug('Variable state:', someVariable);
secureLog.debug('Function called with params:', params);
```

## Sensitive Data Logging

### Email Addresses
```javascript
// ✅ Auto-masked in production
secureLog.emailLog('Processing user', 'user@example.com');
// Dev:  [INFO] Processing user: user@example.com
// Prod: [INFO] Processing user: u***r@example.com
```

### User IDs
```javascript
// ✅ Auto-masked in production
secureLog.userIdLog('User action', userId);
// Dev:  [INFO] User action: abc123xyz789
// Prod: [INFO] User action: abc***789
```

### Authentication Events
```javascript
// ✅ Sanitized in production
secureLog.authEvent('login', { 
    role: 'student', 
    success: true 
});
// Dev:  [AUTH] login { role: 'student', success: true, email: '...' }
// Prod: [AUTH] { event: 'login', timestamp: '...', role: 'student', success: true }
```

## What NOT to Log

```javascript
// ❌ NEVER log these directly
console.log('Password:', password);           // ❌ Credentials
console.log('API Key:', apiKey);              // ❌ Secrets
console.log('Session Token:', token);         // ❌ Tokens
console.log('Credit Card:', cardNumber);      // ❌ Financial data
console.log('SSN:', ssn);                     // ❌ PII
console.log('Full User Object:', user);       // ❌ May contain PII
```

## Migration Checklist

Replace all instances of:

```javascript
// Before (Vulnerable)
console.log('User email:', email);
console.error('Error:', error);
console.warn('Warning:', message);

// After (Secure)
secureLog.emailLog('User email', email);
secureLog.error('Error:', error);
secureLog.warn('Warning:', message);
```

## Environment Behavior

| Method | Development | Production |
|--------|-------------|------------|
| `secureLog.info()` | ✅ Logs | ❌ Silent |
| `secureLog.warn()` | ✅ Logs | ❌ Silent |
| `secureLog.error()` | ✅ Full details | ⚠️ Sanitized |
| `secureLog.debug()` | ✅ Logs | ❌ Silent |
| `secureLog.emailLog()` | ✅ Full email | ⚠️ Masked |
| `secureLog.userIdLog()` | ✅ Full ID | ⚠️ Masked |
| `secureLog.authEvent()` | ✅ Full details | ⚠️ Sanitized |

## Common Patterns

### Service Layer
```javascript
export async function getUserData(userId) {
    try {
        secureLog.info('Fetching user data');
        const user = await db.getUser(userId);
        return user;
    } catch (error) {
        secureLog.error('Failed to fetch user data', error);
        throw error;
    }
}
```

### Authentication
```javascript
export async function login(email, password) {
    try {
        secureLog.emailLog('Login attempt', email);
        const result = await authenticate(email, password);
        secureLog.authEvent('login', { success: true, role: result.role });
        return result;
    } catch (error) {
        secureLog.authEvent('login', { success: false });
        secureLog.error('Login failed', error);
        throw error;
    }
}
```

### Data Processing
```javascript
export async function processStudentData(studentId) {
    secureLog.info('Processing student data');
    
    try {
        const student = await getStudent(studentId);
        secureLog.debug('Student record retrieved'); // No PII
        
        // Process data...
        
        secureLog.info('Student data processed successfully');
        return result;
    } catch (error) {
        secureLog.error('Student data processing failed', error);
        throw error;
    }
}
```

## Testing Your Logs

### Development Test
```bash
NODE_ENV=development npm run dev
# Should see detailed logs
```

### Production Test
```bash
NODE_ENV=production npm start
# Should see minimal/masked logs
```

## Quick Tips

1. **Default to secureLog**: Always use `secureLog` instead of `console`
2. **No PII**: Never log personally identifiable information directly
3. **Use Specific Methods**: Use `emailLog`, `userIdLog` for sensitive data
4. **Error Context**: Log error context, not sensitive data
5. **Audit Events**: Use `authEvent` for authentication/authorization logs

## Need Help?

- Check: `SECURITY_FIX_LOGGING.md` for detailed documentation
- Contact: Development team for questions
- Report: Security issues immediately

---

**Remember**: When in doubt, don't log it! 🔒
