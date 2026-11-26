FROM node:18-bookworm AS server-builder

ARG NODE_SNAP=false
ARG INSTALL_ODBC=true

WORKDIR /usr/src/app/FUXA-Pro

# Build tools for native Node modules and optional ODBC drivers.
RUN apt-get update && apt-get install -y \
    python3 build-essential libsqlite3-dev dos2unix \
    $( [ "$INSTALL_ODBC" = "true" ] && echo "unixodbc-dev" ) \
    && rm -rf /var/lib/apt/lists/*

# Optional ODBC driver preparation.
COPY odbc/ ./odbc/
WORKDIR /usr/src/app/FUXA-Pro/odbc
RUN if [ "$INSTALL_ODBC" = "true" ]; then \
        dos2unix install_odbc_drivers.sh && chmod +x install_odbc_drivers.sh && ./install_odbc_drivers.sh; \
    fi \
    && mkdir -p /usr/lib/odbc /opt/microsoft

# Install server dependencies before copying sources to keep Docker cache useful.
WORKDIR /usr/src/app/FUXA-Pro/server
COPY server/package*.json ./

ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN npm config set registry https://registry.npmjs.org/ \
 && npm config set fetch-retries 8 \
 && npm config set fetch-retry-factor 2 \
 && npm config set fetch-retry-mintimeout 30000 \
 && npm config set fetch-retry-maxtimeout 300000 \
 && npm config set audit false \
 && npm config set fund false

RUN bash -lc '\
  for i in 1 2 3 4 5 6 7 8; do \
    echo "npm install - attempt $i/8"; \
    npm install --no-audit --no-fund --network-timeout=600000 && exit 0; \
    echo "Failed, wait $((10*i))s and try again..."; \
    sleep $((10*i)); \
  done; \
  echo "npm install failed after 8 attempts"; \
  exit 1'

COPY server/ ./
RUN rm -rf test && npm run build

RUN if [ "$NODE_SNAP" = "true" ]; then \
        npm install node-snap7; \
    fi

# Rebuild sqlite3 against the container runtime libraries.
RUN npm install --build-from-source --sqlite=/usr/bin sqlite3 \
    && npm prune --omit=dev

FROM node:18-bookworm-slim

ARG INSTALL_ODBC=true

WORKDIR /usr/src/app/FUXA-Pro

# Runtime libraries only.
RUN apt-get update \
    && apt-get install -y \
        sqlite3 libsqlite3-0 \
        $( [ "$INSTALL_ODBC" = "true" ] && echo "unixodbc odbc-mariadb odbc-postgresql libsqliteodbc tdsodbc" ) \
    && if [ "$INSTALL_ODBC" = "true" ]; then \
        mkdir -p /usr/lib/odbc && \
        find /usr/lib -path '*/odbc/*.so' -exec cp {} /usr/lib/odbc/ \; ; \
    fi \
    && rm -rf /var/lib/apt/lists/*

# MySQL and MSSQL ODBC drivers are prepared in the builder stage.
COPY --from=server-builder /usr/lib/odbc/ /usr/lib/odbc/
COPY --from=server-builder /opt/microsoft/ /opt/microsoft/

COPY --from=server-builder /usr/src/app/FUXA-Pro/server ./server
COPY --from=server-builder /usr/src/app/FUXA-Pro/odbc ./odbc
COPY client/dist ./client/dist
COPY node-red/ ./node-red/

RUN if [ "$INSTALL_ODBC" = "true" ]; then cp odbc/odbcinst.ini /etc/odbcinst.ini; fi

WORKDIR /usr/src/app/FUXA-Pro/server

ENV NODE_ENV=production
EXPOSE 1881
CMD [ "node", "main.js" ]
