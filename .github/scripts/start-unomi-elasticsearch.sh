#!/usr/bin/env bash
# Pull apache/unomi (default 2.7.0) and start it against Elasticsearch on
# localhost:9200 (GHA service / host). Uses --network host so the container
# can reach Elasticsearch published on the runner.
set -euo pipefail

IMAGE_TAG="${UNOMI_IMAGE_TAG:-apache/unomi:2.7.0}"
ES_ADDRESSES="${UNOMI_ELASTICSEARCH_ADDRESSES:-localhost:9200}"
UNOMI_USER="${UNOMI_USER:-karaf}"
UNOMI_PASSWORD="${UNOMI_PASSWORD:-karaf}"
WAIT_SECONDS="${UNOMI_WAIT_SECONDS:-300}"

echo "Pulling ${IMAGE_TAG}..."
docker pull "${IMAGE_TAG}"

docker rm -f unomi >/dev/null 2>&1 || true

echo "Starting ${IMAGE_TAG} against Elasticsearch at ${ES_ADDRESSES}..."
docker run -d --name unomi --network host \
  -e UNOMI_ELASTICSEARCH_ADDRESSES="${ES_ADDRESSES}" \
  -e UNOMI_ELASTICSEARCH_CLUSTER_NAME=contextElasticSearch \
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
