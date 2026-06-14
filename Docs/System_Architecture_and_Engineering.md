# RailCortex: System Architecture and Engineering Documentation

## 1. Overview
RailCortex is an autonomous, dual-mode Cyber-Physical System (CPS) built to solve complex transit routing problems. The core philosophy of this project is deterministic reliability. Instead of depending exclusively on stochastic machine learning models to make critical routing decisions, the system relies on rigorous mathematics (Mixed-Integer Linear Programming) and hardware-in-the-loop triggers to guarantee safety and efficiency.

It operates in two distinct modes:
1. **Digital Twin Mode**: A spatial dashboard resolving minor network delays in real-time.
2. **Emergency Swarm Mode**: A hardware-triggered override that halts trains and dispatches medical routing via an AI agent swarm.

---

## 2. Hardware Edge Node
The hardware component acts as the physical interrupt for the system. I built it around the **ESP32-WROOM-32** due to its integrated Wi-Fi stack and robust dual-core performance.

### Sensors & Data Flow
* **MPU6050 (6-Axis Accelerometer & Gyroscope)**: Used to detect kinetic anomalies. The firmware actively calculates the resultant G-force vector `sqrt(x^2 + y^2 + z^2)`. If it exceeds an 8.0G threshold, it registers a physical crash event.
* **NEO-6M GPS**: Streams NMEA sentences to provide the precise geographic coordinates of the train at the moment of impact.
* **Communication**: The ESP32 opens a WebSocket client connection directly to the FastAPI server, streaming telemetry at ~10Hz. When an impact is detected, it sends a high-priority `{ type: "EMERGENCY_TRIGGER" }` payload.

*(The Gerber files for the custom PCB and the parametric CAD files for the enclosure are located in the `/Hardware` directory).*

---

## 3. Backend Architecture (FastAPI & LangGraph)
The backend is the brain of RailCortex, engineered to handle both high-frequency telemetry and complex algorithmic routing.

### 3.1. Telemetry & WebSockets
I used **FastAPI** coupled with native Python `asyncio` WebSockets to maintain a persistent bi-directional connection between the Edge Node, the Server, and the Web Client.
* **The `websocket_manager.py`** handles connection pooling and broadcast distribution.
* **Live train positional data** is continuously piped to the frontend dashboard for the 60fps WebGL rendering.

### 3.2. Deterministic Routing (MILP)
To manage platform congestion and reroute trains during normal delays, I implemented a **Mixed-Integer Linear Programming (MILP)** solver using the `PuLP` library.
* **Objective Function**: Minimize the total squared delay time across the network.
* **Constraints**: Strict collision avoidance guarantees (e.g., `arrival[i] >= departure[j] + buffer`).
* **Unlike LLMs**, which hallucinate paths, MILP mathematically guarantees that no two trains will ever be assigned to the same platform simultaneously.

### 3.3. LangGraph Agent Swarm
When the MPU6050 triggers an emergency, normal MILP routing is suspended, and the LangGraph state machine takes over. I chose **LangGraph** over sequential agent chains because we needed a strict, cyclical state machine that could fall back gracefully if an API failed.

The swarm consists of:
1. **Analyzer Agent**: Ingests the raw G-force data and calculates structural severity (incorporating `.pkl` scikit-learn models as a heuristic overlay).
2. **Medical Agent**: Executes an Overpass QL query to OpenStreetMap (OSM) to locate the exact bounding boxes of nearby trauma centers relative to the GPS coordinates of the crash.
3. **Route Planner Agent**: Interfaces with Mapbox / Google Routes to calculate heavy-vehicle optimal paths for the ambulances, avoiding blocked roads.
4. **Dispatcher Agent**: Compiles the data and commits the incident payload to the local SQLite database via `incident_store.py`.

---

## 4. Frontend & Spatial Visualization
The frontend is a React (Vite) application designed to function as a Level 4 Digital Twin.

### 4.1. Core Tech
* **State Management**: `Zustand` was chosen over Redux to handle the high-frequency telemetry updates without causing massive re-rendering bottlenecks.
* **Spatial Engine**: I used `deck.gl` (WebGL2) layered over `react-map-gl` to render the trains and infrastructure. DOM-based mapping libraries (like Leaflet) crash when rendering thousands of moving objects; `deck.gl` pushes the rendering to the GPU, easily maintaining 60fps.

### 4.2. UI/UX & Animations
To make the dashboard feel like a responsive, modern command center:
* **Tailwind CSS** for the strict dark-mode design system.
* **Framer Motion** powers the spring-physics layout transitions (such as the Dual-Mode reveal and the incident modals).
* **Anime.js** is used in the Architecture flow diagram to animate the bezier curve telemetry data packets.

---

## 5. Conclusion
RailCortex was an exercise in bridging different engineering disciplines. By combining custom IoT hardware, deterministic mathematical routing, and modern WebGL spatial mapping with a rigid LangGraph state machine, the system functions as a true, reliable Cyber-Physical System.
