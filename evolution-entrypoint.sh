#!/bin/sh

# Override .env file with correct database credentials
cat > /app/.env << EOF
DATABASE_URL=postgresql://postgres:28hub2025@postgres:5432/evolution_db
DATABASE_PROVIDER=postgresql
EOF

# Run the original entrypoint
exec /bin/bash -c ". ./Dockerfile-entrypoint.sh"
