#!/bin/bash
# Build and Push Docker Image to Docker Hub
# Usage: ./build-and-push.sh <docker-hub-username> [tag]

DOCKER_USERNAME=${1:-}
TAG=${2:-latest}

if [ -z "$DOCKER_USERNAME" ]; then
    echo "Usage: ./build-and-push.sh <docker-hub-username> [tag]"
    exit 1
fi

IMAGE_NAME="$DOCKER_USERNAME/raidbot"
FULL_IMAGE_TAG="${IMAGE_NAME}:${TAG}"

# Get build metadata
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "Build Timestamp: $BUILD_TIMESTAMP"

echo "Building Docker image for linux/amd64..."
echo "Image: $FULL_IMAGE_TAG"

# Build for linux/amd64 (remote server platform)
docker buildx build --platform linux/amd64 \
    --target runtime \
    --build-arg "BUILD_TIMESTAMP=$BUILD_TIMESTAMP" \
    -t "$FULL_IMAGE_TAG" \
    --load \
    .

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo ""
echo "Build successful!"
echo "Image size:"
docker images "$FULL_IMAGE_TAG"

echo ""
echo "Pushing image to Docker Hub..."
echo "Make sure you're logged in: docker login"

docker push "$FULL_IMAGE_TAG"

if [ $? -ne 0 ]; then
    echo "Push failed! Did you run 'docker login'?"
    exit 1
fi

echo ""
echo "Successfully pushed $FULL_IMAGE_TAG to Docker Hub!"
echo ""
echo "To use on remote server, update docker-compose.yml:"
echo "  image: $FULL_IMAGE_TAG"
