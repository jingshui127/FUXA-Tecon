# --- Base images ---
# 官方 node 镜像本身是多架构 manifest，buildx 会按目标平台自动选择 amd64/arm64 变体。
ARG NODE_IMAGE=node:18-bookworm
ARG NODE_SLIM_IMAGE=node:18-bookworm-slim

# --- STAGE 1: Angular Client Builder ---
# 前端产物是纯 JS/CSS，与 CPU 架构无关。固定在构建机原生架构上只编译一次，
# 多平台构建时各架构目标共享这一份 dist，避免在 QEMU 下重复跑 Angular 构建。
FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS client-builder
WORKDIR /usr/src/app/client
COPY client/package*.json ./
RUN npm install --no-audit --no-fund
COPY client/ ./
RUN npm run build -- --configuration production

# --- STAGE 2: Server & Native Dependencies Builder ---
FROM ${NODE_IMAGE} AS server-builder
# Define build arguments with defaults
ARG NODE_SNAP=false
ARG INSTALL_ODBC=true

WORKDIR /usr/src/app/FUXA

# Base build tools
RUN apt-get update && apt-get install -y \
    python3 build-essential libsqlite3-dev dos2unix \
    $( [ "$INSTALL_ODBC" = "true" ] && echo "unixodbc-dev" ) \
    && rm -rf /var/lib/apt/lists/*

# Install Server dependencies
COPY server/package*.json ./server/
# Copy scripts first so postinstall (patch-nodered.js) can run during npm install
COPY server/scripts ./server/scripts/
WORKDIR /usr/src/app/FUXA/server
RUN npm install --no-audit --no-fund
RUN npm prune --production

# Optional Snap7 installation
RUN if [ "$NODE_SNAP" = "true" ]; then npm install node-snap7; fi

# Force rebuild of SQLite for the container
RUN npm install --build-from-source --sqlite=/usr/bin sqlite3

# Optional ODBC driver preparation
WORKDIR /usr/src/app/FUXA/odbc
COPY odbc/ ./
RUN if [ "$INSTALL_ODBC" = "true" ]; then \
    dos2unix install_odbc_drivers.sh && chmod +x install_odbc_drivers.sh && ./install_odbc_drivers.sh; \
    fi \
    && mkdir -p /usr/lib/odbc /opt/microsoft

# 3. Copy server source, build, then cleanup
WORKDIR /usr/src/app/FUXA/server
COPY server/ ./
RUN rm -rf test
RUN npm run build

# --- STAGE 2.5: Communication Plugins Pre-Installer ---
# Pre-install all communication plugins so the runner image ships with them
# ready to use. Without this stage, users would have to manually install each
# plugin via the FUXA UI on first boot.
#
# Uses the full node:18-bookworm image (not slim) so native build tooling
# (python3, gcc, make) is available for packages like `odbc`, `node-bacnet`,
# `mcprotocol`, `redis`, `node-webcam` that need to compile or have optional
# native deps.
#
# The 11 packages match the working fuxa-test container's
# _pkg/runtime/package.json as of 2026-10-26. See
# E:\FUXA-Pro\_SESSION_FACTS.md for the authoritative list and reasoning.
FROM ${NODE_IMAGE} AS plugins-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    pkg-config \
    unixodbc-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg62-turbo-dev \
    libgif-dev \
    librsvg2-dev \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /plugins_pkg/runtime
WORKDIR /plugins_pkg/runtime
RUN npm init -y >/dev/null && npm install --no-audit --no-fund --omit=dev \
        node-opcua@2.149.0 \
        st-ethernet-ip@2.7.5 \
        omron-ethernet-ip@0.0.2 \
        ads-client@2.1.0 \
        mcprotocol@0.1.2 \
        node-bacnet@0.2.4 \
        nodepccc@0.1.17 \
        redis@5.8.2 \
        odbc@2.4.9 \
        chartjs-node-canvas@3.2.0 \
        node-webcam@0.8.2

# --- STAGE 3: Runner ---
FROM ${NODE_SLIM_IMAGE}
ARG INSTALL_ODBC=true
WORKDIR /usr/src/app/FUXA

# Install ONLY runtime libraries
# libcairo2/libpango*/libjpeg/libgif are required at runtime by the
# native `canvas` module (transitively installed via chartjs-node-canvas
# in stage plugins-builder). Without them the chart plugin throws
# "Error: Cannot find module 'canvas'" or the .node file fails to load.
RUN apt-get update \
    && apt-get install -y \
        sqlite3 libsqlite3-0 \
        libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libpangoft2-1.0-0 \
        libjpeg62-turbo libgif7 \
        libglib2.0-0 \
        $( [ "$INSTALL_ODBC" = "true" ] && echo "unixodbc odbc-mariadb odbc-postgresql libsqliteodbc tdsodbc" ) \
    && if [ "$INSTALL_ODBC" = "true" ]; then \
        mkdir -p /usr/lib/odbc && \
        find /usr/lib -path '*/odbc/*.so' -exec cp {} /usr/lib/odbc/ \; ; \
    fi \
    && rm -rf /var/lib/apt/lists/*

# Copy MySQL and MSSQL ODBC drivers from builder (not available in Debian repos)
COPY --from=server-builder /usr/lib/odbc/ /usr/lib/odbc/
COPY --from=server-builder /opt/microsoft/ /opt/microsoft/

# 1. Copy Server
COPY --from=server-builder /usr/src/app/FUXA/server ./server

# 2. Copy Client
COPY --from=client-builder /usr/src/app/client/dist ./client/dist

# 3. Conditional ODBC Config
COPY --from=server-builder /usr/src/app/FUXA/odbc ./odbc
RUN if [ "$INSTALL_ODBC" = "true" ]; then cp odbc/odbcinst.ini /etc/odbcinst.ini; fi

# 4. Copy static app files
COPY node-red/ ./node-red/

# 5. Copy pre-installed communication plugins (built in plugins-builder stage)
#    These are installed into server/_pkg/runtime/ at image build time so the
#    container ships with all communication protocols ready to use, without
#    requiring users to npm-install them via the FUXA UI on first boot.
COPY --from=plugins-builder /plugins_pkg ./server/_pkg

# Final cleanup
WORKDIR /usr/src/app/FUXA/server

ENV NODE_ENV=production
EXPOSE 1881
CMD [ "node", "main.js" ]
