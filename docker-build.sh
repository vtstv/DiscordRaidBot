#!/bin/bash
# Build and push multi-architecture Docker image
# Supports: linux/amd64, linux/arm64
#
# Discord Raid Bot
# By Murr (https://github.com/vtstv)
# GitHub: https://github.com/vtstv/DiscordRaidBot
# Version: 1.0.0

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Default values
TAG="${1:-latest}"
REGISTRY="${2:-}"  # e.g., "ghcr.io/vtstv" or "vtstv" for Docker Hub
PUSH="${3:-false}"
LOAD_LOCAL="${4:-false}"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Discord Raid Bot Multi-Architecture Build${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Image configuration
IMAGE_NAME="raidbot"
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"
    LATEST_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:latest"
else
    FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"
    LATEST_IMAGE_NAME="${IMAGE_NAME}:latest"
fi

# Check if buildx is available
echo -e "${YELLOW}Checking Docker buildx...${NC}"
docker buildx version
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Docker buildx not available!${NC}"
    exit 1
fi

# Create and use buildx builder if not exists
echo ""
echo -e "${YELLOW}Setting up buildx builder...${NC}"
BUILDER_NAME="raidbot-builder"

# Check if builder exists
if docker buildx ls | grep -q "$BUILDER_NAME"; then
    echo -e "${GREEN}Builder '$BUILDER_NAME' already exists, using it...${NC}"
    docker buildx use "$BUILDER_NAME"
else
    echo -e "${GREEN}Creating new builder '$BUILDER_NAME'...${NC}"
    docker buildx create --name "$BUILDER_NAME" --driver docker-container --bootstrap
    docker buildx use "$BUILDER_NAME"
fi

# Inspect builder
docker buildx inspect --bootstrap

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Building multi-arch image...${NC}"
echo -e "${CYAN}Platforms: linux/amd64, linux/arm64${NC}"
echo -e "${CYAN}Tag: ${FULL_IMAGE_NAME}${NC}"
if [ "$TAG" != "latest" ]; then
    echo -e "${CYAN}Also tagging as: ${LATEST_IMAGE_NAME}${NC}"
fi
echo -e "${CYAN}========================================${NC}"
echo ""

# Build command
BUILD_ARGS=(
    "buildx" "build"
    "--platform" "linux/amd64,linux/arm64"
    "--tag" "$FULL_IMAGE_NAME"
)

# Add latest tag if custom tag provided
if [ "$TAG" != "latest" ]; then
    BUILD_ARGS+=("--tag" "$LATEST_IMAGE_NAME")
fi

# Determine build mode
if [ "$PUSH" = "true" ]; then
    echo -e "${YELLOW}Mode: Build and PUSH to registry${NC}"
    BUILD_ARGS+=("--push")
elif [ "$LOAD_LOCAL" = "true" ]; then
    echo -e "${YELLOW}Mode: Build and LOAD locally (single platform only)${NC}"
    echo -e "${YELLOW}WARNING: --load works only with single platform, building for current platform only${NC}"
    BUILD_ARGS=(
        "buildx" "build"
        "--tag" "$FULL_IMAGE_NAME"
        "--load"
    )
else
    echo -e "${YELLOW}Mode: Build only (no push, no load)${NC}"
fi

BUILD_ARGS+=(".")

# Execute build
docker "${BUILD_ARGS[@]}"

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}ERROR: Build failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Multi-arch build complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

if [ "$PUSH" = "true" ]; then
    echo -e "${CYAN}Image pushed to registry:${NC}"
    echo -e "${WHITE}  - ${FULL_IMAGE_NAME} (supports amd64 + arm64)${NC}"
    if [ "$TAG" != "latest" ]; then
        echo -e "${WHITE}  - ${LATEST_IMAGE_NAME} (supports amd64 + arm64)${NC}"
    fi
    echo ""
    echo -e "${YELLOW}To pull on any platform:${NC}"
    echo -e "${WHITE}  docker pull ${FULL_IMAGE_NAME}${NC}"
    echo ""
    echo -e "${GREEN}Docker will automatically select the correct architecture!${NC}"
    echo ""
    
    # Show image manifest
    echo -e "${YELLOW}Image manifest:${NC}"
    docker buildx imagetools inspect "$FULL_IMAGE_NAME"
elif [ "$LOAD_LOCAL" = "true" ]; then
    echo -e "${CYAN}Image loaded locally:${NC}"
    echo -e "${WHITE}  - ${FULL_IMAGE_NAME} (current platform only)${NC}"
    echo ""
    echo -e "${YELLOW}To run:${NC}"
    echo -e "${WHITE}  docker-compose up -d${NC}"
else
    echo -e "${YELLOW}Build completed but not pushed or loaded.${NC}"
    echo ""
    echo -e "${YELLOW}To push to registry, run:${NC}"
    echo -e "${WHITE}  ./docker-build.sh ${TAG} <registry> true${NC}"
    echo ""
    echo -e "${YELLOW}To load locally (single platform), run:${NC}"
    echo -e "${WHITE}  ./docker-build.sh ${TAG} \"\" false true${NC}"
fi

echo ""
