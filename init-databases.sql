-- init-databases.sql CORRIGIDO - 28HUB CONNECT ENTERPRISE
-- Criação automática databases + schemas EXATOS Evolution API

-- Criar databases
CREATE DATABASE "28hub";
CREATE DATABASE "evolution_db";
CREATE DATABASE "evo_ai";
CREATE DATABASE "n8n";

-- Criar usuário "user" para Evolution API
CREATE USER "user" WITH PASSWORD '28hub2025';

-- ✅ CRÍTICO: SUPERUSER + PERMISSIONS
ALTER USER postgres WITH SUPERUSER CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE "evolution_db" TO postgres;
GRANT ALL PRIVILEGES ON DATABASE "evolution_db" TO "user";
GRANT ALL PRIVILEGES ON DATABASE "evo_ai" TO postgres;
GRANT ALL PRIVILEGES ON DATABASE "n8n" TO postgres;
GRANT ALL PRIVILEGES ON DATABASE "28hub" TO postgres;

-- ✅ Schema específico Evolution API
\c evolution_db;
CREATE SCHEMA IF NOT EXISTS evolution_api;
GRANT ALL ON SCHEMA evolution_api TO postgres;
GRANT ALL ON SCHEMA evolution_api TO "user";
GRANT ALL ON ALL TABLES IN SCHEMA evolution_api TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA evolution_api TO "user";
GRANT ALL ON ALL SEQUENCES IN SCHEMA evolution_api TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA evolution_api TO "user";
