#!/bin/sh
set -e

# Directory where the __ENV.js file will be generated
ENV_FILE=/app/public/__ENV.js

# Generate __ENV.js file with current environment variables
echo "window.__ENV = {" > $ENV_FILE
env | grep "^NEXT_PUBLIC_" | while read -r line; do
  # Extract variable name and value
  key=$(echo "$line" | cut -d '=' -f 1)
  value=$(echo "$line" | cut -d '=' -f 2-)
  
  # Add the variable to the __ENV.js file
  echo "  \"$key\": \"$value\"," >> $ENV_FILE
done
echo "};" >> $ENV_FILE

# Start the application
exec pnpm start
