CREATE DATABASE IF NOT EXISTS pharmacogenomics;
USE pharmacogenomics;

-- ============================================
-- 1. ROLES
-- ============================================

CREATE TABLE Roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- ============================================
-- 2. USERS
-- ============================================

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    account_status ENUM('Active', 'Inactive', 'Pending') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES Roles(role_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================
-- 3. USER PROFILE
-- ============================================

CREATE TABLE User_Profile (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other', 'Prefer not to say'),
    address VARCHAR(255),
    profile_picture VARCHAR(255),

    CONSTRAINT fk_profile_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================
-- 4. LOGIN HISTORY
-- ============================================

CREATE TABLE Login_History (
    login_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    login_status ENUM('Success', 'Failed') NOT NULL,
    ip_address VARCHAR(45),

    CONSTRAINT fk_login_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================
-- 5. GENE
-- ============================================

CREATE TABLE Gene (
    gene_id INT AUTO_INCREMENT PRIMARY KEY,
    gene_symbol VARCHAR(20) NOT NULL UNIQUE,
    gene_name VARCHAR(100) NOT NULL,
    chromosome VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. GENETIC VARIANT
-- ============================================

CREATE TABLE Genetic_Variant (
    variant_id INT AUTO_INCREMENT PRIMARY KEY,
    gene_id INT NOT NULL,
    variant_name VARCHAR(50) NOT NULL,
    rs_id VARCHAR(30),
    allele VARCHAR(50),
    function_description TEXT,

    CONSTRAINT fk_variant_gene
        FOREIGN KEY (gene_id)
        REFERENCES Gene(gene_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT unique_gene_variant
        UNIQUE (gene_id, variant_name)
);

-- ============================================
-- 7. DRUG
-- ============================================

CREATE TABLE Drug (
    drug_id INT AUTO_INCREMENT PRIMARY KEY,
    drug_name VARCHAR(100) NOT NULL UNIQUE,
    generic_name VARCHAR(100),
    drug_class VARCHAR(100),
    indication TEXT,
    dosage_form VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. DISEASE
-- ============================================

CREATE TABLE Disease (
    disease_id INT AUTO_INCREMENT PRIMARY KEY,
    disease_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. PATIENT
-- ============================================

CREATE TABLE Patient (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    patient_code VARCHAR(20) NOT NULL UNIQUE,
    blood_group VARCHAR(5),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_patient_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================
-- 10. MEDICAL HISTORY
-- ============================================

CREATE TABLE Medical_History (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    diagnosis VARCHAR(150) NOT NULL,
    diagnosis_date DATE,
    treatment TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_patient
        FOREIGN KEY (patient_id)
        REFERENCES Patient(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================
-- 11. ALLERGY
-- ============================================

CREATE TABLE Allergy (
    allergy_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    allergen VARCHAR(150) NOT NULL,
    reaction VARCHAR(255),
    severity ENUM('Mild', 'Moderate', 'Severe'),
    notes TEXT,

    CONSTRAINT fk_allergy_patient
        FOREIGN KEY (patient_id)
        REFERENCES Patient(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================
-- 12. GENETIC TEST
-- ============================================

CREATE TABLE Genetic_Test (
    test_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    test_name VARCHAR(150) NOT NULL,
    laboratory VARCHAR(150),
    test_date DATE,
    result_summary TEXT,
    report_file VARCHAR(255),
    test_status ENUM('Pending', 'Completed', 'Reviewed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_genetic_test_patient
        FOREIGN KEY (patient_id)
        REFERENCES Patient(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================
-- 13. PATIENT GENOTYPE
-- ============================================

CREATE TABLE Patient_Genotype (
    genotype_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    variant_id INT NOT NULL,
    zygosity ENUM('Homozygous', 'Heterozygous', 'Unknown') DEFAULT 'Unknown',
    genotype_result VARCHAR(100),
    test_id INT,
    detected_date DATE,
    notes TEXT,

    CONSTRAINT fk_genotype_patient
        FOREIGN KEY (patient_id)
        REFERENCES Patient(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_genotype_variant
        FOREIGN KEY (variant_id)
        REFERENCES Genetic_Variant(variant_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_genotype_test
        FOREIGN KEY (test_id)
        REFERENCES Genetic_Test(test_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT unique_patient_variant
        UNIQUE (patient_id, variant_id)
);

-- ============================================
-- 14. DRUG-GENE INTERACTION
-- ============================================

CREATE TABLE Drug_Gene_Interaction (
    interaction_id INT AUTO_INCREMENT PRIMARY KEY,
    drug_id INT NOT NULL,
    gene_id INT NOT NULL,
    variant_id INT,
    phenotype VARCHAR(100),
    recommendation TEXT NOT NULL,
    evidence_level VARCHAR(50),
    source VARCHAR(255),
    clinical_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_interaction_drug
        FOREIGN KEY (drug_id)
        REFERENCES Drug(drug_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_interaction_gene
        FOREIGN KEY (gene_id)
        REFERENCES Gene(gene_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_interaction_variant
        FOREIGN KEY (variant_id)
        REFERENCES Genetic_Variant(variant_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT unique_drug_gene_variant
        UNIQUE (drug_id, gene_id, variant_id)
);

-- ============================================
-- 15. PRESCRIPTION
-- ============================================

CREATE TABLE Prescription (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_user_id INT NOT NULL,
    drug_id INT NOT NULL,
    disease_id INT,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    prescription_date DATE NOT NULL,
    instructions TEXT,
    status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prescription_patient
        FOREIGN KEY (patient_id)
        REFERENCES Patient(patient_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_prescription_doctor
        FOREIGN KEY (doctor_user_id)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_prescription_drug
        FOREIGN KEY (drug_id)
        REFERENCES Drug(drug_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_prescription_disease
        FOREIGN KEY (disease_id)
        REFERENCES Disease(disease_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================
-- 16. RECOMMENDATION
-- ============================================

CREATE TABLE Recommendation (
    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    drug_id INT NOT NULL,
    interaction_id INT,
    recommendation_type ENUM(
        'Recommended',
        'Avoid',
        'Dose Adjustment',
        'Alternative'
    ) NOT NULL,
    recommendation_text TEXT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Reviewed', 'Dismissed') DEFAULT 'Active',

    CONSTRAINT fk_recommendation_patient
        FOREIGN KEY (patient_id)
        REFERENCES Patient(patient_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_recommendation_drug
        FOREIGN KEY (drug_id)
        REFERENCES Drug(drug_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_recommendation_interaction
        FOREIGN KEY (interaction_id)
        REFERENCES Drug_Gene_Interaction(interaction_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================
-- 17. ADMIN
-- ============================================

CREATE TABLE Admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    admin_level ENUM('Super Admin', 'Admin') DEFAULT 'Admin',
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_admin_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================
-- 18. AUDIT LOG
-- ============================================

CREATE TABLE Audit_Log (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    action_description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================
-- 19. ACTIVITY LOG
-- ============================================

CREATE TABLE Activity_Log (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================
-- 20. REPORTS
-- ============================================

CREATE TABLE Reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    generated_by INT,
    report_type ENUM(
        'Patient Report',
        'Drug Interaction Report',
        'Genetic Report',
        'Analytics Report',
        'System Report'
    ) NOT NULL,
    report_title VARCHAR(200) NOT NULL,
    description TEXT,
    file_path VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_user
        FOREIGN KEY (generated_by)
        REFERENCES Users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);