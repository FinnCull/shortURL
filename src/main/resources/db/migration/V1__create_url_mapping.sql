CREATE TABLE url_mapping (
    short_code   VARCHAR(10)   PRIMARY KEY,
    original_url VARCHAR(2048) NOT NULL,
    created_date TIMESTAMP(6)  NOT NULL,
    expiry_date  TIMESTAMP(6)  NOT NULL
);
