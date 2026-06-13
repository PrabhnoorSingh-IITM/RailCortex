def find_hospitals(state):

    hospitals = [
        {
            "name": "AIIMS Delhi",
            "city": "Delhi",
            "capacity": 25,
            "ambulances": 8,
            "trauma_level": 1,
            "lat": 28.5672,
            "lon": 77.2100
        },
        {
            "name": "Safdarjung Hospital",
            "city": "Delhi",
            "capacity": 20,
            "ambulances": 5,
            "trauma_level": 1,
            "lat": 28.5677,
            "lon": 77.2058
        },
        {
            "name": "RML Hospital",
            "city": "Delhi",
            "capacity": 15,
            "ambulances": 3,
            "trauma_level": 2,
            "lat": 28.6258,
            "lon": 77.2130
        }
    ]

    casualties_remaining = state.casualties

    allocations = []

    for hospital in hospitals:

        if casualties_remaining <= 0:
            break

        assigned = min(
            hospital["capacity"],
            casualties_remaining
        )

        ambulance_count = max(
            1,
            assigned // 4
        )

        allocations.append(
            {
                "hospital": hospital["name"],
                "assigned_patients": assigned,
                "ambulances_dispatched": ambulance_count,
                "trauma_level": hospital["trauma_level"]
            }
        )

        casualties_remaining -= assigned

    state.hospitals = hospitals
    state.allocations = allocations

    return state