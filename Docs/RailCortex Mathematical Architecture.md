# RailCortex: Algorithmic & Mathematical Foundations

This document defines the formal mathematical models powering the RailCortex Digital Twin and Emergency Swarm. It covers the Graph Neural Network (GNN) formulations for delay prediction, the Mixed-Integer Linear Programming (MILP) constraints for autonomous routing, the kinematic equations for crash severity analysis, crowd dynamics, predictive maintenance, and multi-objective resource allocation.

---

## 1. Predictive Analytics: SAGE-Het Graph Neural Network
To predict cascading delays (the "Domino Effect"), standard time-series models fail because they ignore track geography. We use a Spatial-Temporal Heterogeneous Graph (SAGE-Het) to model the network.

### 1.1 Graph Definition
The railway network is defined as a heterogeneous graph:
$$G = (V, E)$$

* **Nodes ($V$):** Partitioned into Station Nodes ($V_S$) and Train Nodes ($V_T$).
* **Edges ($E$):** Represent physical tracks (Station-Station) and scheduling constraints (Train-Train headway).

### 1.2 Delay Propagation (Message Passing)
The delay prediction at a specific station depends on the aggregated state of upstream trains and adjacent stations. The hidden state $h_v^{(k)}$ of node $v$ at layer $k$ is updated using the GraphSAGE aggregation function:

$$h_v^{(k)} = \sigma \left( W^{(k)} \cdot \text{CONCAT} \left( h_v^{(k-1)}, \text{AGGREGATE} \left( \{ h_u^{(k-1)} : \forall u \in N(v) \} \right) \right) \right)$$

Where:
* $h_v^{(k-1)}$ is the current node's previous state (e.g., current delay in minutes).
* $N(v)$ represents the neighboring nodes (incoming trains).
* $W^{(k)}$ is the learned weight matrix.
* $\sigma$ is the non-linear activation function (e.g., ReLU).

#### Implementation Shortcut
If training a full GNN is too slow, you can mock this using a deterministic decay formula:
$$\text{Delay}_{\text{station\_B}} = \text{Delay}_{\text{station\_A}} \times e^{-\lambda \cdot (\text{Dist}_{A \to B} \cdot \text{Speed}_{\text{train}})}$$

---

## 2. Autonomous Routing: Mixed-Integer Linear Programming (MILP)
When the GNN predicts a conflict, or a track is blocked, the AI cannot use a stochastic LLM to reroute trains (since LLMs can hallucinate and cause virtual crashes). Instead, we solve the Train Platforming Problem (TPP) using exact MILP solvers (like `PuLP`).

### 2.1 Decision Variables
Let $x_{i,p,t}$ be a binary decision variable where:
* $x_{i,p,t} = 1$ if train $i$ is assigned to platform $p$ at time $t$.
* $x_{i,p,t} = 0$ otherwise.

### 2.2 Objective Function
The goal is to minimize total network delay and platform reallocation penalties:

$$\text{Minimize } Z = \sum_{i \in I} \sum_{p \in P} \sum_{t \in T} (C_{\text{delay}} \cdot \Delta t_i + C_{\text{plat}} \cdot \rho_{i,p}) x_{i,p,t}$$

Where:
* $C_{\text{delay}}$ = Penalty weight for schedule deviation.
* $C_{\text{plat}}$ = Penalty for assigning a train to a non-preferred platform.
* $\rho_{i,p}$ = Preference indicator (e.g., 0 if preferred, 1 if not).

### 2.3 Hard Constraints (The Laws of Physics)
These equations ensure trains do not collide in the simulation.

* **Constraint 1: Uniqueness (A train can only be at one place)**  
  Every train $i$ must be assigned to exactly one platform $p$ for its scheduled arrival:
  $$\sum_{p \in P} \sum_{t \in T} x_{i,p,t} = 1 \quad \forall i \in I$$

* **Constraint 2: Platform Capacity (No overlapping)**  
  A platform $p$ can only hold one train at any given time $t$. If train $i$ is at platform $p$ from arrival $t_{\text{arr}}$ to departure $t_{\text{dep}}$, no other train can occupy it:
  $$\sum_{i \in I} x_{i,p,t} \le 1 \quad \forall p \in P, \forall t \in T$$

* **Constraint 3: Safe Headway (Track Spacing)**  
  The time difference between two trains ($i$ and $j$) arriving on the same track segment must be greater than the minimum safe signaling distance $H_{\text{min}}$:
  $$t_{j,\text{arrive}} - t_{i,\text{depart}} \ge H_{\text{min}} \cdot \min(x_{i,p,t}, x_{j,p,t}) \quad \forall i, j \in I$$

