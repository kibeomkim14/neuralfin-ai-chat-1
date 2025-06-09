# data_collector.py
import json
import requests
import numpy as np
import pandas as pd
import mysql.connector
from typing import Optional
from datetime import datetime
from mysql.connector import Error, pooling

# --- Allfunds API Integration (Conceptual) ---
# This is a placeholder. You'll need to adapt it to the actual Allfunds API documentation.
# Authentication might involve OAuth2, API keys in headers, etc.

http_product_url = "https://api.neuralfin.ai"
productApiPath = "product/api/v1"
allfund_token  = "allfundsToken"

ALLFUND_PATH = f'{http_product_url}/{productApiPath}/funds'

def get_fund_catalog_data():

    result = requests.get(url=ALLFUND_PATH+'/catalog')
    content = json.loads(result.content)

    if content['status'] == 'success':
        data = content['data']['funds']
    else:
        raise 'Data cannot be fetched from API.'
    
    fund_table = pd.DataFrame(list(data))

    # extract company column to id and name of the company
    fund_table['company_id'] = fund_table['company'].apply(lambda x: x['allfunds_id'])
    fund_table['company_name'] = fund_table['company'].apply(lambda x: x['name'])

    # get important info
    fund_catalog = fund_table[['allfunds_id', 'isin','currency','company_id','company_name','product_status','last_updated_portfolio_date','created_at','updated_at']]
    return fund_catalog

# get overview given fund isin
def single_fund_overview(isin:str):
    assert isin[:2].isalpha, 'Invalid ISIN: First two-letter country code is unavailable.'
    
    overview_url = f'{http_product_url}/{productApiPath}/funds/{isin}/overview'
    response = requests.get(overview_url)

    if response.status_code != 200:
        raise ValueError("can't fetch data.")

    # extract data from response
    data = json.loads(response.content)['data']

    # convert it to dataframe
    df_indiv_overview = pd.DataFrame.from_dict(data, orient='index').T
    return df_indiv_overview

def dlifo_fund_overview(isin_codes: list[str]) -> pd.DataFrame:
    
    # run overview fetch individually.
    overview_data = [single_fund_overview(isin) for isin in isin_codes]
    overview_data = pd.concat(overview_data, axis=0)
    
    # select useful data
    interested_col = ['isin', 'name', 'fund_company', 'asset_class', 'subasset_class', 'category',  'inception_date', 'risk_reward_indicator', 'fund_benchmark', 'investment_objective', 'fund_aum', 'nav', 'aum_currency', ]
    selected_data = overview_data[interested_col]
    
    # extract key info from investment objective (english)
    selected_data['investment_objective'] = selected_data['investment_objective'].apply(lambda x: x['en']).values
    return selected_data

def single_fund_navs(isin:str, since_date:str, until_date:Optional[str]=None) -> pd.DataFrame:
    assert isin[:2].isalpha, 'Invalid ISIN: First two-letter country code is unavailable.'
    
    if until_date is None:
        until_date = str(datetime.date.today())
    
    overview_url = f'{http_product_url}/{productApiPath}/funds/{isin}/close_prices'
    response = requests.get(overview_url, params={'since_date': since_date,'until_date': until_date})

    if response.status_code != 200:
        return "can't fetch data."
    
    # extract NAV data from response
    data = json.loads(response.content)['data']
    df_nav = pd.DataFrame(data['close_prices'])
    df_nav['isin'] = isin
    return df_nav[['isin', 'date', 'value']]

def dlifo_fund_navs(isin_codes: list[str], since_date:str, until_date:Optional[str]=None) -> pd.DataFrame:
    if until_date is None:
        until_date = str(datetime.date.today())
    
    # run nav fetch individually.
    nav_data = [single_fund_navs(isin, since_date, until_date) for isin in isin_codes]
    nav_data = pd.concat(nav_data, axis=0)
    
    # extract key info from investment objective (english)
    nav_data.columns = ['isin', 'date', 'close']
    return nav_data

