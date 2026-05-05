#!/bin/sh
# Fixture monitor command. Emits one line per second so cc-plugin-eval can validate the wiring without running it.
while true; do
  echo "deploy-status: ok endpoint=$1"
  sleep 1
done
