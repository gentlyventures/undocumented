import sqlite3

def load_employee_records(db_path: str, employee_id: str):
    """Mock database operation fetching employee meeting frequency and DISC profiles."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name, disc_profile, meeting_frequency FROM employees WHERE id = ?", (employee_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"name": row[0], "disc": row[1], "frequency": row[2]}
    return None