def single_fund_performance(isin:str) -> pd.DataFrame:
    assert isin[:2].isalpha, 'Invalid ISIN: First two-letter country code is unavailable.'
    
    performance_url = f'{http_product_url}/{productApiPath}/funds/{isin}/performance'
    response = requests.get(performance_url)

    if response.status_code != 200:
        return "can't fetch data."
    
    # extract performance data from response
    data = json.loads(response.content)['data']['performance']
    
    # delete and add data to data dict
    data['isin'] = isin
    del data['quartiles'], data['quarterly_returns'], data['monthly_returns'], data['yearly_returns']
    return pd.DataFrame.from_dict(data, orient='index').T

def dlifo_fund_performance(isin_codes: list[str]) -> pd.DataFrame:
    # run nav fetch individually.
    performance_data = [single_fund_performance(isin) for isin in isin_codes]
    performance_data = pd.concat(performance_data, axis=0)
    return performance_data[['isin', 'inception', 'one_day', 'one_week', 'one_month', 'three_months', 'six_months', 'one_year', 'two_years', 'three_years', 'five_years', 'ten_years']]


# --- Database Insertion (Using Admin User) ---

class DatabaseWriter:
    def __init__(self, db_host, db_name, db_user, db_password):
        self.db_config = {
            "host": db_host,
            "database": db_name,
            "user": db_user,
            "password": db_password
        }
        self.connection_pool = None
        self._create_pool()

    def _create_pool(self):
        try:
            self.connection_pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="mypool",
                pool_size=5, # Adjust pool size as needed
                **self.db_config
            )
            print("Database connection pool created successfully.")
        except Error as e:
            print(f"Error creating connection pool: {e}")
            raise

    def get_connection(self):
        try:
            return self.connection_pool.get_connection()
        except Error as e:
            print(f"Error getting connection from pool: {e}")
            raise

    def insert_dataframe(self, df, table_name, if_exists='append', pk_columns=None):
        """
        Inserts a pandas DataFrame into a MySQL table.
        'if_exists' options: 'append', 'replace', 'upsert' (custom upsert)
        'pk_columns' is required for 'upsert' to identify unique rows.
        """
        if df.empty:
            print(f"DataFrame for '{table_name}' is empty, skipping insertion.")
            return

        conn = None
        cursor = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cols = ", ".join([f"`{col}`" for col in df.columns])
            placeholders = ", ".join(["%s"] * len(df.columns))

            if if_exists == 'append':
                sql_insert = f"INSERT INTO `{table_name}` ({cols}) VALUES ({placeholders})"
                data_tuples = [tuple(row) for row in df.itertuples(index=False)]
                cursor.executemany(sql_insert, data_tuples)
                conn.commit()
                print(f"Appended {len(df)} rows to '{table_name}'.")

            elif if_exists == 'replace':
                # This truncates the table and then inserts. Use with caution.
                cursor.execute(f"TRUNCATE TABLE `{table_name}`")
                sql_insert = f"INSERT INTO `{table_name}` ({cols}) VALUES ({placeholders})"
                data_tuples = [tuple(row) for row in df.itertuples(index=False)]
                cursor.executemany(sql_insert, data_tuples)
                conn.commit()
                print(f"Replaced all data and inserted {len(df)} rows into '{table_name}'.")

            elif if_exists == 'upsert':
                if not pk_columns:
                    raise ValueError("pk_columns must be provided for 'upsert' mode.")
                
                update_assignments = ", ".join([f"`{col}` = VALUES(`{col}`)" for col in df.columns if col not in pk_columns])
                
                # If there are no columns to update (e.g., only PKs in the DF), then just insert
                if not update_assignments:
                    sql_upsert = f"INSERT INTO `{table_name}` ({cols}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {pk_columns[0]} = VALUES({pk_columns[0]})"
                else:
                     sql_upsert = f"INSERT INTO `{table_name}` ({cols}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {update_assignments}"
                
                data_tuples = [tuple(row) for row in df.itertuples(index=False)]
                cursor.executemany(sql_upsert, data_tuples)
                conn.commit()
                print(f"Upserted {len(df)} rows into '{table_name}'.")

            else:
                raise ValueError("Invalid 'if_exists' option. Choose 'append', 'replace', or 'upsert'.")

        except Error as e:
            print(f"Error inserting data into '{table_name}': {e}")
            if conn:
                conn.rollback() # Rollback in case of error
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close() # Return connection to pool

    def close_pool(self):
        if self.connection_pool:
            self.connection_pool.close()
            print("Database connection pool closed.")