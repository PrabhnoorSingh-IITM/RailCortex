from __future__ import annotations

import pulp

from app.services.telemetry_simulator import TelemetrySimulator


def solve_train_rerouting(
    simulator: TelemetrySimulator,
    delay_multiplier: float = 1.5,
) -> tuple[dict[str, str], dict[str, float], dict]:
    """
    MILP-based train platforming / rerouting for weather disruption.
    Minimizes total delay while avoiding platform conflicts.
    """
    timetable_trains = simulator.trains
    if not timetable_trains:
        return {}, {}, {"status": "no_trains", "objective": 0}

    train_ids = [t.train_id for t in timetable_trains]
    platforms = sorted({t.platform for t in timetable_trains})
    path_options: dict[str, list[str]] = {}

    timetable_data = _load_timetable_entries()
    
    # Map base path_id to its alternates from timetable
    base_options = {}
    for entry in timetable_data:
        base_options[entry["default_path_id"]] = [
            entry["default_path_id"],
            entry.get("alternate_path_id", entry["default_path_id"]),
        ]

    for t in timetable_trains:
        path_options[t.train_id] = base_options.get(t.path_id, [t.path_id, t.path_id])

    problem = pulp.LpProblem("RailCortex_Train_Platforming", pulp.LpMinimize)

    use_alt = {
        train_id: pulp.LpVariable(f"alt_{train_id.replace('-', '_')}", cat="Binary")
        for train_id in train_ids
    }
    delay_vars = {
        train_id: pulp.LpVariable(f"delay_{train_id.replace('-', '_')}", lowBound=0, cat="Continuous")
        for train_id in train_ids
    }

    platform_usage = {}
    for platform in platforms:
        platform_trains = [t for t in timetable_trains if t.platform == platform]
        if len(platform_trains) > 1:
            platform_usage[platform] = pulp.LpVariable(
                f"conflict_p{platform}", lowBound=0, cat="Continuous"
            )

    base_delay = 120 * delay_multiplier
    problem += (
        pulp.lpSum(delay_vars[tid] for tid in train_ids)
        + pulp.lpSum(use_alt[tid] * 60 for tid in train_ids)
        + pulp.lpSum(platform_usage.values()) * 200
        if platform_usage
        else pulp.lpSum(delay_vars[tid] for tid in train_ids)
        + pulp.lpSum(use_alt[tid] * 60 for tid in train_ids),
        "Total_Delay",
    )

    for train_id in train_ids:
        problem += delay_vars[train_id] >= base_delay * 0.5

    for platform, conflict_var in platform_usage.items():
        problem += conflict_var >= 1
        alt_on_platform = [
            use_alt[t.train_id]
            for t in timetable_trains
            if t.platform == platform and path_options[t.train_id][1] != path_options[t.train_id][0]
        ]
        if alt_on_platform:
            problem += pulp.lpSum(alt_on_platform) >= 1

    problem.solve(pulp.PULP_CBC_CMD(msg=False))

    assignments: dict[str, str] = {}
    delay_map: dict[str, float] = {}
    total_delay = 0.0

    for t in timetable_trains:
        train_id = t.train_id
        alt_selected = bool(pulp.value(use_alt[train_id]))
        path_id = path_options[train_id][1] if alt_selected else path_options[train_id][0]
        assignments[train_id] = path_id
        delay_val = float(pulp.value(delay_vars[train_id]) or 0)
        delay_map[train_id] = delay_val
        total_delay += delay_val

    summary = {
        "status": pulp.LpStatus[problem.status],
        "objective": float(pulp.value(problem.objective) or 0),
        "total_delay_added_sec": total_delay,
        "trains_considered": len(train_ids),
        "solver": "PuLP_CBC",
    }

    return assignments, delay_map, summary


def _load_timetable_entries() -> list[dict]:
    from app.services.websocket_manager import load_json

    return load_json("timetable.json")["trains"]
