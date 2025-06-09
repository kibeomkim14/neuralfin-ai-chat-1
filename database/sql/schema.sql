-- Disable foreign key checks temporarily to allow table creation in any order
-- if there are circular dependencies or for easier script execution.
-- Re-enable them at the end.
SET FOREIGN_KEY_CHECKS = 0;

-- Create the fund_overview table first, as other tables will reference its ISIN.
CREATE TABLE fund_overview (
    isin VARCHAR(50) PRIMARY KEY, -- ISIN as the primary key
    name VARCHAR(255),
    fund_company VARCHAR(255),
    asset_class VARCHAR(100),
    subasset_class VARCHAR(100),
    category VARCHAR(100),
    inception_date DATE,
    risk_reward_indicator INTEGER,
    fund_benchmark VARCHAR(255),
    investment_objective TEXT,
    fund_aum DECIMAL(18, 2),
    nav DECIMAL(18, 4),
    aum_currency VARCHAR(10)
);

-- Create the fund_catalog table
CREATE TABLE fund_catalog (
    allfunds_id VARCHAR(50) PRIMARY KEY, -- allfunds_id as the primary key
    isin VARCHAR(50),
    currency VARCHAR(10),
    company_id VARCHAR(50),
    company_name VARCHAR(255),
    product_status VARCHAR(50),
    last_updated_portfolio_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- MySQL-specific for auto-update
    CONSTRAINT fk_fund_catalog_isin
        FOREIGN KEY (isin)
        REFERENCES fund_overview (isin)
        ON DELETE CASCADE -- Adjust ON DELETE/UPDATE behavior as needed
        ON UPDATE CASCADE
);

-- Create the nav table
CREATE TABLE nav (
    isin VARCHAR(50),
    date DATE,
    close DECIMAL(18, 4),
    PRIMARY KEY (isin, date), -- Composite primary key
    CONSTRAINT fk_nav_isin
        FOREIGN KEY (isin)
        REFERENCES fund_overview (isin)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Create the performance table
CREATE TABLE performance (
    isin VARCHAR(50) PRIMARY KEY, -- ISIN as the primary key, assuming one performance record per ISIN
    inception DECIMAL(18, 4),
    one_day DECIMAL(18, 4),
    one_week DECIMAL(18, 4),
    one_month DECIMAL(18, 4),
    three_months DECIMAL(18, 4),
    six_months DECIMAL(18, 4),
    one_year DECIMAL(18, 4),
    two_years DECIMAL(18, 4),
    three_years DECIMAL(18, 4),
    five_years DECIMAL(18, 4),
    ten_years DECIMAL(18, 4),
    CONSTRAINT fk_performance_isin
        FOREIGN KEY (isin)
        REFERENCES fund_overview (isin)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;