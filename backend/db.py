"""
Raw MySQL connection pool (mysql-connector-python). No ORM — every query in
this codebase is written and executed by hand with parameterized SQL. See
docs/mysql_scrpt.sql for the schema.

The pool is created lazily on first use, not at import time, so the app can
still start (and other routes that don't touch the DB still work) when the
DB env vars aren't set yet, same as OPENAI_API_KEY is only required once the
doctor agent is actually invoked.
"""

import os

import mysql.connector
from mysql.connector import pooling

_pool: pooling.MySQLConnectionPool | None = None


def _get_pool() -> pooling.MySQLConnectionPool:
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="medzen_pool",
            pool_size=5,
            host=os.environ["DB_HOST"],
            # Managed MySQL providers (Aiven, PlanetScale, etc.) assign a
            # random per-service port, not 3306 — DB_PORT is optional so
            # local/self-hosted MySQL on the standard port still works
            # without setting it.
            port=int(os.environ.get("DB_PORT", 3306)),
            user=os.environ["DB_USER"],
            password=os.environ["DB_PASSWORD"],
            database=os.environ["DB_NAME"],
        )
    return _pool


def get_connection() -> mysql.connector.MySQLConnection:
    return _get_pool().get_connection()
