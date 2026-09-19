"""
Doctor Availability Agent — standalone interactive CLI (proof of concept).

Fully self-contained: no imports from the rest of the backend. Copy this one
file anywhere and run it.

Setup:
    pip install openai colorama python-dotenv
    # then provide your key, either way:
    #   1) put OPENAI_API_KEY=sk-... in a .env file next to (or above) this file
    #   2) or export it in your shell (see README steps below)

Run:
    python cli.py
"""

import json
import os

from openai import OpenAI

# Optional: pick up OPENAI_API_KEY from a .env file if python-dotenv is installed.
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

# ---------------------------------------------------------------------------
# 1. STATIC DATA
# ---------------------------------------------------------------------------
DOCTORS = [
    {
        "name": "Dr. Anjali Rao",
        "specialty": "Cardiologist",
        "location": "Ratnagiri Heart Clinic",
        "availability": {
            "Monday": ["10:00 AM - 1:00 PM"],
            "Wednesday": ["10:00 AM - 1:00 PM"],
            "Friday": ["4:00 PM - 7:00 PM"],
        },
        "fee": "₹800",
    },
    {
        "name": "Dr. Suresh Patil",
        "specialty": "General Physician",
        "location": "City Health Center",
        "availability": {
            "Monday": ["9:00 AM - 12:00 PM", "5:00 PM - 8:00 PM"],
            "Tuesday": ["9:00 AM - 12:00 PM"],
            "Thursday": ["9:00 AM - 12:00 PM"],
            "Saturday": ["9:00 AM - 1:00 PM"],
        },
        "fee": "₹400",
    },
    {
        "name": "Dr. Meera Joshi",
        "specialty": "Pediatrician",
        "location": "Sunrise Children's Hospital",
        "availability": {
            "Tuesday": ["11:00 AM - 2:00 PM"],
            "Thursday": ["11:00 AM - 2:00 PM"],
            "Saturday": ["10:00 AM - 1:00 PM"],
        },
        "fee": "₹600",
    },
    {
        "name": "Dr. Farhan Sheikh",
        "specialty": "Dermatologist",
        "location": "Skin & Care Clinic",
        "availability": {
            "Wednesday": ["3:00 PM - 6:00 PM"],
            "Friday": ["3:00 PM - 6:00 PM"],
        },
        "fee": "₹700",
    },
    {
        "name": "Dr. Vikram Desai",
        "specialty": "Orthopedic",
        "location": "Desai Bone & Joint Clinic",
        "availability": {
            "Monday": ["11:00 AM - 2:00 PM"],
            "Thursday": ["11:00 AM - 2:00 PM"],
        },
        "fee": "₹900",
    },
    {
        "name": "Dr. Priya Nair",
        "specialty": "Ophthalmologist",
        "location": "Nair Eye Care Center",
        "availability": {
            "Tuesday": ["10:00 AM - 1:00 PM"],
            "Friday": ["10:00 AM - 1:00 PM"],
            "Saturday": ["2:00 PM - 5:00 PM"],
        },
        "fee": "₹500",
    },
    {
        "name": "Dr. Arjun Mehta",
        "specialty": "ENT Specialist",
        "location": "Mehta ENT & Allergy Clinic",
        "availability": {
            "Monday": ["4:00 PM - 7:00 PM"],
            "Wednesday": ["4:00 PM - 7:00 PM"],
        },
        "fee": "₹550",
    },
    {
        "name": "Dr. Kavita Shah",
        "specialty": "Dentist",
        "location": "Shah Dental Studio",
        "availability": {
            "Wednesday": ["10:00 AM - 1:00 PM"],
            "Friday": ["10:00 AM - 1:00 PM"],
            "Saturday": ["9:00 AM - 12:00 PM"],
        },
        "fee": "₹450",
    },
    {
        "name": "Dr. Rohan Kulkarni",
        "specialty": "OPD",
        "location": "OPD Block",
        "availability": {
            "Monday": ["8:00 AM - 11:00 AM"],
            "Tuesday": ["8:00 AM - 11:00 AM"],
            "Wednesday": ["8:00 AM - 11:00 AM"],
            "Thursday": ["8:00 AM - 11:00 AM"],
            "Friday": ["8:00 AM - 11:00 AM"],
            "Saturday": ["8:00 AM - 11:00 AM"],
        },
        "fee": "₹300",
    },
    {
        "name": "Dr. Sneha Iyer",
        "specialty": "OPD",
        "location": "OPD Block",
        "availability": {
            "Monday": ["5:00 PM - 8:00 PM"],
            "Tuesday": ["5:00 PM - 8:00 PM"],
            "Wednesday": ["5:00 PM - 8:00 PM"],
            "Thursday": ["5:00 PM - 8:00 PM"],
            "Friday": ["5:00 PM - 8:00 PM"],
        },
        "fee": "₹300",
    },
]

