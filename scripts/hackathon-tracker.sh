#!/bin/bash

# T0kenRent Hackathon Progress Tracker
# Interactive checklist and timer for 10-hour hackathon

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       T0kenRent - 10 Hour Hackathon Progress Tracker          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Get start time
read -p "Enter hackathon start time (HH:MM, 24hr format): " START_TIME

# Calculate time remaining
CURRENT_TIME=$(date +%H:%M)
START_SECONDS=$(date -d "$START_TIME" +%s 2>/dev/null || date -j -f "%H:%M" "$START_TIME" +%s)
CURRENT_SECONDS=$(date +%s)
ELAPSED=$((CURRENT_SECONDS - START_SECONDS))
ELAPSED_HOURS=$((ELAPSED / 3600))
REMAINING=$((36000 - ELAPSED))  # 10 hours = 36000 seconds
REMAINING_HOURS=$((REMAINING / 3600))

if [ $ELAPSED -lt 0 ]; then
    echo -e "${YELLOW}⏳ Hackathon hasn't started yet${NC}"
    echo ""
fi

echo "🕐 Start Time: $START_TIME"
echo "🕐 Current Time: $CURRENT_TIME"
echo "⏱️  Time Elapsed: ${ELAPSED_HOURS}h"
echo "⏱️  Time Remaining: ${REMAINING_HOURS}h"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Hour 1-2: Setup
echo -e "${BLUE}⏰ HOUR 1-2: SETUP & FOUNDATION${NC}"
echo ""
read -p "✓ Wallet installed & funded with testnet BSV? (y/n): " h1_1
read -p "✓ Explored BSV app Todo template? (y/n): " h1_2
read -p "✓ Reviewed supply chain example? (y/n): " h1_3
read -p "✓ Understood PushDrop basics? (y/n): " h1_4
echo ""

if [[ $h1_1 == "y" && $h1_2 == "y" && $h1_3 == "y" && $h1_4 == "y" ]]; then
    echo -e "${GREEN}✅ Hour 1-2 Complete!${NC}"
else
    echo -e "${YELLOW}⚠️  Hour 1-2 Incomplete${NC}"
fi
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Hour 3-6: Core Development
echo -e "${BLUE}⏰ HOUR 3-6: CORE DEVELOPMENT${NC}"
echo ""
echo "Hour 3: Data Structure & Validation"
read -p "✓ Rental token schema defined? (y/n): " h3_1
read -p "✓ Topic manager implemented? (y/n): " h3_2
read -p "✓ Protocol identifier established? (y/n): " h3_3
echo ""

echo "Hour 4-5: Wallet & Token Minting"
read -p "✓ Wallet connection working? (y/n): " h4_1
read -p "✓ Token minting service implemented? (y/n): " h4_2
read -p "✓ Can create test tokens? (y/n): " h4_3
echo ""

echo "Hour 6: Frontend UI"
read -p "✓ Rental creation form built? (y/n): " h6_1
read -p "✓ Wallet integration in UI? (y/n): " h6_2
read -p "✓ Can mint tokens from UI? (y/n): " h6_3
echo ""

if [[ $h3_1 == "y" && $h3_2 == "y" && $h3_3 == "y" && \
      $h4_1 == "y" && $h4_2 == "y" && $h4_3 == "y" && \
      $h6_1 == "y" && $h6_2 == "y" && $h6_3 == "y" ]]; then
    echo -e "${GREEN}✅ Hour 3-6 Complete!${NC}"
else
    echo -e "${YELLOW}⚠️  Hour 3-6 Incomplete${NC}"
fi
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Hour 7-8: Overlay Deployment
echo -e "${BLUE}⏰ HOUR 7-8: OVERLAY DEPLOYMENT${NC}"
echo ""
echo "Hour 7: Database Setup"
read -p "✓ MongoDB running? (y/n): " h7_1
read -p "✓ Environment variables configured? (y/n): " h7_2
read -p "✓ Database connection tested? (y/n): " h7_3
echo ""

echo "Hour 8: SHIP/SLAP Testing"
read -p "✓ LARS deployment configured? (y/n): " h8_1
read -p "✓ SHIP advertisements working? (y/n): " h8_2
read -p "✓ Complete flow tested end-to-end? (y/n): " h8_3
echo ""

if [[ $h7_1 == "y" && $h7_2 == "y" && $h7_3 == "y" && \
      $h8_1 == "y" && $h8_2 == "y" && $h8_3 == "y" ]]; then
    echo -e "${GREEN}✅ Hour 7-8 Complete!${NC}"
else
    echo -e "${YELLOW}⚠️  Hour 7-8 Incomplete${NC}"
