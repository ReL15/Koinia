import {
  getCongregationsList,
  createCongregationRecord,
  getUserByEmail,
  upsertUserRecord,
} from './queries.ts';
import { db } from './index.ts';
import { sql } from 'drizzle-orm';

export async function bootstrapDatabase() {
  await db.execute(sql`
    ALTER TABLE congregations
    ADD COLUMN IF NOT EXISTS city text,
    ADD COLUMN IF NOT EXISTS logo_url text,
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS latitude double precision,
    ADD COLUMN IF NOT EXISTS longitude double precision,
    ADD COLUMN IF NOT EXISTS meeting_day_midweek text DEFAULT 'Miércoles',
    ADD COLUMN IF NOT EXISTS meeting_time_midweek text DEFAULT '19:00',
    ADD COLUMN IF NOT EXISTS meeting_day_weekend text DEFAULT 'Domingo',
    ADD COLUMN IF NOT EXISTS meeting_time_weekend text DEFAULT '09:00';

    ALTER TABLE territories
    ADD COLUMN IF NOT EXISTS last_progress text,
    ADD COLUMN IF NOT EXISTS last_progress_date text,
    ADD COLUMN IF NOT EXISTS last_progress_publisher text;

    ALTER TABLE weekly_assignments
    ADD COLUMN IF NOT EXISTS activity_type text DEFAULT 'TERRITORIO';

    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash text,
    ADD COLUMN IF NOT EXISTS service_group integer DEFAULT 1,
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS roles jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS is_elder boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_ministerial_servant boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_regular_pioneer boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_auxiliary_pioneer boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_master_admin boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS can_lead_preaching boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS can_public_preaching boolean DEFAULT false;

    CREATE TABLE IF NOT EXISTS service_groups (
      id text PRIMARY KEY,
      congregation_id text NOT NULL,
      group_number integer NOT NULL,
      name text,
      overseer_id text,
      assistant_id text,
      meeting_place text,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_cong_group UNIQUE(congregation_id, group_number)
    );

    CREATE TABLE IF NOT EXISTS s21_monthly_records (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      publisher_id text,
      service_year text NOT NULL,
      month_number integer NOT NULL,
      calendar_year integer NOT NULL,
      shared_in_ministry boolean DEFAULT false,
      bible_courses integer DEFAULT 0,
      auxiliary_pioneer boolean DEFAULT false,
      hours double precision,
      notes text,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_s21_user_month UNIQUE(user_id, service_year, month_number)
    );
  `);


  const congregations = await getCongregationsList();
  let defaultCongId = 'cong-central-1';

  if (congregations.length === 0) {
    console.log('Inicializando congregación principal en Neon PostgreSQL...');
    const created = await createCongregationRecord({
      id: defaultCongId,
      name: 'Congregación Central',
      circuit: 'SV-01',
      timezone: 'America/El_Salvador',
    });
    defaultCongId = created.id;
  } else {
    defaultCongId = congregations[0].id;
  }

  const adminEmail = 'tch.rivlue15@gmail.com';
  const existingAdmin = await getUserByEmail(adminEmail);
  if (!existingAdmin) {
    console.log(`Registrando Usuario Maestro en PostgreSQL para ${adminEmail}...`);
    await upsertUserRecord({
      id: 'user-admin-master-1',
      uid: 'user-admin-master-1',
      congregationId: defaultCongId,
      firstName: 'Administrador',
      lastName: 'Maestro',
      fullName: 'Administrador Maestro',
      email: adminEmail,
      role: 'COORDINADOR',
      isMasterAdmin: true,
      canLeadPreaching: true,
      canPublicPreaching: true,
      active: true,
    });
  }

  console.log('Base de datos Neon PostgreSQL vinculada y lista.');
}
