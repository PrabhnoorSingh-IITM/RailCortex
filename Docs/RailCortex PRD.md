# Product Requirements Document (PRD)

**Project Name:** RailCortex  
**Themes Targeted:** Railways, Agentic & Autonomous Systems, Logistics & Transit  
**Platform:** Web Application (Responsive Desktop Dashboard) + Custom IoT Edge Hardware  

---

## 1. Executive Summary
Modern railway networks operate on fragmented, reactive legacy systems. While standard timetabling works in perfect conditions, the network lacks the spatial intelligence to predict cascading delays caused by minor disruptions, and relies on slow, manual, human-to-human communication during major emergencies.

RailCortex is a dual-mode Cyber-Physical System (CPS). In "Normal Mode," it acts as a Digital Twin, tracking real-time telemetry and mathematically routing trains to prevent gridlock. During a critical failure, it instantly transitions into "Emergency Mode," deploying a Multi-Agent Large Language Model (LLM) Swarm to autonomously analyze severity, locate medical infrastructure via spatial queries, and dispatch rescue resources with zero human latency.

---

## 2. Problem Description

### Pain Point 1: The "Domino Effect" in Routine Operations
Railway networks are non-Euclidean graphs with strict physical constraints (two trains cannot occupy the same track). Currently, if heavy rain causes a 10-minute delay in one sector, controllers react locally. Because they lack network-wide predictive modeling, that minor delay cascades backward, causing massive platform conflicts and multi-hour delays across the grid. Rerouting is done manually and is often mathematically sub-optimal.

### Pain Point 2: Human Bottlenecks in the "Golden Hour"
When a catastrophic event occurs (e.g., derailment), the response sequence is entirely manual:
1. Station master verifies the accident.
2. Calls local authorities.
3. Authorities manually check maps for nearby hospitals.
4. Hospitals are called to check bed availability.
5. Ambulances are dispatched via standard routing.

This sequential human loop wastes precious minutes during a mass-casualty event where survival is dictated by the "Golden Hour."

---

## 3. The Solution: A Dual-Mode Architecture
RailCortex replaces passive tracking with an active, autonomous cognitive network.

* **Solution to Pain Point 1 (The Digital Twin):** We provide a highly performant WebGL spatial dashboard. Using simulated mathematical constraints (Mixed-Integer Linear Programming / GNN abstractions), the system predicts the delay cascade before it happens and autonomously recalculates platform allocations to absorb the shock.
* **Solution to Pain Point 2 (The Agentic Command Center):** We remove the human from the emergency routing loop. Using a LangGraph state-machine, a swarm of specialized AI agents takes over the moment a crash is detected. The AI queries raw spatial data to find hospitals and calculates heavy-vehicle ambulance routes instantly.

---

## 4. Core Features

### Mode A: Digital Twin Operations
* **High-Fidelity Spatial Rendering:** Real-time visualization of the train network using `deck.gl`, rendering train movements as continuous animated trajectories.
* **Live Telemetry Ingestion:** Polling endpoints for train speed, location, and localized weather (simulated for testing).
* **Autonomous Platform Reallocation:** A deterministic optimization engine that reroutes trains visually on the dashboard when a track blockage or weather event is injected.

### Mode B: Emergency Response (The LLM Swarm)
* **Physical IoT Impact Trigger:** A custom-designed physical sensor node (PCB) that acts as the hardware edge device. When subjected to physical shock (simulating a derailment), it securely transmits crash telemetry to the backend to immediately trigger the rescue swarm.
* **Autonomous Medical Discovery:** An AI agent that writes Overpass QL to query OpenStreetMap, extracting exact bounding box coordinates for nearby trauma centers.
* **Dynamic CAD Routing:** An AI agent that interfaces with specialized routing APIs (like MapmyIndia/Mappls or Google Routes) to calculate the fastest physical road paths for ambulances, bypassing tolls and narrow streets.

---

## 5. System Architecture
The architecture relies on deep technical engineering, strictly avoiding simple "wrapper" methodologies, and explicitly integrating custom hardware to showcase full-stack capabilities.

### 1. The Hardware Edge (IoT Telemetry Node)
* **Custom Sensor Board:** An ESP32-based microcontroller integrated with an MPU6050 6-axis accelerometer/gyroscope, mounted on a custom-designed PCB (KiCad) and housed in a 3D-printed enclosure (Fusion 360) to comply with professional engineering standards.
* **Function:** Detects severe G-force anomalies and transmits localized crash coordinates and velocity data via WebSockets to the central server.

### 2. The Cognitive Backend (Python / FastAPI)
* **Routing Engine:** Handles standard HTTP requests from the frontend to update train positions and weather states.
* **LangGraph Orchestrator:** Houses the Multi-Agent state machine.
  * *Node 1 (Analyzer):* GPT-4o-mini parses the incident JSON and sets the "High Severity" state.
  * *Node 2 (Medical):* Generates queries for the Overpass API.
  * *Node 3 (Logistics):* Generates queries for the Routing API.
  * *Node 4 (Resource):* Synthesizes the final JSON dispatch plan.

### 3. The Visualization Frontend (React / deck.gl)
* **State Management:** Listens to backend WebSockets.
* **Visual Engine:** Uses `TripsLayer` for train movement and `GeoJsonLayer` for ambulance routing paths.
* **UI Overlay:** Switches themes from "Dark/Normal" to "Red/Emergency" based on the global state.

---

## 6. Technology Stack
* **Frontend:** React.js, Tailwind CSS, `deck.gl` (GPU-accelerated spatial rendering), Mapbox GL JS.
* **Backend:** Python, FastAPI, Uvicorn, WebSockets.
* **AI Framework:** LangChain, LangGraph (for strict agent control), OpenAI API.
* **External Data APIs:** OpenStreetMap (OSM) via Overpass API, Mappls/Google Routes API.
* **Hardware Engineering:** KiCad (PCB Schematics/Gerber Files), Fusion 360 (CAD modeling for 3D printed enclosure), ESP32-WROOM-32, MPU6050 Accelerometer.

---

## 7. Project Deliverables & Demo Walkthrough

### 1. The GitHub Repository
* Clean codebase containing the React frontend and FastAPI backend.
* Dedicated `/hardware` directory containing the KiCad schematics, Gerber files, and Fusion 360 `.step` CAD files to provide complete design files.
* Comprehensive `README.md` containing architecture diagrams, local setup instructions, and the API documentation.

### 2. Demonstration Workflow
* **Problem/Solution:** Briefly state how railways lack spatial predictive routing and agentic emergency response.
* **Digital Twin Demo:** Show the `deck.gl` map tracking live mock telemetry. Click *[Inject Heavy Rain]* and show the system mathematically reallocating platforms.
* **Agentic Demo & Hardware Execution:** Show the physical custom PCB sensor. Strike the table to trigger the MPU6050 sensor. The UI flashes red. Show the LangGraph log streaming real-time decisions (finding hospitals via OSM, routing via CAD). Show ambulance lines drawn on the map.
* **Architecture Summary:** Emphasize the full-stack nature of the project: from KiCad custom schematics to LangGraph deterministic reasoning and `deck.gl` rendering.
