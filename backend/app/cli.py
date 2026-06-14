"""CLI entry point for running the emergency pipeline without the API server."""

import asyncio

from app.agents.graph import run_emergency_pipeline
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

    state = await run_emergency_pipeline(state)

    print("=" * 50)
    print("RAILMIND AI EMERGENCY RESPONSE")
    print("=" * 50)
    print(f"\nSeverity: {state.severity}")
    print(f"Risk Score: {state.risk_score}")
    print(f"Confidence: {state.confidence}%")
    print(f"LLM Source: {state.llm_source}")
    print("\nANALYSIS REASONING")
    print("-" * 50)
    for reason in state.reasoning:
        print(f"- {reason}")
    print("\nNearby Hospitals:")
    for idx, hospital in enumerate(state.hospitals, start=1):
        print(
            f"{idx}. {hospital['name']} ({hospital.get('source', 'unknown')}, "
            f"{hospital.get('distance_km', '?')} km)"
        )
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
    if state.errors:
        print("\nWARNINGS")
        print("-" * 50)
        for error in state.errors:
            print(f"- {error}")


if __name__ == "__main__":
    asyncio.run(run_cli())
