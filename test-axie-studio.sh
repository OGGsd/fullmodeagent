#!/bin/bash

# Axie Studio Testing Script
# This script validates the Axie Studio setup and functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="http://localhost"
BACKEND_URL="http://localhost:7860"
COMPOSE_FILE="docker-compose.axie-studio.yml"

# Function to print colored output
print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    print_test "Running: $test_name"
    
    if eval "$test_command"; then
        print_pass "$test_name"
        ((TESTS_PASSED++))
    else
        print_fail "$test_name"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Test 1: Check if Docker is running
test_docker() {
    docker --version > /dev/null 2>&1
}

# Test 2: Check if Docker Compose is available
test_docker_compose() {
    docker-compose --version > /dev/null 2>&1
}

# Test 3: Check if services are running
test_services_running() {
    docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"
}

# Test 4: Check frontend accessibility
test_frontend_access() {
    curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"
}

# Test 5: Check backend accessibility
test_backend_access() {
    curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" | grep -q "200"
}

# Test 6: Check if frontend contains Axie Studio branding
test_frontend_branding() {
    curl -s "$FRONTEND_URL" | grep -q "Axie Studio"
}

# Test 7: Check API proxy functionality
test_api_proxy() {
    curl -s "$FRONTEND_URL/api/v1/health" | grep -q "ok\|healthy\|status"
}

# Test 8: Check environment configuration
test_env_config() {
    [ -f ".env" ] && grep -q "AXIE_STUDIO" .env
}

# Test 9: Check if signup route is removed
test_no_signup() {
    ! curl -s "$FRONTEND_URL/signup" | grep -q "sign up\|register"
}

# Test 10: Check Docker container health
test_container_health() {
    docker-compose -f "$COMPOSE_FILE" ps | grep -q "healthy"
}

echo "🧪 Starting Axie Studio Test Suite"
echo "=================================="
echo ""

# Run all tests
run_test "Docker Installation" "test_docker"
run_test "Docker Compose Installation" "test_docker_compose"
run_test "Services Running" "test_services_running"
run_test "Frontend Accessibility" "test_frontend_access"
run_test "Backend Accessibility" "test_backend_access"
run_test "Frontend Branding" "test_frontend_branding"
run_test "API Proxy Functionality" "test_api_proxy"
run_test "Environment Configuration" "test_env_config"
run_test "Signup Route Removed" "test_no_signup"
run_test "Container Health" "test_container_health"

# Summary
echo "=================================="
echo "📊 Test Results Summary"
echo "=================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    print_pass "🎉 All tests passed! Axie Studio is ready to use."
    echo ""
    echo "Access your Axie Studio instance at:"
    echo "  Frontend: $FRONTEND_URL"
    echo "  Backend API: $BACKEND_URL"
    echo ""
    echo "Default login credentials (change in production):"
    echo "  Username: admin"
    echo "  Password: admin123"
else
    print_fail "❌ Some tests failed. Please check the issues above."
    echo ""
    echo "Common troubleshooting steps:"
    echo "1. Ensure Docker services are running: docker-compose -f $COMPOSE_FILE ps"
    echo "2. Check service logs: docker-compose -f $COMPOSE_FILE logs"
    echo "3. Verify environment configuration: cat .env"
    echo "4. Restart services: docker-compose -f $COMPOSE_FILE restart"
fi

exit $TESTS_FAILED
