---
title: SensQ mobile base reference
summary: Drive geometry, encoder, serial ports and sensor settings from the robot description.
tags: [sensq, hardware, drivetrain]
owner: Thong Huynh
featured: true
order: 10
updated: 2026-09-27
---

## Drive geometry

| Parameter        | Value                                             | Where set                                            |
| ---------------- | ------------------------------------------------- | ---------------------------------------------------- |
| Drive type       | Differential, 2 driven wheels + 1 caster          | `mobile_base.urdf.xacro`                             |
| Wheel radius     | `0.035` m                                         | `mobile_base.urdf.xacro`, `mobile_base.gazebo.xacro` |
| Wheel separation | `0.1795` m                                        | `mobile_base.gazebo.xacro`                           |
| Caster radius    | `0.015` m                                         | `mobile_base.urdf.xacro`                             |
| Wheel joints     | `base_left_wheel_joint`, `base_right_wheel_joint` | `mobile_base.ros2_control.xacro`                     |

> [!WARNING]
> After changing wheels or track width, update the xacro values and the controller config in `my_robot_bringup/config/my_robot_controller.yaml`, then rebuild. Wrong values give wrong odometry.

## Motor controller (ESP32)

| Parameter                           | Value                                              |
| ----------------------------------- | -------------------------------------------------- |
| Hardware plugin                     | `mobile_base_hardware/MobileBaseHardwareInterface` |
| Serial port                         | `/dev/ttyACM0` (launch arg `serial_port`)          |
| Baud                                | `115200` (launch arg `baud`)                       |
| Encoder counts per wheel revolution | `1980`                                             |
| Max wheel speed                     | `40.0` rad/s                                       |
| Serial timeout                      | `20` ms                                            |
| Command interface                   | velocity                                           |
| State interfaces                    | position, velocity                                 |

Invert flags `invert_left_cmd`, `invert_right_cmd`, `invert_left_enc`, `invert_right_enc` are all `false`. Flip one if a wheel runs backwards.

## Sensors

| Sensor          | Setting | Value                             |
| --------------- | ------- | --------------------------------- |
| LiDAR (SLLidar) | Port    | `/dev/ttyUSB0`                    |
| LiDAR           | Baud    | `460800`                          |
| CSI camera      | Width   | `640` (must match calibration)    |
| CSI camera      | Driver  | `nvarguscamerasrc`, sensor ID `0` |
| IMU             | Package | `tm_imu`                          |

## CAD and meshes

STL files in `ros2_ws/src/my_robot_description/meshes/`: `base_link.STL`, `left_wheel_link.STL`, `right_wheel_link.STL`, `caster_wheel_link.STL`, `lidar_link.STL`.

> [!TODO]
> Missing: source CAD files and their location, bill of materials, motor and gearbox part numbers, battery spec, fastener list, assembly steps, torque values. Owner: Thong Huynh.

Source: `~/SensQ/ros2_ws/src/my_robot_description/urdf/`, `~/SensQ/ros2_ws/src/my_robot_navigation/launch/bringup.launch.py`
