-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Organizations Table
create table public.organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    domain text unique,
    plan text default 'free',
    created_at timestamptz default now()
);

-- 2. Users Table (extends Supabase auth.users)
create table public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    org_id uuid references public.organizations(id) on delete set null,
    email text not null,
    role text default 'viewer' check (role in ('admin', 'manager', 'viewer')),
    avatar_url text,
    created_at timestamptz default now()
);

-- 3. Integrations Table
create table public.integrations (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    platform text not null,
    credentials_encrypted text,
    status text default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
    last_synced_at timestamptz,
    created_at timestamptz default now(),
    unique(org_id, platform)
);

-- 4. Licenses Table
create table public.licenses (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    integration_id uuid references public.integrations(id) on delete cascade,
    platform text not null,
    plan_name text not null,
    seats_purchased integer not null default 0,
    seats_used integer not null default 0,
    cost_per_seat numeric(10, 2) not null default 0,
    billing_cycle text check (billing_cycle in ('monthly', 'annual')),
    renewal_date date,
    created_at timestamptz default now()
);

-- 5. License Assignments Table
create table public.license_assignments (
    id uuid primary key default uuid_generate_v4(),
    license_id uuid references public.licenses(id) on delete cascade not null,
    user_email text not null,
    status text default 'active' check (status in ('active', 'idle', 'unused')),
    last_active_at timestamptz,
    created_at timestamptz default now(),
    unique(license_id, user_email)
);

-- 6. Optimization Recommendations Table
create table public.optimization_recommendations (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    license_id uuid references public.licenses(id) on delete cascade,
    type text not null check (type in ('downgrade', 'remove', 'consolidate')),
    estimated_savings numeric(10, 2) default 0,
    status text default 'pending' check (status in ('pending', 'accepted', 'dismissed')),
    created_at timestamptz default now()
);

-- 7. Compliance Alerts Table
create table public.compliance_alerts (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    license_id uuid references public.licenses(id) on delete cascade,
    alert_type text not null check (alert_type in ('renewal', 'overuse')),
    severity text not null check (severity in ('info', 'warning', 'critical')),
    message text not null,
    is_resolved boolean default false,
    due_date date,
    created_at timestamptz default now()
);

-- 8. Audit Logs Table
create table public.audit_logs (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete set null,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    metadata jsonb,
    created_at timestamptz default now()
);

-- 9. Reports Table
create table public.reports (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    type text not null check (type in ('utilization', 'optimization', 'compliance')),
    file_url text not null,
    created_at timestamptz default now()
);

-- Row Level Security (RLS)
alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.integrations enable row level security;
alter table public.licenses enable row level security;
alter table public.license_assignments enable row level security;
alter table public.optimization_recommendations enable row level security;
alter table public.compliance_alerts enable row level security;
alter table public.audit_logs enable row level security;
alter table public.reports enable row level security;

-- Function to get current user's org_id
create or replace function public.get_auth_org_id() returns uuid as $$
declare
    current_org_id uuid;
begin
    select org_id into current_org_id from public.users where id = auth.uid();
    return current_org_id;
end;
$$ language plpgsql security definer;

-- RLS Policies
create policy "Users can view their own organization" on public.organizations
    for all using (id = public.get_auth_org_id());

create policy "Users can view members of their organization" on public.users
    for all using (org_id = public.get_auth_org_id());

create policy "Users can view their organization integrations" on public.integrations
    for all using (org_id = public.get_auth_org_id());

create policy "Users can view their organization licenses" on public.licenses
    for all using (org_id = public.get_auth_org_id());

create policy "Users can view their org's license assignments" on public.license_assignments
    for all using (
        license_id in (select id from public.licenses where org_id = public.get_auth_org_id())
    );

create policy "Users can view their org's recommendations" on public.optimization_recommendations
    for all using (org_id = public.get_auth_org_id());

create policy "Users can view their org's compliance alerts" on public.compliance_alerts
    for all using (org_id = public.get_auth_org_id());

create policy "Users can view their org's reports" on public.reports
    for all using (org_id = public.get_auth_org_id());

-- Handlers for Auth Triggers
create or replace function public.handle_new_user() returns trigger as $$
declare
    domain_name text;
    user_org_id uuid;
begin
    -- Extract domain from email
    domain_name := split_part(new.email, '@', 2);
    
    -- Check if organization exists for this domain, else create one
    select id into user_org_id from public.organizations where domain = domain_name limit 1;
    
    if user_org_id is null then
        insert into public.organizations (name, domain) values (domain_name, domain_name) returning id into user_org_id;
    end if;

    insert into public.users (id, org_id, email, role)
    values (new.id, user_org_id, new.email, 'admin');
    
    return new;
end;
$$ language plpgsql security definer;

-- Needs to be created if not exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Indexes for performance
create index idx_users_org_id on public.users(org_id);
create index idx_integrations_org_id on public.integrations(org_id);
create index idx_licenses_org_id on public.licenses(org_id);
create index idx_licenses_platform on public.licenses(platform);
create index idx_licenses_renewal_date on public.licenses(renewal_date);
create index idx_license_assignments_license_id on public.license_assignments(license_id);
create index idx_license_assignments_status on public.license_assignments(status);
create index idx_optimization_rec_org_id on public.optimization_recommendations(org_id);
create index idx_compliance_alerts_org_id on public.compliance_alerts(org_id);

-- Storage configuration for reports bucket
insert into storage.buckets (id, name, public) values ('reports', 'reports', true) on conflict do nothing;

create policy "Authenticated users can upload reports"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'reports' );

create policy "Authenticated users can read reports"
  on storage.objects for select
  to authenticated
  using ( bucket_id = 'reports' );
