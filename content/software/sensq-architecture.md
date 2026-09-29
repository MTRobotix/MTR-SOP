---
title: SensQ code map
summary: How the SensQ layers connect and which file to open first.
tags: [sensq, architecture, ros2]
owner: Thong Huynh
featured: false
order: 30
updated: 2026-09-27
---

## Layers

```text
React UI (app/ui)
  │ REST + WebSocket
FastAPI backend (app/backend)
  │ rclpy subscribers/publishers + ros2 launch
ROS 2 workspace (ros2_ws)
  │
Robot hardware: ESP32 base, LiDAR, CSI camera, IMU
```

Rule: the browser never talks to ROS, hardware or the shell directly. Every robot action goes through the backend.

## Where to start

| Order | File                                   | What it does                                                                                |
| ----- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1     | `app/ui/src/main.jsx`                  | UI entry; defines tabs and pages                                                            |
| 2     | `app/ui/src/hooks/useRobotSnapshot.js` | Loads `GET /api/robot/snapshot`, then listens on `/ws/robot-state`; falls back to mock data |
| 3     | `app/ui/src/services/robotApi.js`      | All UI → backend calls                                                                      |
| 4     | `app/backend/app/main.py`              | API routes                                                                                  |
| 5     | `app/backend/app/ros_monitor.py`       | ROS bridge: subscribes to topics, broadcasts state, publishes `/cmd_vel`                    |
| 6     | `app/backend/app/state.py`             | Shape of the robot snapshot shared by backend and UI                                        |

## Backend modules

| File                       | Responsibility                                           |
| -------------------------- | -------------------------------------------------------- |
| `launch_manager.py`        | Runs `ros2 launch my_robot_navigation bringup.launch.py` |
| `mapping_manager.py`       | Start/stop mapping, save maps with `nav2_map_server`     |
| `coverage_manager.py`      | Coverage route preview and execution                     |
| `docking.py`               | Sends `/dock` goals, streams feedback, cancels           |
| `teleop_manager.py`        | Keyboard teleop process                                  |
| `websocket_manager.py`     | WebSocket fan-out                                        |
| `database.py`, `models.py` | SQLite (default) or PostgreSQL storage                   |
| `config.py`                | All environment variables and defaults                   |

## ROS packages

| Package                                                      | Contents                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `my_robot_description`                                       | URDF/xacro, STL meshes, Gazebo worlds, AprilTag models       |
| `my_robot_bringup`                                           | Launch files, Nav2/SLAM/EKF/controller configs, RViz configs |
| `my_robot_navigation`                                        | `bringup.launch.py` used by the backend                      |
| `my_robot_hardware`                                          | ros2_control hardware interface over serial to the ESP32     |
| `my_robot_docking`, `my_robot_docking_msgs`, `apriltag_dock` | AprilTag docking                                             |
| `coverage_planner`                                           | Coverage path planning                                       |
| `sllidar_ros2`                                               | LiDAR driver                                                 |
| `csi_camera`                                                 | CSI camera driver                                            |
| `tm_imu`                                                     | IMU driver                                                   |

> [!WARNING]
> Change `ros2_ws` only when you mean to change robot behaviour. UI/backend work must not edit it.

## Run backend tests

```bash
cd ~/SensQ/app/backend
.venv/bin/python -m pytest tests
```

> [!TODO]
> `pytest` is not in `requirements.txt`. Install it in the venv first (`.venv/bin/pip install pytest`) or add it to a dev requirements file. Owner: Thong Huynh.

Source: `~/SensQ/THEORY.md`, `~/SensQ/README.md`, `~/SensQ/app/backend/app/`, `~/SensQ/ros2_ws/src/`
