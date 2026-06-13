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

    severity: str = ""

    casualties: int = 0

    hospitals: list = field(default_factory=list)

    allocations: list = field(default_factory=list)

    dispatch_report: str = ""

    risk_score: float = 0

    confidence: float = 0

    reasoning: list = field(default_factory=list)

    priority_level: str = ""

    response_time: str = ""

    total_ambulances: int = 0

    def to_dict(self):

        return {
            "severity": self.severity,
            "casualties": self.casualties,
            "hospitals": self.hospitals,
            "allocations": self.allocations,
            "dispatch_report": self.dispatch_report,
            "risk_score": self.risk_score,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
            "priority_level": self.priority_level,
            "response_time": self.response_time,
            "total_ambulances": self.total_ambulances,
        }
    