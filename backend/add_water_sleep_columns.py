"""
Migration script to add water_intake and sleep_hours columns to body_stats table
Run this script once to update the database schema
"""
import sqlite3

# Connect to the database
conn = sqlite3.connect('lifelog.db')
cursor = conn.cursor()

try:
    # Add water_intake column
    cursor.execute('''
        ALTER TABLE body_stats ADD COLUMN water_intake REAL;
    ''')
    print("[OK] Added water_intake column")
except sqlite3.OperationalError as e:
    print(f"[SKIP] water_intake column: {e}")

try:
    # Add sleep_hours column
    cursor.execute('''
        ALTER TABLE body_stats ADD COLUMN sleep_hours REAL;
    ''')
    print("[OK] Added sleep_hours column")
except sqlite3.OperationalError as e:
    print(f"[SKIP] sleep_hours column: {e}")

conn.commit()
conn.close()

print("\n[DONE] Migration complete!")

