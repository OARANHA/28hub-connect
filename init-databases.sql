-- init-databases.sql - Criação automática 4 databases
CREATE DATABASE 28hub;
CREATE DATABASE evolution;
CREATE DATABASE evo_ai;
CREATE DATABASE n8n;

-- Indexes globais performance
\c 28hub;
CREATE INDEX CONCURRENTLY idx_notifications_tenant_status ON notifications(tenant_id, status);
CREATE INDEX CONCURRENTLY idx_notifications_created ON notifications(created_at);

\c evolution;
CREATE INDEX CONCURRENTLY idx_instances_status ON instances(status);
