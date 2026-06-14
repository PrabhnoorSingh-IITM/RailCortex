from __future__ import annotations

import logging

from pydantic import BaseModel, Field

import ollama

from app.config import get_settings

logger = logging.getLogger(__name__)


class DispatchReportStructured(BaseModel):
    """Structured dispatch report with immediate actions and risk assessment."""
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
    """Build LLM prompt for incident dispatch report generation."""
    reasoning_text = "\n".join([f"  - {r}" for r in state.reasoning[:5]])
    
    return f"""You are an Indian Railway Emergency Commander responding to a critical incident.

INCIDENT DETAILS:
  Train ID: {state.train_id}
  Event Type: {state.event_type}
  Severity: {state.severity}
  Risk Score: {state.risk_score}
  Confidence: {state.confidence}%
  Estimated Casualties: {state.casualties}

MODEL ANALYSIS:
{reasoning_text}

RESPONSE PARAMETERS:
  Priority Level: {priority_level}
  Response Target: {response_time}

HOSPITAL ALLOCATIONS:
{allocation_text}

INSTRUCTIONS:
Generate a structured dispatch report with:
1. immediate_actions: Ordered list of critical actions (3-5 items)
2. operational_risks: Key risks to monitor (2-4 items)
3. executive_summary: Brief summary for railway command

Format: Return ONLY valid JSON with these exact keys.
Keep descriptions concise and professional.
Do NOT invent resources or timelines beyond those provided."""


def _generate_with_openai(prompt: str) -> tuple[DispatchReportStructured | None, str | None]:
    """Generate dispatch report using OpenAI API with structured output."""
    settings = get_settings()
    if not settings.openai_api_key:
        logger.debug("OpenAI API key not configured")
        return None, "OpenAI API key not configured"

    try:
        from openai import OpenAI, APIError

        client = OpenAI(api_key=settings.openai_api_key)
        
        logger.debug(f"Calling OpenAI with model {settings.openai_model_full}")
        response = client.beta.chat.completions.parse(
            model=settings.openai_model_full,
            temperature=0.2,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
            response_format=DispatchReportStructured,
        )
        
        parsed = response.choices[0].message.parsed
        if not parsed:
            logger.warning("OpenAI returned empty parsed response")
            return None, "OpenAI returned empty structured response"
        
        logger.info("Successfully generated dispatch report via OpenAI")
        return parsed, None
        
    except APIError as exc:
        error_msg = f"OpenAI API error: {str(exc)[:100]}"
        logger.error(error_msg)
        return None, error_msg
    except Exception as exc:
        error_msg = f"OpenAI error: {str(exc)[:100]}"
        logger.error(error_msg, exc_info=exc)
        return None, error_msg


def _generate_with_ollama(prompt: str) -> tuple[DispatchReportStructured | None, str | None]:
    """Generate dispatch report using local Ollama LLM with JSON schema."""
    settings = get_settings()
    
    try:
        logger.debug(f"Calling Ollama with model {settings.ollama_model}")
        response = ollama.chat(
            model=settings.ollama_model,
            messages=[
                {
                    "role": "user",
                    "content": (
                        prompt
                        + "\n\nRETURN ONLY VALID JSON WITH THESE KEYS:\n"
                        "immediate_actions (array of strings)\n"
                        "operational_risks (array of strings)\n"
                        "executive_summary (string)"
                    ),
                }
            ],
            format=DispatchReportStructured.model_json_schema(),
            stream=False,
        )
        
        content = response.get("message", {}).get("content", "")
        if not content:
            logger.warning("Ollama returned empty content")
            return None, "Ollama returned empty response"
        
        parsed = DispatchReportStructured.model_validate_json(content)
        logger.info("Successfully generated dispatch report via Ollama")
        return parsed, None
        
    except ValueError as exc:
        error_msg = f"Ollama JSON parsing error: {str(exc)[:100]}"
        logger.warning(error_msg)
        return None, error_msg
    except Exception as exc:
        error_msg = f"Ollama error: {str(exc)[:100]}"
        logger.error(error_msg, exc_info=exc)
        return None, error_msg


