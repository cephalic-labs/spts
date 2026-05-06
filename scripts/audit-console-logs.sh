#!/bin/bash

# Console Log Audit Script
# Finds all console.* statements in server-side code

echo "🔍 Auditing console statements in server-side code..."
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Directories to check (server-side code)
DIRS=(
    "src/actions"
    "src/lib/services"
    "src/lib/server"
    "src/app/api"
)

total_issues=0

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${YELLOW}Checking $dir...${NC}"
        
        # Find all console statements
        results=$(grep -rn "console\." "$dir" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null)
        
        if [ -n "$results" ]; then
            count=$(echo "$results" | wc -l)
            total_issues=$((total_issues + count))
            
            echo -e "${RED}Found $count console statement(s):${NC}"
            echo "$results" | while IFS= read -r line; do
                echo "  ⚠️  $line"
            done
            echo ""
        else
            echo -e "${GREEN}✓ No console statements found${NC}"
            echo ""
        fi
    fi
done

echo "=================================================="
if [ $total_issues -eq 0 ]; then
    echo -e "${GREEN}✅ Audit complete: No issues found!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Audit complete: Found $total_issues console statement(s)${NC}"
    echo ""
    echo "Recommendations:"
    echo "1. Replace console.log with secureLog.info"
    echo "2. Replace console.error with secureLog.error"
    echo "3. Replace console.warn with secureLog.warn"
    echo "4. Use secureLog.emailLog for emails"
    echo "5. Use secureLog.userIdLog for user IDs"
    echo ""
    echo "See docs/SECURE_LOGGING_GUIDE.md for details"
    exit 1
fi
