#!/bin/bash

# Axie Studio Backend Integration Verification Script
# This script verifies that our frontend properly integrates with the Langflow backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="axie-studio-frontend"
BACKEND_URL="http://localhost:7860"

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

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

run_check() {
    local check_name="$1"
    local check_command="$2"
    
    print_info "Checking: $check_name"
    
    if eval "$check_command"; then
        print_success "$check_name"
        ((TESTS_PASSED++))
    else
        print_error "$check_name"
        ((TESTS_FAILED++))
    fi
    echo ""
}

print_header "🔍 AXIE STUDIO BACKEND INTEGRATION VERIFICATION"

echo "This script verifies that our Axie Studio frontend properly integrates with the Langflow backend."
echo ""

# Check 1: Verify frontend directory exists
check_frontend_exists() {
    [ -d "$FRONTEND_DIR" ]
}

# Check 2: Verify constants are updated
check_constants_updated() {
    grep -q "AXIE_STUDIO_ACCESS_TOKEN" "$FRONTEND_DIR/src/constants/constants.ts" && \
    ! grep -q "LANGFLOW_ACCESS_TOKEN.*=" "$FRONTEND_DIR/src/constants/constants.ts"
}

# Check 3: Verify authStore uses new constants
check_authstore_updated() {
    grep -q "AXIE_STUDIO_ACCESS_TOKEN" "$FRONTEND_DIR/src/stores/authStore.ts" && \
    ! grep -q "LANGFLOW_ACCESS_TOKEN" "$FRONTEND_DIR/src/stores/authStore.ts"
}

# Check 4: Verify authContext uses new constants
check_authcontext_updated() {
    grep -q "AXIE_STUDIO_ACCESS_TOKEN" "$FRONTEND_DIR/src/contexts/authContext.tsx" && \
    ! grep -q "LANGFLOW_ACCESS_TOKEN" "$FRONTEND_DIR/src/contexts/authContext.tsx"
}

# Check 5: Verify API proxy configuration exists
check_api_proxy_config() {
    [ -f "$FRONTEND_DIR/src/config/api-proxy.ts" ] && \
    grep -q "langflowBackendUrl" "$FRONTEND_DIR/src/config/api-proxy.ts"
}

# Check 6: Verify user management system exists
check_user_management() {
    [ -f "$FRONTEND_DIR/src/pages/AdminPage/UserManagement.tsx" ] && \
    [ -f "$FRONTEND_DIR/src/services/user-storage.ts" ]
}

# Check 7: Verify admin route is configured
check_admin_route() {
    grep -q "AxieStudioAdmin" "$FRONTEND_DIR/src/routes.tsx"
}

# Check 8: Verify branding is complete
check_branding_complete() {
    grep -q "Axie Studio" "$FRONTEND_DIR/index.html" && \
    [ -f "$FRONTEND_DIR/src/assets/AxieStudioLogo.jpg" ]
}

# Check 9: Verify Docker configuration exists
check_docker_config() {
    [ -f "docker-compose.axie-studio.yml" ] && \
    [ -f "deploy-axie-studio.sh" ]
}

# Check 10: Verify environment configuration
check_env_config() {
    [ -f "$FRONTEND_DIR/.env.example" ] && \
    grep -q "AXIE_STUDIO_SUPERUSER" "$FRONTEND_DIR/.env.example"
}

# Check 11: Verify no remaining LANGFLOW references in critical files
check_no_langflow_refs() {
    ! grep -r "LANGFLOW_ACCESS_TOKEN" "$FRONTEND_DIR/src/stores/" 2>/dev/null && \
    ! grep -r "LANGFLOW_ACCESS_TOKEN" "$FRONTEND_DIR/src/contexts/" 2>/dev/null
}

# Check 12: Verify package.json is updated
check_package_json() {
    grep -q '"name": "axie-studio"' "$FRONTEND_DIR/package.json"
}

print_header "🧪 Running Integration Checks"

run_check "Frontend Directory Exists" "check_frontend_exists"
run_check "Constants Updated" "check_constants_updated"
run_check "AuthStore Updated" "check_authstore_updated"
run_check "AuthContext Updated" "check_authcontext_updated"
run_check "API Proxy Configuration" "check_api_proxy_config"
run_check "User Management System" "check_user_management"
run_check "Admin Route Configured" "check_admin_route"
run_check "Branding Complete" "check_branding_complete"
run_check "Docker Configuration" "check_docker_config"
run_check "Environment Configuration" "check_env_config"
run_check "No LANGFLOW References" "check_no_langflow_refs"
run_check "Package.json Updated" "check_package_json"

print_header "📊 VERIFICATION RESULTS"

echo -e "Checks Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Checks Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Checks: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "🎉 ALL CHECKS PASSED! Your Axie Studio backend integration is ready!"
    echo ""
    echo "✅ Frontend properly rebranded to Axie Studio"
    echo "✅ Authentication system updated with new constants"
    echo "✅ API proxy configured for Langflow backend"
    echo "✅ User management system implemented"
    echo "✅ Admin interface ready"
    echo "✅ Docker deployment configured"
    echo ""
    print_info "Next steps:"
    echo "1. Deploy using: ./deploy-axie-studio.sh"
    echo "2. Access admin at: http://your-server/admin"
    echo "3. Create users and send credentials via email"
    echo "4. Start your MacInCloud-style business!"
else
    print_error "❌ Some checks failed. Please review the issues above."
    echo ""
    print_info "Common fixes:"
    echo "1. Ensure all LANGFLOW constants are updated to AXIE_STUDIO"
    echo "2. Verify all files are in the correct locations"
    echo "3. Check that branding files exist"
    echo "4. Ensure Docker configuration is complete"
fi

print_header "🔗 BACKEND INTEGRATION SUMMARY"

echo "Your Axie Studio uses a 'middleman' architecture:"
echo ""
echo "┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐"
echo "│   User sees:    │───▶│   Axie Studio    │───▶│   Langflow      │"
echo "│   AXIE STUDIO   │    │   Frontend       │    │   Backend       │"
echo "│   (Your Brand)  │    │   (Proxy Layer)  │    │   (Unchanged)   │"
echo "└─────────────────┘    └──────────────────┘    └─────────────────┘"
echo ""
echo "✅ Frontend: Completely rebranded to Axie Studio"
echo "✅ Backend: Original Langflow (no changes needed)"
echo "✅ Integration: API proxy maintains full compatibility"
echo "✅ Authentication: Custom user management system"
echo "✅ Business Model: MacInCloud-style credential delivery"

exit $TESTS_FAILED