def _format_report_text(report: DispatchReportStructured) -> str:
    """Format structured report into readable text."""
    actions = "\n".join(f"  • {item}" for item in report.immediate_actions)
    risks = "\n".join(f"  • {item}" for item in report.operational_risks)
    
    return (
        "═══════════════════════════════════════\n"
        "      IMMEDIATE ACTIONS\n"
        "═══════════════════════════════════════\n"
        f"{actions}\n\n"
        "═══════════════════════════════════════\n"
        "      OPERATIONAL RISKS\n"
        "═══════════════════════════════════════\n"
        f"{risks}\n\n"
        "═══════════════════════════════════════\n"
        "      EXECUTIVE SUMMARY\n"
        "═══════════════════════════════════════\n"
        f"{report.executive_summary}"
    )


def _fallback_report(
    state,
    priority_level: str,
    total_ambulances: int,
    errors: list[str],
) -> DispatchReportStructured:
    """Generate rule-based fallback report when LLM unavailable."""
    error_summary = "; ".join(errors) if errors else "LLM service unavailable"
    
    additional_actions = []
    if state.severity == "HIGH":
        additional_actions = [
            "Contact railway accident relief commissioner",
            "Activate medical relief train (if near major route)",
        ]
    elif state.severity == "MEDIUM":
        additional_actions = ["Prepare backup medical team on standby"]
    
    return DispatchReportStructured(
        immediate_actions=[
            f"Activate {priority_level} priority emergency protocol",
            f"Dispatch {total_ambulances} ambulances to {len(state.allocations)} allocated hospitals",
            "Secure incident site and halt adjacent rail traffic",
            "Establish communication link with all hospital coordinators",
        ] + additional_actions,
        operational_risks=[
            f"Hospital capacity risk: {state.casualties} casualties vs available beds",
            "Route ETAs may increase with live traffic or weather deterioration",
            "Ambulance availability may be limited in rural/remote areas",
            f"Incident complexity: {state.event_type} with {state.severity} severity",
        ],
        executive_summary=(
            f"Emergency response initiated for train {state.train_id} at ({state.lat:.2f}°N, {state.lon:.2f}°E). "
            f"Severity: {state.severity}, Casualties: {state.casualties}, Hospitals: {len(state.allocations)}. "
            f"Status: LLM unavailable ({error_summary}); using rule-based dispatch protocol."
        ),
    )


def generate_dispatch(state):
    """
    Generate dispatch report with priority level and resource allocation.
    Uses OpenAI → Ollama → Fallback for robustness.
    """
    # Determine priority level and response time
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

    # Format allocation details
    allocation_summary = []
    for allocation in state.allocations:
        allocation_summary.append(
            f"  Hospital: {allocation['hospital']} ({allocation.get('hospital_city', 'Unknown')})\n"
            f"  Patients: {allocation['assigned_patients']}\n"
            f"  Ambulances: {allocation['ambulances_dispatched']}\n"
            f"  Trauma Level: Level {allocation['trauma_level']}"
        )
    allocation_text = "\n".join(allocation_summary)
    
    prompt = _build_prompt(state, priority_level, response_time, allocation_text)

    llm_errors: list[str] = []
    structured_report: DispatchReportStructured | None = None
    llm_source = ""

    logger.info(f"Generating dispatch report for severity={state.severity}, casualties={state.casualties}")

    # Try OpenAI first
    structured_report, openai_error = _generate_with_openai(prompt)
    if structured_report:
        llm_source = "openai"
    else:
        if openai_error:
            llm_errors.append(openai_error)
        
        # Fallback to Ollama
        structured_report, ollama_error = _generate_with_ollama(prompt)
        if structured_report:
            llm_source = "ollama"
        elif ollama_error:
            llm_errors.append(ollama_error)

    # Last resort: rule-based fallback
    if not structured_report:
        logger.warning(f"Both LLM attempts failed; using fallback. Errors: {llm_errors}")
        structured_report = _fallback_report(state, priority_level, total_ambulances, llm_errors)
        llm_source = "fallback_rule_based"
        state.errors.extend(llm_errors)

    # Populate state with generated report
    state.priority_level = priority_level
    state.response_time = response_time
    state.total_ambulances = total_ambulances
    state.dispatch_report_structured = structured_report.model_dump()
    state.dispatch_report = _format_report_text(structured_report)
    state.llm_source = llm_source

    logger.info(f"Dispatch report generated via {llm_source}")
    return state
