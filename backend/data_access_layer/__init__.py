"""
Data access layer: every raw parameterized SQL query in the backend lives
here, grouped by table into <table>_dal.py modules exposing a DAL-suffixed
class of static methods. See docs/mysql_scrpt.sql for the schema. Callers
(user_auth.py, ops_onboarding.py) own transaction boundaries and business
logic; DAL methods that participate in a multi-statement transaction take an
open cursor instead of managing their own connection.
"""
