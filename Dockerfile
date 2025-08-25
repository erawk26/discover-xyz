# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Next.js"

# Next.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Install pnpm
ARG PNPM_VERSION=latest
RUN npm install -g pnpm@$PNPM_VERSION


# Throw-away build stage to reduce size of final image
FROM base AS build

# Build-time arguments for Next.js public environment variables
# These are NOT secrets - they will be visible in the client-side JavaScript bundle
# For actual secrets, use Docker build secrets with --mount=type=secret
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Build-time arguments for secrets (use Docker build secrets for production)
ARG DATABASE_URI
ARG PAYLOAD_SECRET
ARG BETTER_AUTH_SECRET

# Set as environment variables for Next.js build process
# Next.js bakes NEXT_PUBLIC_* variables into the client bundle at build time
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}

# Force rebuild by changing this comment: v2
# Debug: Verify environment variables are set
RUN echo "DEBUG: NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}" && \
    test -n "${NEXT_PUBLIC_SERVER_URL}" || (echo "ERROR: NEXT_PUBLIC_SERVER_URL not set!" && exit 1)


# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Copy application code
COPY . .

# Create .env.production with the build-time variables for Next.js
RUN echo "NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}" > .env.production && \
    echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}" >> .env.production && \
    cat .env.production

# Build application with environment variables explicitly set
# Using secure build arguments instead of hardcoded credentials
RUN NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL} \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID} \
    DATABASE_URI=${DATABASE_URI} \
    PAYLOAD_SECRET=${PAYLOAD_SECRET} \
    BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET} \
    pnpm run build

# Remove development dependencies
RUN pnpm prune --prod


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Entrypoint sets up the container.
ENTRYPOINT [ "/app/docker-entrypoint.js" ]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "pnpm", "run", "start" ]
