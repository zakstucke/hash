#!/usr/bin/env bash

#MISE description="Run clippy on the entire workspace"

mise exec --env dev -- cargo clippy --all-features --all-targets --workspace --no-deps
