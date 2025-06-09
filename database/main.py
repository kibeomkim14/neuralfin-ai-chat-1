# main.py
import os
import sys
import config
import database_setup
import data_collector
import pandas as pd

def main():
    print("--- Starting Database Setup and Data Ingestion ---")

    # 1. Set up MySQL database and tables
    print("\n[STEP 1/4] Setting up MySQL database and tables...")
    db_root_config = {
        "host": config.DB_HOST,
        "user": config.DB_USER,
        "password": config.DB_PASSWORD,
    }
    target_db_config = {
        "host": config.DB_HOST,
        "user": config.DB_USER, # Connect as root to setup schema
        "password": config.DB_PASSWORD,
        "database": config.DB_NAME
    }

    try:
        database_setup.create_database(db_root_config["host"], db_root_config["user"], db_root_config["password"], config.DB_NAME)
        
        # Path to your SQL schema file
        schema_path = os.path.join(os.path.dirname(__file__), 'sql', 'schema.sql')
        database_setup.execute_sql_script(target_db_config, schema_path)
        print("[STEP 1/4] Database and tables setup complete. ✅")
    except Exception as e:
        print(f"FATAL ERROR during database setup: {e}")
        sys.exit(1) # Exit if setup fails

    # 2. Create Admin and Reader users
    print("\n[STEP 2/4] Creating admin and reader users...")
    try:
        database_setup.create_user(db_root_config, config.ADMIN_USER, config.ADMIN_PASSWORD, "admin")
        database_setup.create_user(db_root_config, config.READER_USER, config.READER_PASSWORD, "reader")
        print("[STEP 2/4] Admin and reader users created. ✅")
    except Exception as e:
        print(f"FATAL ERROR during user creation: {e}")
        sys.exit(1)

    # 3. Collect data and give admin access to write
    print("\n[STEP 3/4] Collecting data and writing to database...")
    db_writer = None
    try:
        # Initialize DatabaseWriter with admin credentials
        db_writer = data_collector.DatabaseWriter(
            config.DB_HOST, config.DB_NAME, config.ADMIN_USER, config.ADMIN_PASSWORD
        )

        # Fetch and insert fund_overview (parent table for ISIN)
        df_overview = data_collector.fetch_fund_overview_data()
        if not df_overview.empty:
            db_writer.insert_dataframe(df_overview, 'fund_overview', if_exists='upsert', pk_columns=['isin'])
        else:
            print("No fund overview data to insert.")

        # Fetch and insert fund_catalog
        df_catalog = data_collector.fetch_fund_catalog_data()
        if not df_catalog.empty:
            db_writer.insert_dataframe(df_catalog, 'fund_catalog', if_exists='upsert', pk_columns=['allfunds_id'])
        else:
            print("No fund catalog data to insert.")
        
        # Fetch and insert nav data
        df_nav = data_collector.fetch_nav_data()
        if not df_nav.empty:
            db_writer.insert_dataframe(df_nav, 'nav', if_exists='upsert', pk_columns=['isin', 'date'])
        else:
            print("No NAV data to insert.")

        # Fetch and insert performance data
        df_performance = data_collector.fetch_performance_data()
        if not df_performance.empty:
            db_writer.insert_dataframe(df_performance, 'performance', if_exists='upsert', pk_columns=['isin'])
        else:
            print("No performance data to insert.")

        print("[STEP 3/4] Data collection and write complete. ✅")

    except Exception as e:
        print(f"FATAL ERROR during data collection/ingestion: {e}")
        sys.exit(1)
    finally:
        if db_writer:
            db_writer.close_pool()

    # 4. Reader access is already set up in Step 2.
    print("\n[STEP 4/4] Reader user has read-only access to the database (configured in Step 2). ✅")
    print("\n--- All operations completed successfully! 🎉 ---")

if __name__ == "__main__":
    main()