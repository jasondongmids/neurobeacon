##### Neurobeacon Dockerfile
# Base Arguements 
ARG APP_DIR=/app

## Build Virtual Environment: Stage 1
FROM python:3.11-slim AS builder
ARG APP_DIR

# install updates and remove unnecessary files
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        build-essential \
        libffi-dev \
        gnupg \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install poetry
ENV POETRY_VERSION=1.8.2
RUN curl -sSL https://install.python-poetry.org | python3 -

# Update path to include poetry
ENV PATH=/root/.local/bin:${PATH}

# Change work directory for where our app will live
WORKDIR ${APP_DIR}

# Bring in poetry files
COPY pyproject.toml poetry.lock ./

# create venv
RUN python -m venv --copies ${APP_DIR}/venv
RUN . ${APP_DIR}/venv/bin/activate && poetry install --no-root --only main



## Use virtual environment: Stage 2
FROM python:3.11-slim as runner
ARG APP_DIR
COPY --from=builder ${APP_DIR}/venv ${APP_DIR}/venv/

# update path to point at venv
ENV PATH ${APP_DIR}/venv/bin:$PATH

# update working directory and copy source code
WORKDIR ${APP_DIR}/
COPY . ./

# run the app
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0"]
