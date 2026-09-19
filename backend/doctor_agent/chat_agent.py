"""
Doctor Availability Agent — OpenAI-powered version
----------------------------------------------------
Questions about the static DOCTORS dataset are answered by an LLM (OpenAI
Chat Completions) instead of hand-written keyword rules. The static data is
serialized and injected into the system prompt, so the model can only answer
from what's actually in DOCTORS (grounded, no invented facts).

Used by backend/doctor_agent/service.py to back the /api/agent/* endpoints.
For a standalone interactive CLI demo, see backend/poc/cli.py.
"""

import os
import json
from openai import OpenAI

from .doctors_data import DOCTORS

SYSTEM_PROMPT = """You are a helpful clinic front-desk assistant.
Answer questions about doctor availability using ONLY the JSON data
provided below. Never invent doctors, specialties, timings, or fees
that aren't in the data. If the answer isn't in the data, say so
clearly and suggest what info you do have.

DOCTOR DATA (JSON):
{doctor_data}

Keep answers short and conversational (1-3 sentences).
"""


class DoctorAvailabilityAgentOpenAI:
    def __init__(self, doctors, api_key=None, model="gpt-4o-mini"):
        self.doctors = doctors
        self.model = model
        # Prefer an explicitly passed key; otherwise read from env var.
        key = api_key or os.environ.get("OPENAI_API_KEY")
        if not key:
            raise ValueError(
                "No OpenAI API key found. Set the OPENAI_API_KEY environment "
                "variable or pass api_key=... when creating the agent."
            )
        self.client = OpenAI(api_key=key)
        self.system_prompt = SYSTEM_PROMPT.format(
            doctor_data=json.dumps(self.doctors, indent=2)
        )
        self.history = [{"role": "system", "content": self.system_prompt}]

    def ask(self, question: str) -> str:
        self.history.append({"role": "user", "content": question})

        print(f"[chat_agent] LLM input (model={self.model}):\n{json.dumps(self.history, indent=2)}")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=self.history,
            temperature=0.2,
        )
        answer = response.choices[0].message.content.strip()

        print(f"[chat_agent] LLM output: {answer!r}")
        print(f"[chat_agent] LLM usage: {response.usage}")

        self.history.append({"role": "assistant", "content": answer})
        return answer
