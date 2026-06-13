import ollama


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
        allocation["ambulances_dispatched"]
        for allocation in state.allocations
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

    allocation_text = "\n".join(
        allocation_summary
    )

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

        response = ollama.chat(
            model="llama3.2:latest",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        ai_report = response[
            "message"
        ]["content"]

    except Exception as e:

        ai_report = (
            f"Ollama Error: {str(e)}"
        )

    state.priority_level = priority_level

    state.response_time = response_time

    state.total_ambulances = total_ambulances

    state.dispatch_report = ai_report

    return state