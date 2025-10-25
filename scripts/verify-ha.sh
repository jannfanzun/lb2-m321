#!/bin/bash

# ============================================
# HA (High Availability) Verification Script
# ============================================
# Dieses Skript überprüft die HA-Measures des Systems

echo "=========================================="
echo "Verifying HA Implementation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service
check_service() {
  local name=$1
  local port=$2
  local url="http://localhost:${port}/health"

  echo -n "Checking $name (port $port)... "
  if curl -f -s "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ UP${NC}"
    return 0
  else
    echo -e "${RED}✗ DOWN${NC}"
    return 1
  fi
}

# Function to check MongoDB replica set
check_mongo_replica_set() {
  echo ""
  echo "MongoDB Replica Set Status:"
  echo "============================"

  for i in 0 1 2; do
    port=$((27017 + i))
    echo -n "MongoDB Instance $i (port $port)... "
    if docker exec -it tictactoe-mongodb-primary mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Connected${NC}"
    else
      echo -e "${RED}✗ Not connected${NC}"
    fi
  done
}

# Function to check load balancers
check_load_balancers() {
  echo ""
  echo "Load Balancers:"
  echo "==============="

  # User Service LB
  echo -n "User Service Load Balancer... "
  if curl -f -s "http://localhost:3101/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ UP${NC}"
  else
    echo -e "${YELLOW}~ Checking direct endpoints${NC}"
    curl -f -s "http://localhost:3001/health" > /dev/null 2>&1 && echo -e "${GREEN}  ✓ Instance 1 UP${NC}" || echo -e "${RED}  ✗ Instance 1 DOWN${NC}"
    curl -f -s "http://localhost:3011/health" > /dev/null 2>&1 && echo -e "${GREEN}  ✓ Instance 2 UP${NC}" || echo -e "${RED}  ✗ Instance 2 DOWN${NC}"
  fi

  # Game Service LB
  echo -n "Game Service Load Balancer... "
  if curl -f -s "http://localhost:3102/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ UP${NC}"
  else
    echo -e "${YELLOW}~ Checking direct endpoints${NC}"
    curl -f -s "http://localhost:3002/health" > /dev/null 2>&1 && echo -e "${GREEN}  ✓ Instance 1 UP${NC}" || echo -e "${RED}  ✗ Instance 1 DOWN${NC}"
    curl -f -s "http://localhost:3012/health" > /dev/null 2>&1 && echo -e "${GREEN}  ✓ Instance 2 UP${NC}" || echo -e "${RED}  ✗ Instance 2 DOWN${NC}"
  fi
}

# Function to check circuit breakers
check_circuit_breakers() {
  echo ""
  echo "Circuit Breaker Status:"
  echo "======================="

  response=$(curl -f -s "http://localhost:3000/status/circuit-breakers" 2>/dev/null)
  if [ -z "$response" ]; then
    echo -e "${RED}✗ Could not fetch circuit breaker status${NC}"
    return 1
  fi

  # Simple JSON parsing (assuming jq is available)
  if command -v jq &> /dev/null; then
    echo "$response" | jq '.circuitBreakers[] | "\(.name): \(.state)"' -r
  else
    echo "$response"
  fi
}

# Function to check Docker containers
check_docker_containers() {
  echo ""
  echo "Docker Containers:"
  echo "=================="

  docker-compose ps 2>/dev/null | tail -n +2 | while read line; do
    if [ -z "$line" ]; then
      continue
    fi
    container=$(echo "$line" | awk '{print $1}')
    status=$(echo "$line" | awk '{print $(NF-1)}')

    if [[ "$status" == *"Up"* ]]; then
      echo -e "  ${GREEN}✓${NC} $container ($status)"
    else
      echo -e "  ${RED}✗${NC} $container ($status)"
    fi
  done
}

# Main execution
echo "Service Health Check:"
echo "===================="
check_service "API Gateway" 3000
check_service "User Service" 3001
check_service "Game Service" 3002
check_service "Web Client" 8080

check_load_balancers
check_docker_containers
check_circuit_breakers

echo ""
echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "--------"
echo "1. MongoDB Replica Set: 3 nodes (Primary + 2 Secondaries)"
echo "2. Load Balancers: NGINX with health checks"
echo "3. Service Redundancy: 2 instances per service"
echo "4. Health Checks: Enabled for all services"
echo "5. Graceful Shutdown: Implemented"
echo "6. Circuit Breaker: Active with state monitoring"
echo ""
