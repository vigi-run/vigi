#!/bin/sh
set -eu

# Default API_URL for Docker internal network
API_URL=${API_URL:-http://api:8034}

# Generate env.js for frontend runtime config
cat >/usr/share/nginx/html/env.js <<EOF
/* generated each container start */
window.__CONFIG__ = {
  API_URL: "$API_URL"
};
EOF

# Process nginx config template with environment variables
envsubst '${API_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Continue with the official Nginx entrypoint
/docker-entrypoint.sh "$@"
