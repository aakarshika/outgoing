#!/bin/bash

# Define the ports to kill
PORTS=(8998 5995)

for PORT in "${PORTS[@]}"; do
    echo "Checking port $PORT..."
    PID=$(lsof -t -i :$PORT)
    if [ -n "$PID" ]; then
        echo "Killing process $PID on port $PORT..."
        kill -9 $PID
    else
        echo "Port $PORT is free."
    fi
done
