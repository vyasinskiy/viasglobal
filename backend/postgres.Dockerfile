FROM postgres:15

RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    postgresql-server-dev-15 \
    libkrb5-dev \
    && git clone https://github.com/EnterpriseDB/pldebugger.git /tmp/pldebugger \
    && cd /tmp/pldebugger \
    && make USE_PGXS=1 \
    && make USE_PGXS=1 install \
    && rm -rf /tmp/pldebugger \
    && apt-get remove -y git build-essential postgresql-server-dev-15 \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

CMD ["postgres", "-c", "shared_preload_libraries=plugin_debugger"]
