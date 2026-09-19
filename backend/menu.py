"""
Role-based sidebar menu configuration.
"""

MENU_ITEMS = {
    "receptionist": [
        {"key": "dashboard", "label": "📅 New Appointment"},
        {"key": None, "label": "🗂️ Patient Records"},
        {"key": "agent", "label": "🤖 AI Assistant"},
        {"key": "help", "label": "📘 Help Docs"},
    ],
    "doctor": [
        {"key": "dashboard", "label": "🩺 Today's Queue"},
        {"key": "agent", "label": "🤖 AI Assistant"},
        {"key": "help", "label": "📘 Help Docs"},
    ],
    "admin": [
        {"key": "dashboard", "label": "📅 New Appointment"},
        {"key": None, "label": "🗂️ Patient Records"},
        {"key": None, "label": "👨‍⚕️ Doctor Rosters"},
        {"key": "agent", "label": "🤖 AI Assistant"},
        {"key": None, "label": "⚙️ Settings"},
        {"key": "help", "label": "📘 Help Docs"},
    ],
}


def get_menu_items(role: str):
    return MENU_ITEMS.get(role, MENU_ITEMS["receptionist"])
