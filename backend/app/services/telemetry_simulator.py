from __future__ import annotations

import copy
from dataclasses import dataclass, field

from app.schemas.telemetry import TrainTripPayload
from app.services.websocket_manager import load_json


@dataclass
class TrainState:
    train_id: str
    name: str
    route_color: list[int]
    path: list[list[float]]
    timestamps: list[float]
    platform: int
    speed_kmh: float
    path_id: str
    progress: float = 0.0
    delay_offset: float = 0.0
    current_index: int = 0

    def to_payload(self) -> TrainTripPayload:
        adjusted_timestamps = [t + self.delay_offset for t in self.timestamps]
        return TrainTripPayload(
            train_id=self.train_id,
            route_color=self.route_color,
            path=self.path,
            timestamps=adjusted_timestamps,
            current_index=self.current_index,
            delay_offset=self.delay_offset,
            speed_kmh=self.speed_kmh,
            platform=self.platform,
        )


@dataclass
class TelemetrySimulator:
    trains: list[TrainState] = field(default_factory=list)
    weather_active: bool = False
    last_optimization: dict = field(default_factory=dict)
    last_live_weather: dict | None = None

    def load_from_static_data(self) -> None:
        timetable = load_json("timetable.json")
        routes = load_json("routes.json")
        self.trains = []

        real_train_numbers = ["12723", "22416", "12724", "12707", "15909", "18242", "11266", "58702", "54703", "07509", "09416", "19417", "09427", "09018", "14804", "04804", "09421", "19130", "02713", "19420"]
        train_index = 0

        for entry in timetable["trains"]:
            route = routes[entry["default_path_id"]]
            # Generate 8 variants per route to simulate a busy network
            for i in range(8):
                # Calculate slight spatial offset to make trains look distinct on the map
                lat_offset = (i * 0.005) * (-1 if i % 2 == 0 else 1)
                lon_offset = (i * 0.003) * (-1 if i % 3 == 0 else 1)
                
                offset_path = [
                    [lon + lon_offset, lat + lat_offset] 
                    for lon, lat in route["path"]
                ]
                
                # Vary speed slightly
                speed_mod = entry["speed_kmh"] + (i * 5)
                
                # Vary initial progress
                prog_offset = i * 25.0

                real_id = real_train_numbers[train_index % len(real_train_numbers)]
                train_index += 1
                
                self.trains.append(
                    TrainState(
                        train_id=f"TRN-{real_id}",
                        name=f"Exp {real_id}",
                        route_color=[(entry["route_color"][0] + i*20)%255, (entry["route_color"][1] + i*15)%255, (entry["route_color"][2] + i*10)%255],
                        path=offset_path,
                        timestamps=copy.deepcopy(route["timestamps"]),
                        platform=entry["platform"],
                        speed_kmh=speed_mod,
                        path_id=entry["default_path_id"],
                        progress=prog_offset
                    )
                )

    def tick(self) -> list[TrainTripPayload]:
        for train in self.trains:
            train.progress += 1.0
            if train.timestamps:
                max_time = max(train.timestamps) + train.delay_offset
                if train.progress > max_time:
                    train.progress = 0.0
                    train.current_index = 0
                else:
                    for idx, ts in enumerate(train.timestamps):
                        if train.progress <= ts + train.delay_offset:
                            train.current_index = max(0, idx - 1)
                            break
                    else:
                        train.current_index = len(train.timestamps) - 1
        return [train.to_payload() for train in self.trains]

    def apply_rerouting(self, assignments: dict[str, str], delay_map: dict[str, float]) -> int:
        routes = load_json("routes.json")
        rerouted = 0

        for train in self.trains:
            new_path_id = assignments.get(train.train_id)
            if new_path_id and new_path_id in routes:
                route = routes[new_path_id]
                train.path = copy.deepcopy(route["path"])
                train.timestamps = copy.deepcopy(route["timestamps"])
                train.path_id = new_path_id
                train.progress = 0.0
                train.current_index = 0
                rerouted += 1

            delay = delay_map.get(train.train_id, 0.0)
            if delay:
                train.delay_offset += delay

        return rerouted

    def reset(self) -> None:
        self.weather_active = False
        self.last_optimization = {}
        self.last_live_weather = None
        self.load_from_static_data()


telemetry_simulator = TelemetrySimulator()
