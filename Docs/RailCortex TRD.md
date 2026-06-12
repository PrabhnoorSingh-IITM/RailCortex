# Technical Requirements Document (TRD)

**Project:** RailCortex  
**Document Status:** Final  

---

## 1. System Architecture Overview
RailCortex operates on a decoupled client-server architecture, communicating via REST APIs and WebSockets. The system combines physical edge telemetry (custom IoT hardware) with a production-grade multi-agent reasoning backend and a WebGL frontend.

```mermaid
graph TD
    %% Hardware Edge
    subgraph Edge [Hardware: Custom IoT Node]
        PCB[ESP32 Custom PCB]
        MPU[MPU6050 Accelerometer]
        GPS[NEO-6M GPS]
        BME[BME280 Weather]
        TOF[VL53L0X Obstacle]
        MPU --> PCB
        GPS --> PCB
        BME --> PCB
        TOF --> PCB
    end
    %% Frontend
    subgraph Frontend [Client: React + deck.gl]
        UI[Dashboard UI Overlay]
        Map[Mapbox Base Map]
        Trips[deck.gl TripsLayer]
        Alerts[Emergency HUD]
    end
    %% Backend
    subgraph Backend [Server: FastAPI (Python)]
        WS[WebSocket Manager]
        Sim[Telemetry Simulator]
        Trigger[Emergency API Endpoint]
        MILP[PuLP Optimization Engine]
        %% LangGraph
        subgraph LG [LangGraph Orchestrator]
            Node1[1. Analyzer Agent]
            Node2[2. Medical Agent]
            Node3[3. Route Planner Agent]
            Node4[4. Resource Agent]
        end
    end
    %% External APIs
    subgraph External [External APIs]
        OSM[OpenStreetMap Overpass API]
        Mappls[MapmyIndia / Google Routes API]
        LLM[OpenAI gpt-4o / gpt-4o-mini]
    end
    %% Connections
    PCB -->|WSS Crash/Telemetry Payload| Trigger
    Sim <--> MILP
    Sim --> WS
    WS -->|Live JSON| Trips
    UI -->|POST /simulate| Trigger
    Trigger --> LG
    LG <--> LLM
    Node2 <--> OSM
    Node3 <--> Mappls
    LG -->|Emergency Plan JSON| WS
    WS --> Alerts
```

### 1.1 Operational Workflow

#### Workflow A: Normal Operations (The Digital Twin)
1. **Telemetry Generation:** The FastAPI backend runs a continuous background task (Telemetry Simulator) that mocks train movements along predefined GeoJSON routes.
2. **Streaming:** Every 1 second, the backend pushes the updated array of train coordinates to the React frontend via WebSockets.
3. **Rendering:** The React frontend uses `deck.gl` to interpolate these coordinates. The GPU renders the trains as smooth, moving lines over the Mapbox base map.
4. **Predictive Optimization:** If a user clicks "Inject Heavy Rain" on the UI, an HTTP POST request is sent to the backend. The backend's deterministic math engine (PuLP MILP Solver) instantly recalculates train paths to avoid gridlock. The updated paths are piped back through the WebSocket, and the UI visually shifts the trains to new tracks.

#### Workflow B: Emergency Response (The Hardware & Agentic Swarm)
1. **Physical Trigger:** The custom ESP32 PCB detects a sudden spike in G-force via the MPU6050 sensor (e.g., impact simulation).
2. **Interrupt:** The ESP32 sends an immediate POST request containing the `peak_g_force` and GPS coordinates to the `/api/v1/emergency/trigger` endpoint.
3. **State Transition:** FastAPI immediately pauses the Normal Operations WebSocket stream and broadcasts an `EMERGENCY_STATE` flag to the frontend. The React UI instantly flashes red, locking the standard dashboard.
4. **LangGraph Swarm Execution:**
   * **Analyzer:** Parses the hardware payload (e.g., 8.4 Gs at 110 km/h = High Severity).
   * **Medical:** Takes the exact coordinates, formats an Overpass QL string, pings the OSM API, and extracts the GPS bounds of nearby trauma centers.
   * **Route Planner:** Takes the hospital GPS bounds and the crash GPS bounds, pinging the Mappls CAD API to calculate heavy-vehicle road trajectories.
   * **Resource:** Synthesizes everything into a `final_dispatch_plan` JSON.
