from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.agents.analyzer import analyze
from app.agents.dispatcher import generate_dispatch
from app.agents.medical import find_hospitals
from app.agents.route_planner import plan_routes
from app.models.emergency_state import EmergencyState


class GraphState(TypedDict):
    state: EmergencyState


def _analyzer_node(graph_state: GraphState) -> GraphState:
    emergency_state = analyze(graph_state["state"])
    return {"state": emergency_state}


async def _medical_node(graph_state: GraphState) -> GraphState:
    emergency_state = await find_hospitals(graph_state["state"])
    return {"state": emergency_state}


async def _route_planner_node(graph_state: GraphState) -> GraphState:
    emergency_state = await plan_routes(graph_state["state"])
    return {"state": emergency_state}


def _resource_node(graph_state: GraphState) -> GraphState:
    emergency_state = generate_dispatch(graph_state["state"])
    emergency_state.final_dispatch_plan = {
        "event_type": emergency_state.event_type,
        "train_id": emergency_state.train_id,
        "severity": emergency_state.severity,
        "casualties": emergency_state.casualties,
        "priority_level": emergency_state.priority_level,
        "response_time": emergency_state.response_time,
        "total_ambulances": emergency_state.total_ambulances,
        "incident_location": {
            "lat": emergency_state.lat,
            "lon": emergency_state.lon,
        },
        "hospitals": emergency_state.hospitals,
        "allocations": emergency_state.allocations,
        "ambulance_routes": emergency_state.ambulance_routes,
        "dispatch_report": emergency_state.dispatch_report,
        "reasoning": emergency_state.reasoning,
        "errors": emergency_state.errors,
    }
    return {"state": emergency_state}


def build_emergency_graph():
    graph = StateGraph(GraphState)

    graph.add_node("analyzer", _analyzer_node)
    graph.add_node("medical", _medical_node)
    graph.add_node("route_planner", _route_planner_node)
    graph.add_node("resource", _resource_node)

    graph.set_entry_point("analyzer")
    graph.add_edge("analyzer", "medical")
    graph.add_edge("medical", "route_planner")
    graph.add_edge("route_planner", "resource")
    graph.add_edge("resource", END)

    return graph.compile()


_emergency_graph = None


def get_emergency_graph():
    global _emergency_graph
    if _emergency_graph is None:
        _emergency_graph = build_emergency_graph()
    return _emergency_graph


async def run_emergency_pipeline(state: EmergencyState) -> EmergencyState:
    graph = get_emergency_graph()
    result = await graph.ainvoke({"state": state})
    return result["state"]
