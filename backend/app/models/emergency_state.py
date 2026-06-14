from dataclasses import dataclass, field


@dataclass
class EmergencyState:
    peak_g_force: float
    velocity_kmh: float
    lat: float
    lon: float

    temperature: float = 30
    humidity: float = 60
    obstacle_distance: float = 100

    event_type: str = "DERAILMENT"
    train_id: str = "RAJ-12345"

    severity: str = ""
    casualties: int = 0

    hospitals: list = field(default_factory=list)
    allocations: list = field(default_factory=list)
    ambulance_routes: list = field(default_factory=list)

    dispatch_report: str = ""
    dispatch_report_structured: dict = field(default_factory=dict)
    llm_source: str = ""
    search_radius_used_m: int = 0
    final_dispatch_plan: dict = field(default_factory=dict)
    errors: list = field(default_factory=list)

    risk_score: float = 0
    confidence: float = 0
    reasoning: list = field(default_factory=list)

    priority_level: str = ""
    response_time: str = ""
    total_ambulances: int = 0

    incident_data: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "event_type": self.event_type,
            "train_id": self.train_id,
            "severity": self.severity,
            "casualties": self.casualties,
            "hospitals": self.hospitals,
            "allocations": self.allocations,
            "ambulance_routes": self.ambulance_routes,
            "dispatch_report": self.dispatch_report,
            "dispatch_report_structured": self.dispatch_report_structured,
            "llm_source": self.llm_source,
            "search_radius_used_m": self.search_radius_used_m,
            "final_dispatch_plan": self.final_dispatch_plan,
            "errors": self.errors,
            "risk_score": self.risk_score,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
            "priority_level": self.priority_level,
            "response_time": self.response_time,
            "total_ambulances": self.total_ambulances,
            "incident_data": self.incident_data,
        }
