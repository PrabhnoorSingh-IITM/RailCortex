import ollama

from app.config import get_settings


def _generate_with_openai(prompt: str) -> str | None:
    settings = get_settings()
    if not settings.openai_api_key:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model_full,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content
    except Exception:
        return None


def _generate_with_ollama(prompt: str) -> str:
    settings = get_settings()
    response = ollama.chat(
        model=settings.ollama_model,
        messages=[{"role": "user", "content": prompt}],
    )
    return response["message"]["content"]


def generate_dispatch(state):
    if state.severity == "HIGH":
        priority_level = "RED"
        response_time = "15 minutes"
    elif state.severity == "MEDIUM":
        priority_level = "ORANGE"
        response_time = "30 minutes"
    else:
        priority_level = "YELLOW"
        response_time = "60 minutes"

    total_ambulances = sum(
        allocation["ambulances_dispatched"] for allocation in state.allocations
    )

    allocation_summary = []
    for allocation in state.allocations:
        allocation_summary.append(
            f"""
Hospital: {allocation['hospital']}
Patients: {allocation['assigned_patients']}
Ambulances: {allocation['ambulances_dispatched']}
"""
        )

    allocation_text = "\n".join(allocation_summary)

    prompt = f"""
You are an Indian Railway Emergency Commander.

Incident Information:

Severity: {state.severity}
Risk Score: {state.risk_score}
Confidence: {state.confidence}%

Casualties: {state.casualties}

Reasons:
{chr(10).join(state.reasoning)}

Priority Level:
{priority_level}

Response Time:
{response_time}

Hospital Allocations:

{allocation_text}

Generate ONLY:

1. Immediate Actions
2. Operational Risks
3. Executive Summary

Keep response concise and professional.
Do NOT generate priority levels.
Do NOT generate response times.
"""

    try:
        ai_report = _generate_with_openai(prompt)
        if not ai_report:
            ai_report = _generate_with_ollama(prompt)
    except Exception as exc:
        ai_report = (
            f"Emergency dispatch initiated. Priority {priority_level}. "
            f"{total_ambulances} ambulances allocated across "
            f"{len(state.allocations)} hospitals. (LLM unavailable: {exc})"
        )

    state.priority_level = priority_level
    state.response_time = response_time
    state.total_ambulances = total_ambulances
    state.dispatch_report = ai_report

    return state
