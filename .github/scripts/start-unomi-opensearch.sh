#!/usr/bin/env bash
# Load a pre-built apache/unomi:4.0.0-SNAPSHOT image and start it against
# OpenSearch on localhost:9200 (GHA service / host). Uses --network host so the
# container can reach the OpenSearch service published on the runner.
set -euo pipefail

IMAGE_TAR="${1:-unomi-image.tar.gz}"
IMAGE_TAG="${UNOMI_IMAGE_TAG:-apache/unomi:4.0.0-SNAPSHOT}"
OPENSEARCH_PASSWORD="${OPENSEARCH_PASSWORD:-Unomi.1ntegrat10n.Tests}"
OPENSEARCH_ADDRESSES="${UNOMI_OPENSEARCH_ADDRESSES:-localhost:9200}"
UNOMI_USER="${UNOMI_USER:-karaf}"
UNOMI_PASSWORD="${UNOMI_PASSWORD:-karaf}"
WAIT_SECONDS="${UNOMI_WAIT_SECONDS:-300}"

if [[ ! -f "${IMAGE_TAR}" ]]; then
  echo "Unomi image archive not found: ${IMAGE_TAR}" >&2
  exit 1
fi

echo "Loading Unomi image from ${IMAGE_TAR}..."
gunzip -c "${IMAGE_TAR}" | docker load

docker rm -f unomi >/dev/null 2>&1 || true

echo "Starting ${IMAGE_TAG} against OpenSearch at ${OPENSEARCH_ADDRESSES}..."
docker run -d --name unomi --network host \
  -e UNOMI_AUTO_START=true \
  -e UNOMI_DISTRIBUTION=unomi-distribution-opensearch \
  -e UNOMI_OPENSEARCH_ADDRESSES="${OPENSEARCH_ADDRESSES}" \
  -e UNOMI_OPENSEARCH_USERNAME=admin \
  -e UNOMI_OPENSEARCH_PASSWORD="${OPENSEARCH_PASSWORD}" \
  "${IMAGE_TAG}"

echo "Waiting up to ${WAIT_SECONDS}s for Unomi on :8181..."
deadline=$((SECONDS + WAIT_SECONDS))
until curl -sf -u "${UNOMI_USER}:${UNOMI_PASSWORD}" \
  http://localhost:8181/cxs/cluster >/dev/null 2>&1 \
  || curl -sf -u "${UNOMI_USER}:${UNOMI_PASSWORD}" \
  http://localhost:8181/cxs/privacy/info >/dev/null 2>&1; do
  if (( SECONDS >= deadline )); then
    echo "Unomi did not become healthy in time" >&2
    docker logs unomi 2>&1 | tail -200 || true
    exit 1
  fi
  sleep 5
done

echo "Unomi is ready"
