# database_setup.py
import mysql.connector
from mysql.connector import Error
import config
import os

def create_database(host, user, password, db_name):
    """Creates the specified database if it doesn't exist."""
    try:
        conn = mysql.connector.connect(host=host, user=user, password=password)
        if conn.is_connected():
            cursor = conn.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
            print(f"Database '{db_name}' ensured to exist.")
    except Error as e:
        print(f"Error creating database: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

def execute_sql_script(db_config, script_path):
    """Executes an SQL script file."""
    conn = None
    try:
        conn = mysql.connector.connect(**db_config)
        if conn.is_connected():
            cursor = conn.cursor()
            with open(script_path, 'r') as f:
                sql_script = f.read()
            # MySQL connector can execute multi-statement scripts, but better to split for robust error handling
            # If your schema.sql has comments or specific MySQL commands that don't split well,
            # consider using cursor.execute(statement) line by line, or ensure the connector handles it.
            # For simplicity, we'll try to execute the whole script.
            # A more robust way might be to split by semicolon and execute each statement.
            for statement in sql_script.split(';'):
                if statement.strip(): # Ensure not to execute empty statements
                    try:
                        cursor.execute(statement)
                        print(f"Executed SQL statement: {statement.strip().splitlines()[0]}...")
                    except Error as stmt_err:
                        # Log error but try to continue with other statements if possible
                        print(f"Error executing statement: {stmt_err} for: {statement.strip().splitlines()[0]}...")
            conn.commit()
            print(f"SQL script '{script_path}' executed successfully.")
    except Error as e:
        print(f"Error executing SQL script: {e}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def create_user(db_config, username, password, access_type="reader"):
    """Creates a user with specified privileges."""
    conn = None
    try:
        # Connect as a root/admin user to create other users
        root_conn = mysql.connector.connect(
            host=db_config["host"],
            user=db_config["user"], # This should be the root/admin user
            password=db_config["password"]
        )
        cursor = root_conn.cursor()

        # Drop user if exists to ensure clean setup
        cursor.execute(f"DROP USER IF EXISTS '{username}'@'localhost'")
        print(f"User '{username}' dropped if existed.")

        # Create user
        cursor.execute(f"CREATE USER '{username}'@'localhost' IDENTIFIED BY '{password}'")
        print(f"User '{username}' created.")

        # Grant privileges
        if access_type == "admin":
            # Admin gets full privileges on the specific database
            cursor.execute(f"GRANT ALL PRIVILEGES ON {db_config['database']}.* TO '{username}'@'localhost'")
            print(f"Granted ADMIN privileges to '{username}'.")
        elif access_type == "reader":
            # Reader gets SELECT only privileges
            cursor.execute(f"GRANT SELECT ON {db_config['database']}.* TO '{username}'@'localhost'")
            print(f"Granted READER (SELECT) privileges to '{username}'.")
        
        cursor.execute("FLUSH PRIVILEGES") # Apply changes
        root_conn.commit()
        print(f"Privileges flushed for '{username}'.")

    except Error as e:
        print(f"Error creating or granting privileges to user '{username}': {e}")
    finally:
        if root_conn and root_conn.is_connected():
            cursor.close()
            root_conn.close()

if __name__ == "__main__":
    # Example usage for testing
    db_root_config = {
        "host": config.DB_HOST,
        "user": config.DB_USER,
        "password": config.DB_PASSWORD,
    }
    target_db_config = {
        "host": config.DB_HOST,
        "user": config.DB_USER, # Still connect as root to setup schema
        "password": config.DB_PASSWORD,
        "database": config.DB_NAME
    }

    create_database(db_root_config["host"], db_root_config["user"], db_root_config["password"], config.DB_NAME)
    
    # Path to your SQL schema file
    schema_path = os.path.join(os.path.dirname(__file__), 'sql', 'schema.sql')
    execute_sql_script(target_db_config, schema_path)

    # Create admin and reader users
    create_user(db_root_config, config.ADMIN_USER, config.ADMIN_PASSWORD, "admin")
    create_user(db_root_config, config.READER_USER, config.READER_PASSWORD, "reader")