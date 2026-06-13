"""CLI entry point for running the emergency pipeline without the API server."""

from app.agents.analyzer import analyze
from app.agents.dispatcher import generate_dispatch
from app.agents.medical import find_hospitals
from app.models.emergency_state import EmergencyState


async def run_cli():
    state = EmergencyState(
        peak_g_force=8.4,
        velocity_kmh=110,
        lat=26.4499,
        lon=80.3319,
        temperature=32,
        humidity=85,
        obstacle_distance=20,
    )

    state = analyze(state)
    state = await find_hospitals(state)
    state = generate_dispatch(state)

    print("=" * 50)
    print("RAILMIND AI EMERGENCY RESPONSE")
    print("=" * 50)
    print(f"\nSeverity: {state.severity}")
    print(f"Risk Score: {state.risk_score}")
    print(f"Confidence: {state.confidence}%")
    print("\nANALYSIS REASONING")
    print("-" * 50)
    for reason in state.reasoning:
        print(f"- {reason}")
    print("\nNearby Hospitals:")
    for idx, hospital in enumerate(state.hospitals, start=1):
        print(f"{idx}. {hospital['name']}")
    print("\nPATIENT ALLOCATION")
    print("-" * 50)
    for allocation in state.allocations:
        print(
            f"{allocation['hospital']} -> "
            f"{allocation['assigned_patients']} patients "
            f"({allocation['ambulances_dispatched']} ambulances)"
        )
    print("\nDISPATCH REPORT")
    print("-" * 50)
    print(f"Priority Level: {state.priority_level}")
    print(f"Response Time: {state.response_time}")
    print(f"Total Ambulances: {state.total_ambulances}")
    print("-" * 50)
    print(state.dispatch_report)


if __name__ == "__main__":
    import asyncio

    asyncio.run(run_cli())
