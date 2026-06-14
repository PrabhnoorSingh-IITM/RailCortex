from pydantic import BaseModel, Field

import ollama

from app.config import get_settings


class DispatchReportStructured(BaseModel):
    immediate_actions: list[str] = Field(
        min_length=1,
        description="Ordered list of immediate operational actions",
    )
    operational_risks: list[str] = Field(
        min_length=1,
        description="Key operational risks for this incident",
    )
    executive_summary: str = Field(
        min_length=10,
        description="Concise executive summary for railway command",
    )


def _build_prompt(state, priority_level: str, response_time: str, allocation_text: str) -> str:
    return f"""
You are an Indian Railway Emergency Commander.

Incident Information:
Severity: {state.severity}
Risk Score: {state.risk_score}
Confidence: {state.confidence}%
Casualties: {state.casualties}

Model Reasoning:
{chr(10).join(state.reasoning)}

Priority Level: {priority_level}
Response Time: {response_time}

Hospital Allocations:
{allocation_text}

Return a structured incident report with immediate_actions, operational_risks, and executive_summary.
Keep each bullet concise and professional.
Do NOT invent priority levels or response times beyond those provided.
"""


def _generate_with_openai(prompt: str) -> tuple[DispatchReportStructured | None, str | None]:
    settings = get_settings()
    if not settings.openai_api_key:
        return None, "OpenAI API key not configured"

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        response = client.beta.chat.completions.parse(
            model=settings.openai_model_full,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}],
            response_format=DispatchReportStructured,
        )
        parsed = response.choices[0].message.parsed
        if parsed:
            return parsed, None
        return None, "OpenAI returned empty structured response"
    except Exception as exc:
        return None, f"OpenAI error: {exc}"


def _generate_with_ollama(prompt: str) -> tuple[DispatchReportStructured | None, str | None]:
    settings = get_settings()
    try:
        response = ollama.chat(
            model=settings.ollama_model,
            messages=[
                {
                    "role": "user",
                    "content": (
                        prompt
                        + "\n\nRespond ONLY with valid JSON matching keys: "
                        "immediate_actions (array), operational_risks (array), executive_summary (string)."
                    ),
                }
            ],
            format=DispatchReportStructured.model_json_schema(),
        )
        content = response["message"]["content"]
        return DispatchReportStructured.model_validate_json(content), None
    except Exception as exc:
        return None, f"Ollama error: {exc}"


def _format_report_text(report: DispatchReportStructured) -> str:
    actions = "\n".join(f"- {item}" for item in report.immediate_actions)
    risks = "\n".join(f"- {item}" for item in report.operational_risks)
    return (
        "IMMEDIATE ACTIONS\n"
        f"{actions}\n\n"
        "OPERATIONAL RISKS\n"
        f"{risks}\n\n"
        "EXECUTIVE SUMMARY\n"
        f"{report.executive_summary}"
    )


def _fallback_report(
    state,
    priority_level: str,
    total_ambulances: int,
    errors: list[str],
) -> DispatchReportStructured:
    return DispatchReportStructured(
        immediate_actions=[
            f"Activate {priority_level} priority emergency protocol",
            f"Dispatch {total_ambulances} ambulances to allocated hospitals",
            "Secure incident site and halt adjacent rail traffic",
        ],
        operational_risks=[
            "Hospital capacity may be exceeded under current casualty estimate",
            "Route ETAs may increase if live traffic or weather deteriorates",
        ],
        executive_summary=(
            f"Emergency response initiated for train {state.train_id} with "
            f"{state.severity} severity and {state.casualties} estimated casualties. "
            f"LLM unavailable ({'; '.join(errors)}); using rule-based dispatch report."
        ),
    )


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
            f"Hospital: {allocation['hospital']}\n"
            f"Patients: {allocation['assigned_patients']}\n"
            f"Ambulances: {allocation['ambulances_dispatched']}"
        )
    allocation_text = "\n".join(allocation_summary)
    prompt = _build_prompt(state, priority_level, response_time, allocation_text)

    llm_errors: list[str] = []
    structured_report: DispatchReportStructured | None = None
    llm_source = ""

    structured_report, openai_error = _generate_with_openai(prompt)
    if structured_report:
        llm_source = "openai"
    else:
        if openai_error:
            llm_errors.append(openai_error)
        structured_report, ollama_error = _generate_with_ollama(prompt)
        if structured_report:
            llm_source = "ollama"
        elif ollama_error:
            llm_errors.append(ollama_error)

    if not structured_report:
        structured_report = _fallback_report(state, priority_level, total_ambulances, llm_errors)
        llm_source = "fallback"
        state.errors.extend(llm_errors)

    state.priority_level = priority_level
    state.response_time = response_time
    state.total_ambulances = total_ambulances
    state.dispatch_report_structured = structured_report.model_dump()
    state.dispatch_report = _format_report_text(structured_report)
    state.llm_source = llm_source

    return state