---

## 3. Emergency Edge Physics (Incident Analyzer)
When the custom ESP32 IoT node triggers, the Incident Analyzer AI Agent uses the raw telemetry (Velocity, Peak G-Force) to calculate the physical severity of the crash before allocating medical resources.

### 3.1 Kinetic Energy Dissipation
The total kinetic energy of the train prior to derailment is calculated to estimate infrastructure damage:
$$KE = \frac{1}{2} M_{\text{train}} v_{\text{initial}}^2$$

### 3.2 Hardware Impact Severity Index ($S$)
The ESP32's MPU6050 accelerometer outputs a peak G-force vector ($G_x, G_y, G_z$). The agent calculates a unified Severity Index ($S$):

$$S = \alpha \sqrt{G_x^2 + G_y^2 + G_z^2} + \beta \frac{v_{\text{initial}}}{\Delta t_{\text{stop}}}$$

Where:
* $\alpha, \beta$ are normalized weighting constants.
* $\Delta t_{\text{stop}}$ is the time taken to reach 0 km/h (derived from the hardware sensor interrupt).

If $S > S_{\text{threshold}}$, the LangGraph swarm shifts to **MASS CASUALTY MODE** and doubles the Overpass API search radius for trauma centers.

---

## 4. Routing Optimization (Ambulance Pathing)
The Route Planner Agent utilizes Dijkstra's Algorithm (via the Mappls CAD API) to find the fastest physical road path. The algorithm minimizes the cost $c(u,v)$ of traveling between road nodes $u$ and $v$.

To account for heavy-vehicle ambulances, the edge weight is dynamically adjusted by traffic density $\rho$ and road width $W$:

$$c_{\text{ambulance}}(u,v) = \frac{\text{Distance}(u,v)}{\text{SpeedLimit}(u,v) \cdot (1 - \rho)} + \text{Penalty}(W < W_{\text{min}})$$

This ensures the AI never routes a heavy ambulance down a narrow, congested alleyway, mathematically guaranteeing the fastest viable response time.

---

## 5. Crowd Dynamics (Station Agent)
To optimize boarding times and predict queue-based delays, the Station Agent models station crowds.

### 5.1 Effective Platform Crowd Density
The effective crowd density $\rho_{\text{crowd}}$ on a platform is calculated by factoring in physical obstructions:
$$\rho_{\text{crowd}} = \frac{N_{\text{passengers}}}{\text{Area}_p - \text{Area}_{\text{obstacles}}}$$

### 5.2 Congestion Boarding Penalty
Passenger boarding and alighting durations incur exponential scaling penalties based on crowd density:
$$\Delta t_{\text{board}} = t_{\text{base\_board}} \cdot e^{k(\rho_{\text{crowd}} - \rho_{\text{critical}})}$$

---

## 6. Predictive Maintenance
Track wear and structural decay are modeled using reliability functions to predict segment failure before they disrupt train flows.

### 6.1 Track Segment Failure Probability (Weibull Distribution)
The probability of a track segment failing within time $t$ is defined as:
$$P_f(t) = 1 - e^{-(t/\eta)^\beta}$$

Where:
* $\eta$ is the characteristic life (scale parameter).
* $\beta$ is the shape parameter, dynamically adjusted based on localized environmental variables (temperature/humidity from edge sensors) and cumulative train load weight.

---

## 7. Swarm Decision Logic (Resource Manager Agent)
During critical emergencies, the Resource Manager agent evaluates resource allocations using multi-objective utility functions.

### 7.1 Multi-Objective Utility Function
The swarm matches casualties to hospital capacities and routing coordinates to maximize the overall utility score of the dispatch plan:

$$\text{Maximize } U(\text{Plan}_k) = \sum_{h \in H} \left(w_1 \cdot \text{Beds}_h - w_2 \cdot \text{ETA}_h - w_3 \cdot \text{SeverityMismatch}\right)$$

Where:
* $H$ is the set of hospitals in the plan.
* $\text{Beds}_h$ is the available bed count at hospital $h$.
* $\text{ETA}_h$ is the ambulance transit time to hospital $h$.
* $\text{SeverityMismatch}$ is the penalty for routing a patient with a severe injury to a hospital without proper trauma facilities.
* $w_1, w_2, w_3$ are normalized weights determining priority.
