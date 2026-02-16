BEGIN;

-- ==========================================
-- Train-to-Hire MVP (Fase 1) - PostgreSQL DDL
-- ==========================================

-- 1) ENUMS
CREATE TYPE user_role AS ENUM ('student', 'company', 'admin');
CREATE TYPE opportunity_status AS ENUM ('draft', 'pending_review', 'published', 'closed');

-- 2) USERS
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    profile_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 3) OPPORTUNITIES
CREATE TABLE opportunities (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    status opportunity_status NOT NULL DEFAULT 'pending_review',
    CONSTRAINT fk_opportunities_company
        FOREIGN KEY (company_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- 4) COURSES (1:1 con opportunities)
CREATE TABLE courses (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT NOT NULL UNIQUE,
    content_url TEXT NOT NULL,
    quiz_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT fk_courses_opportunity
        FOREIGN KEY (opportunity_id)
        REFERENCES opportunities(id)
        ON DELETE CASCADE
);

-- 5) USER_PROGRESS
CREATE TABLE user_progress (
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    score INT,
    CONSTRAINT pk_user_progress PRIMARY KEY (user_id, course_id),
    CONSTRAINT fk_user_progress_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_progress_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);

-- 6) APPLICATIONS
CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    opportunity_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_applications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_applications_opportunity
        FOREIGN KEY (opportunity_id)
        REFERENCES opportunities(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_applications_user_opportunity UNIQUE (user_id, opportunity_id)
);

-- Índices recomendados
CREATE INDEX idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);

CREATE INDEX idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX idx_user_progress_user_completed ON user_progress(user_id, is_completed);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_applications_created_at ON applications(created_at);

COMMIT;
