DO $$
DECLARE
    org_id uuid := '123e4567-e89b-12d3-a456-426614174000';
    user_admin uuid := '123e4567-e89b-12d3-a456-426614174001';
    user_manager uuid := '123e4567-e89b-12d3-a456-426614174002';
    
    int_slack_id uuid := uuid_generate_v4();
    int_google_id uuid := uuid_generate_v4();
    int_github_id uuid := uuid_generate_v4();
    int_adobe_id uuid := uuid_generate_v4();
    int_zoom_id uuid := uuid_generate_v4();
    int_teams_id uuid := uuid_generate_v4();
    int_dropbox_id uuid := uuid_generate_v4();
    
    lic_id uuid;
    i integer;
    j integer;
    rand_status text;
    platforms text[] := array['Slack', 'Google Workspace', 'GitHub', 'Adobe Creative Cloud', 'Zoom', 'Microsoft Teams', 'Dropbox'];
    plans text[] := array['Basic', 'Pro', 'Enterprise', 'Premium'];
    int_ids uuid[] := array[int_slack_id, int_google_id, int_github_id, int_adobe_id, int_zoom_id, int_teams_id, int_dropbox_id];
BEGIN
    -- Disable trigger temporarily to seed custom demo data without generic trigger overrides
    ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

    -- 1. Create Mock Users in auth schema
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
    VALUES 
        (user_admin, 'admin@acmecorp.com', crypt('password123', gen_salt('bf')), now(), 'authenticated', 'authenticated'),
        (user_manager, 'manager@acmecorp.com', crypt('password123', gen_salt('bf')), now(), 'authenticated', 'authenticated');

    -- 2. Organization & Users
    INSERT INTO public.organizations (id, name, domain, plan)
    VALUES (org_id, 'Acme Corp', 'acmecorp.com', 'enterprise');

    INSERT INTO public.users (id, org_id, email, role)
    VALUES 
        (user_admin, org_id, 'admin@acmecorp.com', 'admin'),
        (user_manager, org_id, 'manager@acmecorp.com', 'manager');

    -- 3. Integrations
    FOR i IN 1..7 LOOP
        INSERT INTO public.integrations (id, org_id, platform, status, last_synced_at)
        VALUES (int_ids[i], org_id, platforms[i], 'connected', now() - (random() * interval '24 hours'));
    END LOOP;

    -- 4. Licenses & Assignments (50 licenses total)
    FOR i IN 1..50 LOOP
        lic_id := uuid_generate_v4();
        
        INSERT INTO public.licenses (id, org_id, integration_id, platform, plan_name, seats_purchased, seats_used, cost_per_seat, billing_cycle, renewal_date)
        VALUES (
            lic_id, org_id, int_ids[(i % 7) + 1], platforms[(i % 7) + 1], plans[(i % 4) + 1], 
            (random() * 20 + 5)::int, 0, (random() * 50 + 10)::numeric(10,2), 
            case when random() > 0.5 then 'monthly' else 'annual' end, 
            CURRENT_DATE + (random() * 365)::integer
        );

        -- Generate Assignments for the license
        FOR j IN 1..(random() * 10 + 2)::int LOOP
            rand_status := case 
                when random() > 0.8 then 'unused'
                when random() > 0.6 then 'idle'
                else 'active'
            end;
            
            INSERT INTO public.license_assignments (license_id, user_email, status, last_active_at)
            VALUES (
                lic_id, 
                'user' || ((i * 10) + j)::text || '@acmecorp.com', 
                rand_status, 
                now() - ((random() * 60)::integer || ' days')::interval
            );
        END LOOP;
        
        -- Update seats_used to count assigned users
        UPDATE public.licenses SET seats_used = (
            SELECT count(*) FROM public.license_assignments WHERE license_id = lic_id
        ) WHERE id = lic_id;
        
        -- Seed Optimization Recommendations
        IF random() > 0.6 THEN
            INSERT INTO public.optimization_recommendations (org_id, license_id, type, estimated_savings, status)
            VALUES (
                org_id, lic_id, 
                case when random() > 0.5 then 'downgrade' else 'remove' end,
                (random() * 100 + 20)::numeric(10,2),
                'pending'
            );
        END IF;

        -- Seed Compliance Alerts
        IF random() > 0.8 THEN
            INSERT INTO public.compliance_alerts (org_id, license_id, alert_type, severity, message, due_date)
            VALUES (
                org_id, lic_id,
                case when random() > 0.5 then 'renewal' else 'overuse' end,
                case when random() > 0.5 then 'warning' else 'critical' end,
                'Compliance flag for ' || platforms[(i % 7) + 1] || ' (Plan: ' || plans[(i % 4) + 1] || ')',
                CURRENT_DATE + (random() * 30)::integer
            );
        END IF;

    END LOOP;

    -- Re-enable trigger
    ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
END $$;