5. **Resolution Rendering:** The final JSON is sent back to the frontend. `deck.gl` instantly draws yellow ambulance GeoJsonLayer paths from the found hospitals to the crash site on the map.

---

## 2. Comprehensive Technology Stack
To achieve Level 4/5 CPS maturity, the platform utilizes specialized libraries across the stack, strictly avoiding generic "chatbot" wrapper architectures.

### 2.1 Frontend (Visualization Layer)
* **Core Framework:** React 18 initialized via Vite (for rapid HMR).
* **Styling:** Tailwind CSS (for high-contrast, state-based UI switching) & Framer Motion (for smooth alert panel animations).
* **Spatial Rendering:** `deck.gl` (WebGPU/WebGL2). Bypasses the DOM to render massive spatial datasets (trains, weather, routes) at 60fps, specifically using `TripsLayer` and `GeoJsonLayer`.
* **Base Map:** `react-map-gl` binding for Mapbox GL JS (Vector tiles, 3D buildings, and terrain).
* **State Management:** Zustand (Lightweight, handles the global toggle between Normal/Emergency modes without React Context re-render lag).
* **Networking:** `socket.io-client` for persistent telemetry ingestion.

### 2.2 Backend (Cognitive & Routing Layer)
* **Core Framework:** Python 3.11+ using FastAPI (Asynchronous, high-performance API routing) and Uvicorn (ASCII/ASGI server).
* **Real-time Comms:** `fastapi.websockets` for streaming `deck.gl` data.
* **Data Validation:** Pydantic V2 (Ensures strict schema adherence for all JSON payloads passed between agents and the frontend).
* **Optimization Engine:** PuLP (Python-based Mixed-Integer Linear Programming solver to handle Train Platforming Problem mathematics during Normal Mode rerouting).

### 2.3 AI & Multi-Agent Layer
* **Orchestration:** LangGraph (Creates a cyclical, deterministic state-machine graph for the agents, preventing infinite loops and ensuring strict execution order).
* **LLM Integration:** LangChain core components interfacing with the OpenAI API.
* **Models:**
  * `gpt-4o-mini`: Used for rapid telemetry parsing and minor routing triage (low latency, cost-effective).
  * `gpt-4o`: Reserved strictly for the Resource Manager agent to handle complex medical allocation logic.

### 2.4 External Data APIs
* **Spatial Querying:** OpenStreetMap (OSM) via the Overpass API. Used programmatically by the Medical Agent via Overpass QL to fetch raw infrastructure geometry.
* **CAD Routing:** MapmyIndia (Mappls REST API) or Google Routes API. Used by the Route Planner Agent to compute real-time, traffic-aware driving geometries for heavy emergency vehicles.

### 2.5 Hardware Edge
* **Microcontroller:** ESP32-WROOM-32 (Built-in Wi-Fi stack for WebSocket/HTTP communication).
* **Sensor Suite:**
  * **MPU6050 (6-axis Accelerometer/Gyroscope):** For sudden impact, vibration anomaly, and derailment detection.
  * **NEO-6M (GPS Module):** For real-time spatial positioning, allowing the hardware node to stream its actual location to the digital twin.
  * **BME280 (Temperature/Humidity/Pressure):** To monitor localized extreme weather events (e.g., flooding/rain triggers) directly from the edge.
  * **VL53L0X (Time-of-Flight / LiDAR):** Mounted to detect physical track blockages or obstacles ahead of the train.
* **Firmware:** C++ via Arduino IDE or ESP-IDF (Handles raw sensor polling, I2C/UART multiplexing, and JSON serialization using ArduinoJson).
* **PCB Engineering:** KiCad 8.0 (Schematics, PCB layout, Gerber generation in `/hardware/pcb`).
* **Mechanical Design:** Autodesk Fusion 360 (Parametric modeling for the custom sensor enclosure, exported as `.step`/`.stl` in `/hardware/cad`).

---

## 3. Data Models & Payloads