SYSTEM_PROMPT = """You are a helpful clinic front-desk assistant.
Answer questions about doctor availability using ONLY the JSON data
provided below. Never invent doctors, specialties, timings, or fees
that aren't in the data. If the answer isn't in the data, say so
clearly and suggest what info you do have.

DOCTOR DATA (JSON):
{doctor_data}

Keep answers short and conversational (1-3 sentences).
"""


# ---------------------------------------------------------------------------
# 2. AGENT — thin wrapper around the OpenAI Chat Completions API
# ---------------------------------------------------------------------------
class DoctorAvailabilityAgentOpenAI:
    def __init__(self, doctors, api_key=None, model="gpt-4o-mini"):
        self.model = model
        key = api_key or os.environ.get("OPENAI_API_KEY")
        if not key:
            raise ValueError(
                "No OpenAI API key found. Set the OPENAI_API_KEY environment "
                "variable or put it in a .env file."
            )
        self.client = OpenAI(api_key=key)
        system_prompt = SYSTEM_PROMPT.format(doctor_data=json.dumps(doctors, indent=2))
        self.history = [{"role": "system", "content": system_prompt}]

    def ask(self, question: str) -> str:
        self.history.append({"role": "user", "content": question})
        response = self.client.chat.completions.create(
            model=self.model,
            messages=self.history,
            temperature=0.2,
        )
        answer = response.choices[0].message.content.strip()
        self.history.append({"role": "assistant", "content": answer})
        return answer


# ---------------------------------------------------------------------------
# 3. INTERACTIVE CHAT
# ---------------------------------------------------------------------------
def print_banner(Fore, Style):
    print(Fore.CYAN + Style.BRIGHT + "=" * 56)
    print(Fore.CYAN + Style.BRIGHT + "  Doctor Availability Agent (OpenAI-powered)")
    print(Fore.CYAN + Style.BRIGHT + "=" * 56)
    print(Fore.YELLOW + "Ask about doctor availability, specialties, or fees.")
    print(Fore.YELLOW + "Type 'exit' or 'quit' to end the chat.\n")


def main():
    from colorama import init as colorama_init, Fore, Style

    colorama_init(autoreset=True)

    try:
        agent = DoctorAvailabilityAgentOpenAI(DOCTORS)
    except ValueError as e:
        print(Fore.RED + Style.BRIGHT + f"Error: {e}")
        raise SystemExit(1)

    print_banner(Fore, Style)

    while True:
        try:
            user_q = input(Fore.GREEN + Style.BRIGHT + "You: " + Style.RESET_ALL)
        except (EOFError, KeyboardInterrupt):
            print(Fore.MAGENTA + "\nGoodbye!")
            break

        if not user_q.strip():
            continue
        if user_q.strip().lower() in {"exit", "quit"}:
            print(Fore.MAGENTA + Style.BRIGHT + "Goodbye!")
            break

        try:
            answer = agent.ask(user_q)
        except Exception as e:
            print(Fore.RED + Style.BRIGHT + f"Error: {e}\n")
            continue

        print(Fore.BLUE + Style.BRIGHT + "Agent: " + Style.RESET_ALL + answer + "\n")


if __name__ == "__main__":
    main()
