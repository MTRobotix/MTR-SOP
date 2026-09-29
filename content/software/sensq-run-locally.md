---
title: Run the SensQ stack
summary: Install dependencies, build ROS 2, start backend and UI with one script.
tags: [sensq, ros2, setup]
owner: Thong Huynh
featured: true
order: 10
updated: 2026-09-28
---

## Goal

Start the SensQ operator app (FastAPI backend + React UI) on a machine with ROS 2 Humble.

## Prerequisites

- Ubuntu with ROS 2 Humble installed at `/opt/ros/humble`.
- Python 3 with `venv`.
- Node.js 18 or newer. Ubuntu 22.04 `apt install nodejs` gives Node 12 — too old.
- The SensQ repo at `~/SensQ`.

> [!NOTE]
> `SETUP.md` in the repo still names `backend/`, `ui/` and `./scripts/dev.sh`. The current paths are `app/backend/`, `app/ui/` and `./app/dev.sh`. This page uses the current paths.

## Install system packages

1. Install Python and colcon:

   ```bash
   sudo apt update
   sudo apt install -y python3 python3-venv python3-pip python3-colcon-common-extensions
   ```

2. Install Node.js 20 with nvm:

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   source ~/.bashrc
   nvm install 20
   nvm use 20
   node --version
   ```

   Expected: `v20.x`.

## Build the ROS workspace

```bash
cd ~/SensQ/ros2_ws
source /opt/ros/humble/setup.bash
colcon build
```

Expected: `ros2_ws/install/setup.bash` exists.

## Set up backend and UI

1. Backend virtualenv:

   ```bash
   cd ~/SensQ/app/backend
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```

2. UI dependencies:

   ```bash
   cd ~/SensQ/app/ui
   npm install
   ```

## Start

```bash
cd ~/SensQ
ROS_DISTRO=humble ./app/dev.sh
```

| Service           | Default address                | Change with     |
| ----------------- | ------------------------------ | --------------- |
| Backend (FastAPI) | `http://localhost:8000`        | `BACKEND_PORT`  |
| UI (Vite)         | `http://127.0.0.1:5200`        | `FRONTEND_PORT` |
| Database          | SQLite `~/SensQ/data/sensq.db` | `DATABASE_URL`  |

Stop: <kbd>Ctrl</kbd> + <kbd>C</kbd> — the script stops both services.

## Launch the robot

`./app/dev.sh` starts only the app. Launch the robot hardware (motors, LiDAR, camera, Nav2) from the UI:

1. Start the app: see [Start](#start).
2. Open the UI **Home** page.
3. Select **Start Mobile Base**. The backend runs `ros2 launch my_robot_navigation bringup.launch.py`.
4. To stop the robot, select **Stop**.

Without the UI, on the robot:

```bash
source /opt/ros/humble/setup.bash
source ~/SensQ/ros2_ws/install/setup.bash
ros2 launch my_robot_navigation bringup.launch.py
```

> [!NOTE]
> Change the launched package or file with `SENSQ_ROBOT_LAUNCH_PACKAGE` and `SENSQ_ROBOT_LAUNCH_FILE`. See [Options](#options).

Source: `~/SensQ/app/ui/src/pages/HomePage.jsx`, `~/SensQ/app/backend/app/main.py`, `~/SensQ/app/backend/app/launch_manager.py`

## Open the UI from another computer

The UI calls the backend at `localhost` by default. From another computer that points to the wrong machine and the browser shows `NetworkError when attempting to fetch resource`.

1. On the robot (e.g. Jetson), get its IP: `hostname -I`.

2. Start with that IP:

   ```bash
   ROS_DISTRO=humble PUBLIC_HOST=<ROBOT_IP> ./app/dev.sh
   ```

3. Open `http://<ROBOT_IP>:5200/`.

## Use PostgreSQL instead of SQLite

1. Create the database (inside `sudo -u postgres psql`):

   ```sql
   CREATE USER sensq WITH PASSWORD 'sensq';
   CREATE DATABASE sensq OWNER sensq;
   ```

2. Start with:

   ```bash
   DATABASE_URL="postgresql+asyncpg://sensq:sensq@localhost:5432/sensq" ./app/dev.sh
   ```

## Options

| Variable                     | Default                 | Purpose                                 |
| ---------------------------- | ----------------------- | --------------------------------------- |
| `ROS_DISTRO`                 | `humble`                | ROS setup file to source                |
| `PUBLIC_HOST`                | `localhost`             | Host the UI uses to reach the backend   |
| `SENSQ_USE_SIM_TIME`         | `false`                 | Set `true` when connected to simulation |
| `SENSQ_ROBOT_LAUNCH_PACKAGE` | `my_robot_navigation`   | Package the backend launches            |
| `SENSQ_ROBOT_LAUNCH_FILE`    | `bringup.launch.py`     | Launch file the backend launches        |
| `SENSQ_TELEOP_PACKAGE`       | `teleop_twist_keyboard` | Teleop package                          |
| `SENSQ_TELEOP_EXECUTABLE`    | `teleop_twist_keyboard` | Teleop executable                       |

Source: `~/SensQ/app/dev.sh`, `~/SensQ/app/backend/app/config.py`, `~/SensQ/SETUP.md`