### 3.1 deck.gl TripsLayer Format (Normal Operations)
To render smooth train animations, the frontend `TripsLayer` requires strict GeoJSON-like formatting:
```json
{
  "train_id": "RAJ-12345",
  "route_color": [0, 255, 0], 
  "path": [
    [80.3319, 26.4499], 
    [80.5000, 26.6000],
    [80.9462, 26.8467]
  ],
  "timestamps": [100, 500, 1200]
}
```

### 3.2 Emergency Trigger Payload (Hardware & Software)
The backend accepts this payload generated by the ESP32 hardware node when a G-force threshold is breached:
```json
// POST /api/v1/emergency/trigger
{
  "event_type": "DERAILMENT",
  "train_id": "RAJ-12345",
  "sensor_data": {
    "peak_g_force": 8.4,
    "orientation_x": 180.2,
    "obstacle_distance_mm": -1,
    "weather": { "temp_c": 32, "humidity": 85 }
  },
  "location": {
    "lat": 26.4499,
    "lon": 80.3319
  },
  "velocity_kmh": 110,
  "timestamp": "2026-06-12T10:15:30Z"
}
```

---

## 4. Hardware Engineering Specifications

### 4.1 PCB Design (KiCad)
* **Microcontroller:** ESP32-WROOM-32 module for onboard WiFi processing.
* **Sensor Routing:**
  * I2C bus shared by the MPU6050, BME280, and VL53L0X sensors.
  * UART (TX/RX) lines dedicated to the NEO-6M GPS module.
* **Power Management:** 3.3V LDO Regulator (e.g., AMS1117) with USB-C power delivery input to handle the current draw of the ESP32 and GPS module.
* **Deliverable:** Schematic `.sch` files, PCB layout `.kicad_pcb` files, and exported Gerber fabrication files must be stored in the `/hardware/pcb` directory.

### 4.2 Mechanical Enclosure (Fusion 360)
* **Design:** A custom, snap-fit 3D CAD model designed to securely mount the PCB to a simulated train carriage or trackside pole.
* **Deliverable:** Parametric Fusion 360 files (`.f3d`) and exported `.step`/`.stl` files in the `/hardware/cad` directory.

---

## 5. LangGraph Multi-Agent Specifications

### 5.1 State Schema (TypedDict)
The agents communicate by mutating a shared state object in Python:
```python
from typing import TypedDict, List, Dict, Optional

class EmergencyState(TypedDict):
    incident_data: Dict          # Raw payload from Hardware/Frontend
    severity_level: str          # e.g., "HIGH", "LOW"
    estimated_casualties: int
    medical_facilities: List     # Populated by OSM
    ambulance_routes: List       # Populated by Routing API
    final_dispatch_plan: Dict    # Final output sent to frontend
    errors: List[str]            # Fallback handling
```

### 5.2 Agent Nodes & External Integrations
1. **Incident Analyzer Node:** Calculates kinetic energy/severity based on the hardware payload's `peak_g_force`.
2. **Medical Coordinator Node:** Executes bounding box query around the crash lat/lon using `node["amenity"="hospital"](around:5000, {lat}, {lon}); out geom;`.
3. **Route Planner Node:** Iterates through `medical_facilities` and calculates real-time heavy-vehicle CAD routes via Mappls.
4. **Resource Manager Node:** Matches casualties to hospital beds and finalizes the `final_dispatch_plan`.

---

## 6. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| **WS** | `/ws/network-telemetry` | Streams TripsLayer payloads at 1Hz for map animations. |
| **POST** | `/api/v1/simulation/weather` | Injects localized rain. Modifies backend timestamp arrays to simulate delay cascading. |
| **POST** | `/api/v1/emergency/trigger` | Ingests PCB payload, pauses telemetry WS, triggers LangGraph swarm, and returns Dispatch JSON. |

---

## 7. Performance Optimization & Execution Strategies
1. **Mock the Database:** Store the "master timetable" as static JSON files loaded into memory via Python dictionaries on FastAPI startup rather than spinning up a relational database.
2. **Pre-Compute Map Bounds:** Hardcode the Mapbox viewport to a specific region (e.g., Delhi to Lucknow corridor).
3. **Agent Determinism:** Set OpenAI API `temperature=0.1` for all LangGraph nodes to prevent hallucinations.
4. **Asynchronous Routing:** The Route Planner node should use `asyncio.gather()` to fetch ambulance routes in parallel, keeping the total emergency response time under 3 seconds.
