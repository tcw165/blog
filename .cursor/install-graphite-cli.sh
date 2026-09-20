#!/usr/bin/env bash
set -euo pipefail

# Official Graphite CLI install via npm.
# https://graphite.com/docs/install-the-cli
sudo env PATH="${PATH}" npm install -g --prefix /usr/local @withgraphite/graphite-cli@stable
gt --version
