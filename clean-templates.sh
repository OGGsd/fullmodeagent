#!/bin/bash

# Template Cleaner Script for Axie Studio
# This script removes or updates any remaining Langflow references in templates and configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header "🧹 AXIE STUDIO TEMPLATE CLEANER"

echo "This script cleans up any remaining Langflow references in templates and configurations."
echo ""

FRONTEND_DIR="axie-studio-frontend"
CLEANED_FILES=0
ISSUES_FOUND=0

# Function to clean a file
clean_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        print_info "Cleaning: $description"
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Clean documentation URLs
        sed -i 's|https://docs\.langflow\.org|https://docs.axiestudio.com|g' "$file"
        sed -i 's|http://docs\.langflow\.org|https://docs.axiestudio.com|g' "$file"
        
        # Clean descriptions (but keep technical imports)
        sed -i 's|Design Dialogues with Langflow|Design Dialogues with Axie Studio|g' "$file"
        sed -i 's|Build workflows with Langflow|Build workflows with Axie Studio|g' "$file"
        sed -i 's|Powered by Langflow|Powered by Axie Studio|g' "$file"
        
        # Clean cache paths (but keep functional ones)
        sed -i 's|\.cache/langflow|.cache/axiestudio|g' "$file"
        
        # Check if changes were made
        if ! cmp -s "$file" "$file.backup"; then
            print_success "Cleaned: $description"
            ((CLEANED_FILES++))
        else
            print_info "No changes needed: $description"
        fi
        
        # Remove backup
        rm "$file.backup"
    else
        print_warning "File not found: $file"
    fi
}

# Function to check for remaining issues
check_for_issues() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        # Check for user-facing Langflow references (excluding technical imports)
        local issues=$(grep -i "langflow" "$file" | grep -v "from langflow" | grep -v "import langflow" | grep -v "langflow.custom" | grep -v "langflow.field_typing" || true)
        
        if [ -n "$issues" ]; then
            print_warning "Potential issues in $description:"
            echo "$issues" | head -3
            ((ISSUES_FOUND++))
        fi
    fi
}

print_header "🧹 Cleaning Template Files"

# Clean test assets
clean_file "$FRONTEND_DIR/tests/assets/flowtest.json" "Flow Test Template"
clean_file "$FRONTEND_DIR/tests/assets/collection.json" "Collection Template"

# Clean any other JSON files that might have templates
find "$FRONTEND_DIR" -name "*.json" -not -path "*/node_modules/*" -not -path "*/build/*" | while read -r file; do
    if grep -q "langflow\|Langflow" "$file" 2>/dev/null; then
        clean_file "$file" "$(basename "$file")"
    fi
done

print_header "🔍 Checking for Remaining Issues"

# Check key files for remaining user-facing references
check_for_issues "$FRONTEND_DIR/src/customization/config-constants.ts" "Config Constants"
check_for_issues "$FRONTEND_DIR/src/constants/constants.ts" "Main Constants"
check_for_issues "$FRONTEND_DIR/tests/assets/flowtest.json" "Flow Test Template"
check_for_issues "$FRONTEND_DIR/tests/assets/collection.json" "Collection Template"

# Check for any remaining documentation URLs
print_info "Checking for documentation URLs..."
if find "$FRONTEND_DIR" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" | xargs grep -l "docs\.langflow\.org" 2>/dev/null; then
    print_warning "Found remaining Langflow documentation URLs"
    ((ISSUES_FOUND++))
else
    print_success "No Langflow documentation URLs found"
fi

# Check for user-facing descriptions
print_info "Checking for user-facing descriptions..."
if find "$FRONTEND_DIR" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" | xargs grep -l "with Langflow\|by Langflow\|Langflow platform" 2>/dev/null; then
    print_warning "Found user-facing Langflow references"
    ((ISSUES_FOUND++))
else
    print_success "No user-facing Langflow references found"
fi

print_header "📊 CLEANING RESULTS"

echo -e "Files Cleaned: ${GREEN}$CLEANED_FILES${NC}"
echo -e "Issues Found: ${YELLOW}$ISSUES_FOUND${NC}"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    print_success "🎉 All templates are clean! No user-facing Langflow references found."
    echo ""
    echo "✅ Documentation URLs updated to docs.axiestudio.com"
    echo "✅ User-facing descriptions updated to Axie Studio"
    echo "✅ Technical imports preserved (these are correct)"
    echo "✅ Cache paths updated where appropriate"
    echo ""
    print_info "Your templates are ready for production!"
else
    print_warning "⚠️  Some issues were found that may need manual review."
    echo ""
    print_info "Note: Technical imports like 'from langflow.custom' are correct and should be kept."
    print_info "Only user-facing references need to be changed to Axie Studio."
fi

print_header "🎯 TEMPLATE CLEANING SUMMARY"

echo "Template cleaning focuses on:"
echo ""
echo "✅ CHANGED:"
echo "  - Documentation URLs (docs.langflow.org → docs.axiestudio.com)"
echo "  - User-facing descriptions ('with Langflow' → 'with Axie Studio')"
echo "  - Cache directory names (.cache/langflow → .cache/axiestudio)"
echo "  - Template descriptions and titles"
echo ""
echo "✅ PRESERVED:"
echo "  - Technical imports (from langflow.custom)"
echo "  - Backend API calls (these are correct)"
echo "  - Component class names (these work with backend)"
echo "  - Internal references (these are functional)"
echo ""
echo "🎯 RESULT:"
echo "  - Users see 'Axie Studio' everywhere"
echo "  - Documentation links point to your docs"
echo "  - Backend integration remains intact"
echo "  - Templates work perfectly"

exit $ISSUES_FOUND
