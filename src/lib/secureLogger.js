/**
 * Secure Logging Utility
 * 
 * Prevents sensitive data from being logged in production environments.
 * All logs are gated behind NODE_ENV checks.
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Masks sensitive data for logging
 * @param {string} data - Sensitive data to mask
 * @param {number} visibleChars - Number of characters to show at start/end
 * @returns {string} Masked string
 */
function maskSensitiveData(data, visibleChars = 2) {
    if (!data || typeof data !== 'string') return '[REDACTED]';
    if (data.length <= visibleChars * 2) return '[REDACTED]';
    
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    return `${start}***${end}`;
}

/**
 * Masks email addresses for logging
 * @param {string} email - Email to mask
 * @returns {string} Masked email
 */
function maskEmail(email) {
    if (!email || typeof email !== 'string') return '[REDACTED]';
    
    const [localPart, domain] = email.split('@');
    if (!domain) return '[REDACTED]';
    
    const maskedLocal = localPart.length > 2 
        ? `${localPart[0]}***${localPart[localPart.length - 1]}`
        : '***';
    
    return `${maskedLocal}@${domain}`;
}

/**
 * Safe console.log - only logs in development
 */
export const secureLog = {
    info: (...args) => {
        if (isDevelopment) {
            console.log('[INFO]', ...args);
        }
    },
    
    warn: (...args) => {
        if (isDevelopment) {
            console.warn('[WARN]', ...args);
        }
    },
    
    error: (...args) => {
        // Always log errors, but sanitize sensitive data
        if (isDevelopment) {
            console.error('[ERROR]', ...args);
        } else {
            // In production, log only error messages without sensitive details
            const sanitized = args.map(arg => {
                if (arg instanceof Error) {
                    return { message: arg.message, name: arg.name };
                }
                if (typeof arg === 'object') {
                    return '[OBJECT]';
                }
                return arg;
            });
            console.error('[ERROR]', ...sanitized);
        }
    },
    
    debug: (...args) => {
        if (isDevelopment) {
            console.debug('[DEBUG]', ...args);
        }
    },
    
    /**
     * Log with masked email
     */
    emailLog: (message, email) => {
        if (isDevelopment) {
            console.log(`[INFO] ${message}:`, email);
        } else {
            // In production, mask the email
            console.log(`[INFO] ${message}:`, maskEmail(email));
        }
    },
    
    /**
     * Log with masked user ID
     */
    userIdLog: (message, userId) => {
        if (isDevelopment) {
            console.log(`[INFO] ${message}:`, userId);
        } else {
            console.log(`[INFO] ${message}:`, maskSensitiveData(userId, 3));
        }
    },
    
    /**
     * Log authentication events (always logged but sanitized in production)
     */
    authEvent: (event, details = {}) => {
        if (isDevelopment) {
            console.log('[AUTH]', event, details);
        } else {
            // In production, log only non-sensitive details
            const sanitized = {
                event,
                timestamp: new Date().toISOString(),
                // Only include non-sensitive metadata
                ...(details.role && { role: details.role }),
                ...(details.success !== undefined && { success: details.success }),
            };
            console.log('[AUTH]', sanitized);
        }
    }
};

/**
 * Utility functions for masking
 */
export const maskUtils = {
    email: maskEmail,
    userId: (id) => maskSensitiveData(id, 3),
    generic: maskSensitiveData,
};

export default secureLog;
