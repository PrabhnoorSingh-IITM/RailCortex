# 🚄 RailCortex

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Hardware-ESP32-E53935?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32" />
  <img src="https://img.shields.io/badge/AI-LangGraph-F39C12?style=for-the-badge" alt="LangGraph" />
</p>

RailCortex is an autonomous, dual-mode Cyber-Physical System (CPS) engineered to modernize transit operations. It replaces passive tracking with an active cognitive network, bridging the gap between **deterministic mathematical optimization**, **custom physical hardware**, and **Agentic AI**.

In its primary state, RailCortex operates as a **Level 4 Digital Twin**. Powered by a high-performance WebGL rendering engine, it visualizes spatial datasets at 60fps. Rather than relying on human dispatchers to resolve platform conflicts, the system ingests live edge telemetry and utilizes **Mixed-Integer Linear Programming (MILP)** via PuLP to deterministically reroute trains, absorbing localized delays before they cascade across the grid.

When a physical disaster strikes, RailCortex’s custom-engineered IoT edge node—equipped with an MPU6050 accelerometer, NEO-6M GPS, and environmental sensors—detects the kinetic anomaly and instantly overrides the network. The system transitions into **Emergency Response Mode**, deploying a rigid, deterministic **LangGraph Multi-Agent Swarm**.

---

## 🧭 Dual-Mode Capabilities

### 1. Normal Operations: The Digital Twin
A high-performance WebGL spatial dashboard that functions as a Level 4 digital twin of the physical railway infrastructure.
*   **Live Telemetry Ingestion:** Continuously tracks real-time train movement, velocity, and track congestion parameters via WebSockets.
*   **Mathematical Rerouting:** Utilizes Mixed-Integer Linear Programming (MILP) to autonomously calculate platform reallocations and prevent network gridlock during extreme weather anomalies or track blockages.
*   **GPU-Accelerated Rendering:** Leverages `deck.gl` to render massive spatial datasets (dynamic agents, stations, meteorological overlays) at 60fps without browser latency.

### 2. Emergency Response: The Multi-Agent Swarm
Upon detection of a catastrophic event (e.g., derailment) via the custom IoT hardware edge node, the system interrupts standard optimization protocols and deploys an autonomous LangGraph agent swarm.
*   **Zero-Latency Orchestration:** Agents autonomously calculate incident severity based on raw G-force telemetry.
*   **Spatial Discovery:** Executes Overpass QL to programmatically query OpenStreetMap (OSM) for the precise GPS bounding boxes of adjacent medical infrastructure.
*   **Heavy-Vehicle CAD Routing:** Interfaces with Mappls/Google Routes REST APIs to dispatch emergency medical services utilizing traffic-aware, heavy-vehicle optimal trajectories.

---

## 🛠️ Technology Stack
This project strictly avoids simplistic API wrapper methodologies, demonstrating comprehensive engineering execution across hardware, frontend visualization, and algorithmic routing.

### Frontend (Visualization & Interactivity)
*   **Frameworks:** React.js (Vite) + Tailwind CSS + Framer Motion.
*   **Geospatial:** `deck.gl` (WebGL2 / WebGPU spatial rendering framework) + `react-map-gl` (Mapbox GL JS base maps).
*   **State Management:** Zustand (for reactive, global dashboard state).
*   **Animations:** Anime.js (for SVG architecture flows) + Framer Motion (for spring-physics layout reveals).

### Backend (Cognitive & Routing Engine)
*   **Core:** Python 3.11 + FastAPI + WebSockets (for continuous bidirectional telemetry streaming).
*   **Mathematical Optimization:** PuLP (Python-based MILP solver for deterministic routing).
*   **Agentic Framework:** LangGraph + LangChain (Strict state-machine agent orchestration).
*   **LLMs:** OpenAI GPT-4o / GPT-4o-mini (for unstructured parsing and heuristic judgment).

### Hardware Edge Node (IoT)
*   **Microcontroller:** ESP32-WROOM-32.
*   **Sensors:** MPU6050 (Accelerometer/Gyroscope) + NEO-6M (GPS) + BME280 (Meteorological Sensor) + VL53L0X (LiDAR/Time-of-Flight).
*   **Hardware Engineering:** Custom schematics and Gerber files designed in KiCad 8.0.
*   **CAD Enclosure:** 3D-printed housing parametrically modeled in Autodesk Fusion 360.
*(Note: Hardware schematics, Gerber files, and CAD deliverables are located in the `/Hardware` directory).*

---

## 📐 Engineering Principles and Deterministic Architecture
RailCortex was engineered utilizing deterministic mathematics to ensure the safe management of physical infrastructure:
*   **Deterministic Optimization Constraints:** Train platform reallocation and collision avoidance are managed by strict Linear Algebra equations and bounds, explicitly preventing stochastic LLMs from hallucinating physical routes.
*   **Graph-Based Agent State Management:** LangGraph was selected over standard conversational frameworks (e.g., AutoGen, CrewAI) to enforce a rigid, deterministic execution loop during critical emergencies, mathematically guaranteeing fallback protocols if an external API fails.
*   **Hardware-in-the-Loop Integration:** Physical severity and infrastructure degradation models (Kinetic Energy & Weibull Degradation) are calculated directly from physical IoT sensor payloads, eliminating reliance on simulated mock data for critical triggers.

---

## ⚙️ Local Setup Instructions

### 1. Repository Configuration
Clone the repository and enter the directory:
```bash
git clone https://github.com/PrabhnoorSingh-IITM/RailCortex.git
cd RailCortex
```

### 2. Backend Configuration (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file within the `/backend` directory:
```env
OPENAI_API_KEY=your_openai_key
MAPPLS_API_KEY=your_routing_key
MAPBOX_ACCESS_TOKEN=your_mapbox_key
```

Initialize the ASGI server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Configuration (React/Vite)
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` to access the Digital Twin interface.

### 4. Hardware Node Deployment 
Navigate to `/Hardware/firmware/RailCortex.ino` and flash the compiled binary to the ESP32 via the Arduino IDE. Modify the Wi-Fi credentials and target WebSocket IP address within the source code to establish a connection with the local FastAPI instance.