fi
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Hour 9-10: Documentation
echo -e "${BLUE}⏰ HOUR 9-10: DOCUMENTATION & DEMO${NC}"
echo ""
echo "Hour 9: Visual Documentation"
read -p "✓ Miro architecture diagrams created? (y/n): " h9_1
read -p "✓ Figma wireframes completed? (y/n): " h9_2
echo ""

echo "Hour 10: API Docs & Sprint Plan"
read -p "✓ API specs in apidog.com? (y/n): " h10_1
read -p "✓ Jira sprint plan created? (y/n): " h10_2
read -p "✓ README updated for demo? (y/n): " h10_3
echo ""

if [[ $h9_1 == "y" && $h9_2 == "y" && \
      $h10_1 == "y" && $h10_2 == "y" && $h10_3 == "y" ]]; then
    echo -e "${GREEN}✅ Hour 9-10 Complete!${NC}"
else
    echo -e "${YELLOW}⚠️  Hour 9-10 Incomplete${NC}"
fi
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Calculate overall progress
TOTAL_TASKS=25
COMPLETED=0

for task in $h1_1 $h1_2 $h1_3 $h1_4 \
            $h3_1 $h3_2 $h3_3 \
            $h4_1 $h4_2 $h4_3 \
            $h6_1 $h6_2 $h6_3 \
            $h7_1 $h7_2 $h7_3 \
            $h8_1 $h8_2 $h8_3 \
            $h9_1 $h9_2 \
            $h10_1 $h10_2 $h10_3; do
    if [ "$task" == "y" ]; then
        ((COMPLETED++))
    fi
done

PROGRESS=$((COMPLETED * 100 / TOTAL_TASKS))

echo "📊 Overall Progress: $COMPLETED/$TOTAL_TASKS tasks ($PROGRESS%)"
echo ""

# Progress bar
BAR_LENGTH=50
FILLED=$((PROGRESS * BAR_LENGTH / 100))
EMPTY=$((BAR_LENGTH - FILLED))

printf "["
printf "%${FILLED}s" | tr ' ' '='
printf "%${EMPTY}s" | tr ' ' '-'
printf "] ${PROGRESS}%%\n"
echo ""

# Recommendations
if [ $ELAPSED_HOURS -lt 2 ]; then
    echo -e "${YELLOW}💡 Focus: Complete wallet setup and explore templates${NC}"
elif [ $ELAPSED_HOURS -lt 6 ]; then
    echo -e "${YELLOW}💡 Focus: Build core token minting and validation${NC}"
elif [ $ELAPSED_HOURS -lt 8 ]; then
    echo -e "${YELLOW}💡 Focus: Deploy overlay and test complete flow${NC}"
else
    echo -e "${YELLOW}💡 Focus: Finish documentation and prepare demo${NC}"
fi
echo ""

# Demo checklist
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}🎯 DEMO READINESS CHECKLIST${NC}"
echo ""
read -p "✓ Can create rental token? (y/n): " demo_1
read -p "✓ HTTP 402 payment working? (y/n): " demo_2
read -p "✓ Overlay monitoring visible? (y/n): " demo_3
read -p "✓ Architecture diagram ready? (y/n): " demo_4
read -p "✓ Have sample data prepared? (y/n): " demo_5
echo ""

DEMO_READY=0
for check in $demo_1 $demo_2 $demo_3 $demo_4 $demo_5; do
    if [ "$check" == "y" ]; then
        ((DEMO_READY++))
    fi
done

if [ $DEMO_READY -eq 5 ]; then
    echo -e "${GREEN}🎉 DEMO READY! You're all set!${NC}"
else
    echo -e "${YELLOW}⚠️  Demo readiness: $DEMO_READY/5${NC}"
    echo "Complete remaining items before demo"
fi
echo ""

# Save progress
cat > hackathon/progress.txt << EOF
Hackathon Progress - $(date)
Start Time: $START_TIME
Elapsed: ${ELAPSED_HOURS}h
Remaining: ${REMAINING_HOURS}h
Progress: $PROGRESS%
Demo Ready: $DEMO_READY/5

Hour 1-2: $([ "$h1_1" == "y" ] && [ "$h1_2" == "y" ] && [ "$h1_3" == "y" ] && [ "$h1_4" == "y" ] && echo "✓" || echo "✗")
Hour 3-6: $([ "$h3_1" == "y" ] && [ "$h4_1" == "y" ] && [ "$h6_1" == "y" ] && echo "✓" || echo "✗")
Hour 7-8: $([ "$h7_1" == "y" ] && [ "$h8_1" == "y" ] && echo "✓" || echo "✗")
Hour 9-10: $([ "$h9_1" == "y" ] && [ "$h10_1" == "y" ] && echo "✓" || echo "✗")
EOF

echo "Progress saved to: hackathon/progress.txt"
echo ""
echo "Keep going! You've got this! 🚀"
echo ""
