-- User preferences: language and notification toggles

alter table users
  add column if not exists preferred_language text default 'pt',
  add column if not exists notification_settings jsonb default '{}';

comment on column users.preferred_language is 'App UI language: pt or en';
comment on column users.notification_settings is 'JSON map of notification preference toggles';
