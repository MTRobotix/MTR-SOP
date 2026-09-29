---
title: Fix common SensQ errors
summary: Exact error messages and the fix for each.
tags: [sensq, ros2, troubleshooting]
owner: Thong Huynh
featured: true
order: 20
updated: 2026-09-27
---

## Port already in use

Error: `Backend port 8000 is already in use.` (or `Frontend port 5200`).

1. Find the process: `sudo ss -ltnp | grep ':8000'`
2. Stop it: `sudo fuser -k 8000/tcp`
3. Or use other ports: `BACKEND_PORT=8001 FRONTEND_PORT=5201 ./app/dev.sh`

## UI shows NetworkError from another computer

Cause: the UI calls `localhost`, which is the viewer's computer. Fix: start with `PUBLIC_HOST=<ROBOT_IP>`. See [Open the UI from another computer](/d/software/sensq-run-locally#open-the-ui-from-another-computer).

## Node.js too old

Error: `Node.js 12 is too old for the SensQ UI.`

```bash
nvm install 20
nvm use 20
cd ~/SensQ/app/ui
rm -rf node_modules package-lock.json
npm install
```

## Broken Python packages on Jetson

Errors like:

```text
ModuleNotFoundError: No module named 'asyncpg.protocol.protocol'
ModuleNotFoundError: No module named 'pydantic_core._pydantic_core'
ValueError: the greenlet library is required to use this function.
ROS command publisher disabled: No module named 'numpy'
```

1. Reinstall the compiled packages:

   ```bash
   cd ~/SensQ/app/backend
   source .venv/bin/activate
   pip install --upgrade pip setuptools wheel
   pip install --force-reinstall --no-cache-dir asyncpg greenlet pydantic-core pydantic numpy
   pip install -r requirements.txt
   ```

2. Still failing: delete and recreate the virtualenv:

   ```bash
   deactivate 2>/dev/null || true
   rm -rf .venv
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip setuptools wheel
   pip install -r requirements.txt
   ```

3. Packages build from source and fail: `sudo apt install -y build-essential python3-dev rustc cargo`, then repeat step 1.

## PostgreSQL login fails

Error: `PostgreSQL is running, but the backend cannot log in`.

Inside `sudo -u postgres psql`:

```sql
ALTER USER sensq WITH PASSWORD 'sensq';
ALTER DATABASE sensq OWNER TO sensq;
```

> [!WARNING]
> Type SQL only at the `postgres=#` prompt. After `\q` you are back in the shell, and `ALTER ...` fails with `bash: ALTER: command not found`.

## PostgreSQL pool timeout

Error: `sqlalchemy.exc.TimeoutError: QueuePool limit of size 5 overflow 10 reached`. Fix: pull the latest code and restart `./app/dev.sh`. Current code throttles snapshot writes from high-rate topics (`/joint_states`, `/odom`, `/map`).

## Teleop: ROS publisher is not available

Fix: pull the latest code and restart `./app/dev.sh`. Then check ROS is visible:

```bash
source /opt/ros/humble/setup.bash
source ~/SensQ/ros2_ws/install/setup.bash
ros2 topic list
```

## ESP32 not found or permission denied

The base expects the ESP32 at `/dev/ttyACM0`.

1. Check: `ls /dev/ttyACM0`
2. Permission denied: `sudo usermod -aG dialout $USER`, then log out and back in.

## Maps tab waits for /map

1. Drive the robot after launch.
2. Check SLAM publishes: `ros2 topic echo /map --once`
3. Map save fails: `sudo apt install -y ros-humble-nav2-map-server`. Saved maps go to `~/SensQ/data/maps/`.

Source: `~/SensQ/SETUP.md`, `~/SensQ/app/dev.sh`
