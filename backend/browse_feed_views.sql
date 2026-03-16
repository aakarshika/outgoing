-- Browse feed SQL views for the product spec in outgoing.md.
--
-- Minimum practical view set:
-- 1. browse_events_feed: global event discovery for Trending, Tonight/Weekend,
--    Free & Cheap, and Online.
-- 2. browse_opportunities_feed: contributor-role discovery for Chip In and the
--    opportunity half of Free & Cheap.
-- 3. browse_network_events_feed: user-specific event rows for My Network and
--    "hosts you know" logic.
-- 4. browse_people_feed: user-specific buddy/activity rows for people cards.
--
-- Known model gaps reflected in these views:
-- - Event has no normalized location_city column. Use latitude/longitude for
--   proximity and map cities separately through external city centroids.
-- - EventNeed has budget fields, but no explicit reward type, discount amount,
--   or "publicly advertised" flag. Any open need is treated as a proxy for the
--   "discount available / chip in" feed concept.
-- - Event has no normalized online_platform field. location_address =
--   'Online Event' is the current source of truth for online events.

DROP VIEW IF EXISTS browse_people_feed CASCADE;
DROP VIEW IF EXISTS browse_network_events_feed CASCADE;
DROP VIEW IF EXISTS browse_opportunities_feed CASCADE;
DROP VIEW IF EXISTS browse_events_feed CASCADE;

CREATE VIEW browse_events_feed AS
WITH ticket_rollup AS (
    SELECT
        t.event_id,
        COUNT(*) FILTER (WHERE t.status IN ('active', 'used')) AS attendee_count,
        COUNT(*) FILTER (WHERE t.status = 'used') AS attended_count,
        COUNT(*) FILTER (
            WHERE t.status IN ('active', 'used')
              AND t.purchased_at >= NOW() - INTERVAL '7 days'
        ) AS ticket_velocity_7d
    FROM tickets_ticket t
    GROUP BY t.event_id
),
interest_rollup AS (
    SELECT
        i.event_id,
        COUNT(*) AS interest_count,
        COUNT(*) FILTER (
            WHERE i.created_at >= NOW() - INTERVAL '7 days'
        ) AS interest_velocity_7d
    FROM events_eventinterest i
    GROUP BY i.event_id
),
need_rollup AS (
    SELECT
        n.event_id,
        COUNT(*) FILTER (WHERE n.status = 'open') AS open_need_count,
        COUNT(*) FILTER (
            WHERE n.status = 'open'
              AND COALESCE(n.budget_max, n.budget_min, 0) > 0
        ) AS paid_open_need_count,
        MIN(COALESCE(n.budget_min, n.budget_max)) FILTER (
            WHERE n.status = 'open'
              AND COALESCE(n.budget_min, n.budget_max) IS NOT NULL
        ) AS min_open_need_budget,
        MAX(COALESCE(n.budget_max, n.budget_min)) FILTER (
            WHERE n.status = 'open'
              AND COALESCE(n.budget_max, n.budget_min) IS NOT NULL
        ) AS max_open_need_budget
    FROM needs_eventneed n
    GROUP BY n.event_id
),
tier_rollup AS (
    SELECT
        tt.event_id,
        MIN(tt.price) AS min_tier_price,
        MAX(tt.price) AS max_tier_price
    FROM events_eventtickettier tt
    GROUP BY tt.event_id
),
event_base_raw AS (
    SELECT
        e.id AS event_id,
        e.host_id,
        e.title,
        e.slug,
        e.description,
        e.category_id,
        c.slug AS category_slug,
        c.name AS category_name,
        e.series_id,
        e.occurrence_index,
        e.location_name,
        e.location_address,
        e.latitude,
        e.longitude,
        e.start_time,
        e.end_time,
        e.capacity,
        e.lifecycle_state,
        e.cover_image,
        e.tags,
        e.features,
        e.created_at,
        e.updated_at,
        COALESCE(tr.attendee_count, e.ticket_count, 0) AS attendee_count,
        COALESCE(tr.attended_count, 0) AS attended_count,
        COALESCE(tr.ticket_velocity_7d, 0) AS ticket_velocity_7d,
        COALESCE(ir.interest_count, e.interest_count, 0) AS interest_count,
        COALESCE(ir.interest_velocity_7d, 0) AS interest_velocity_7d,
        COALESCE(nr.open_need_count, 0) AS open_need_count,
        COALESCE(nr.paid_open_need_count, 0) AS paid_open_need_count,
        nr.min_open_need_budget,
        nr.max_open_need_budget,
        tt.min_tier_price,
        tt.max_tier_price,
        e.ticket_price_standard,
        e.ticket_price_flexible,
        (LOWER(TRIM(COALESCE(e.location_address, ''))) = 'online event') AS is_online,
        NULL::text AS online_platform
    FROM events_event e
    LEFT JOIN events_eventcategory c
        ON c.id = e.category_id
    LEFT JOIN ticket_rollup tr
        ON tr.event_id = e.id
    LEFT JOIN interest_rollup ir
        ON ir.event_id = e.id
    LEFT JOIN need_rollup nr
        ON nr.event_id = e.id
    LEFT JOIN tier_rollup tt
        ON tt.event_id = e.id
    WHERE e.lifecycle_state IN ('published', 'at_risk', 'postponed', 'event_ready', 'live')
      AND e.end_time >= NOW()
),
event_base AS (
    SELECT
        r.*,
        CASE
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_standard IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_standard, r.ticket_price_flexible)
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_standard IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_standard)
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_flexible)
            WHEN r.ticket_price_standard IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.ticket_price_standard, r.ticket_price_flexible)
            WHEN r.min_tier_price IS NOT NULL
                THEN r.min_tier_price
            WHEN r.ticket_price_standard IS NOT NULL
                THEN r.ticket_price_standard
            WHEN r.ticket_price_flexible IS NOT NULL
                THEN r.ticket_price_flexible
            ELSE 0::numeric
        END AS cheapest_ticket_price,
        CASE
            WHEN r.max_tier_price IS NOT NULL
             AND r.ticket_price_standard IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN GREATEST(r.max_tier_price, r.ticket_price_standard, r.ticket_price_flexible)
            WHEN r.max_tier_price IS NOT NULL
             AND r.ticket_price_standard IS NOT NULL
                THEN GREATEST(r.max_tier_price, r.ticket_price_standard)
            WHEN r.max_tier_price IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN GREATEST(r.max_tier_price, r.ticket_price_flexible)
            WHEN r.ticket_price_standard IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN GREATEST(r.ticket_price_standard, r.ticket_price_flexible)
            WHEN r.max_tier_price IS NOT NULL
                THEN r.max_tier_price
            WHEN r.ticket_price_standard IS NOT NULL
                THEN r.ticket_price_standard
            WHEN r.ticket_price_flexible IS NOT NULL
                THEN r.ticket_price_flexible
            ELSE 0::numeric
        END AS highest_ticket_price
    FROM event_base_raw r
)
SELECT
    eb.event_id,
    eb.host_id,
    eb.title,
    eb.slug,
    eb.description,
    eb.category_id,
    eb.category_slug,
    eb.category_name,
    eb.series_id,
    eb.occurrence_index,
    eb.location_name,
    eb.location_address,
    eb.latitude,
    eb.longitude,
    eb.start_time,
    eb.end_time,
    eb.capacity,
    eb.lifecycle_state,
    eb.cover_image,
    eb.tags,
    eb.features,
    eb.created_at,
    eb.updated_at,
    eb.attendee_count,
    eb.attended_count,
    eb.interest_count,
    eb.ticket_velocity_7d,
    eb.interest_velocity_7d,
    eb.ticket_velocity_7d + eb.interest_velocity_7d AS rsvp_velocity_7d,
    eb.open_need_count,
    eb.paid_open_need_count,
    eb.min_open_need_budget,
    eb.max_open_need_budget,
    eb.cheapest_ticket_price,
    eb.highest_ticket_price,
    eb.is_online,
    NOT eb.is_online AS is_in_person,
    eb.online_platform,
    (eb.cheapest_ticket_price = 0) AS is_free,
    (eb.cheapest_ticket_price <= 200) AS is_under_200,
    (eb.cheapest_ticket_price <= 500) AS is_under_500,
    (eb.open_need_count > 0) AS has_open_need,
    (eb.paid_open_need_count > 0) AS has_paid_open_need,
    (eb.open_need_count > 0) AS has_discount_available_proxy,
    (eb.start_time >= DATE_TRUNC('day', NOW())
        AND eb.start_time < DATE_TRUNC('day', NOW()) + INTERVAL '1 day') AS is_tonight,
    (eb.start_time >= DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
        AND eb.start_time < DATE_TRUNC('day', NOW()) + INTERVAL '2 days') AS is_tomorrow,
    (eb.start_time >= DATE_TRUNC('week', NOW()) + INTERVAL '5 days'
        AND eb.start_time < DATE_TRUNC('week', NOW()) + INTERVAL '7 days') AS is_this_weekend,
    (eb.start_time >= DATE_TRUNC('week', NOW()) + INTERVAL '7 days'
        AND eb.start_time < DATE_TRUNC('week', NOW()) + INTERVAL '14 days') AS is_next_week,
    (eb.start_time >= NOW()
        AND eb.start_time < NOW() + INTERVAL '72 hours') AS starts_within_72h,
    (
        ((eb.ticket_velocity_7d + eb.interest_velocity_7d) * 10)
        + (eb.attendee_count * 2)
        + eb.interest_count
        + (eb.open_need_count * 3)
    ) AS trending_score
FROM event_base eb;

CREATE VIEW browse_opportunities_feed AS
WITH ticket_rollup AS (
    SELECT
        t.event_id,
        COUNT(*) FILTER (WHERE t.status IN ('active', 'used')) AS attendee_count,
        COUNT(*) FILTER (
            WHERE t.status IN ('active', 'used')
              AND t.purchased_at >= NOW() - INTERVAL '7 days'
        ) AS ticket_velocity_7d
    FROM tickets_ticket t
    GROUP BY t.event_id
),
interest_rollup AS (
    SELECT
        i.event_id,
        COUNT(*) AS interest_count,
        COUNT(*) FILTER (
            WHERE i.created_at >= NOW() - INTERVAL '7 days'
        ) AS interest_velocity_7d
    FROM events_eventinterest i
    GROUP BY i.event_id
),
tier_rollup AS (
    SELECT
        tt.event_id,
        MIN(tt.price) AS min_tier_price
    FROM events_eventtickettier tt
    GROUP BY tt.event_id
),
event_base_raw AS (
    SELECT
        e.id AS event_id,
        e.host_id,
        e.title AS event_title,
        e.slug AS event_slug,
        e.description AS event_description,
        e.category_id,
        c.slug AS category_slug,
        c.name AS category_name,
        e.location_name,
        e.location_address,
        e.latitude,
        e.longitude,
        e.start_time,
        e.end_time,
        e.lifecycle_state,
        e.cover_image,
        COALESCE(tr.attendee_count, e.ticket_count, 0) AS attendee_count,
        COALESCE(ir.interest_count, e.interest_count, 0) AS interest_count,
        COALESCE(tr.ticket_velocity_7d, 0) AS ticket_velocity_7d,
        COALESCE(ir.interest_velocity_7d, 0) AS interest_velocity_7d,
        tt.min_tier_price,
        e.ticket_price_standard,
        e.ticket_price_flexible,
        (LOWER(TRIM(COALESCE(e.location_address, ''))) = 'online event') AS is_online,
        NULL::text AS online_platform
    FROM events_event e
    LEFT JOIN events_eventcategory c
        ON c.id = e.category_id
    LEFT JOIN ticket_rollup tr
        ON tr.event_id = e.id
    LEFT JOIN interest_rollup ir
        ON ir.event_id = e.id
    LEFT JOIN tier_rollup tt
        ON tt.event_id = e.id
    WHERE e.lifecycle_state IN ('published', 'at_risk', 'postponed', 'event_ready', 'live')
      AND e.end_time >= NOW()
),
event_base AS (
    SELECT
        r.*,
        CASE
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_standard IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_standard, r.ticket_price_flexible)
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_standard IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_standard)
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_flexible)
            WHEN r.ticket_price_standard IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.ticket_price_standard, r.ticket_price_flexible)
            WHEN r.min_tier_price IS NOT NULL
                THEN r.min_tier_price
            WHEN r.ticket_price_standard IS NOT NULL
                THEN r.ticket_price_standard
            WHEN r.ticket_price_flexible IS NOT NULL
                THEN r.ticket_price_flexible
            ELSE 0::numeric
        END AS cheapest_ticket_price
    FROM event_base_raw r
)
SELECT
    n.id AS need_id,
    n.event_id,
    eb.host_id,
    eb.event_title,
    eb.event_slug,
    eb.event_description,
    eb.category_id,
    eb.category_slug,
    eb.category_name,
    eb.location_name,
    eb.location_address,
    eb.latitude,
    eb.longitude,
    eb.start_time,
    eb.end_time,
    eb.lifecycle_state,
    eb.cover_image,
    eb.attendee_count,
    eb.interest_count,
    eb.ticket_velocity_7d,
    eb.interest_velocity_7d,
    eb.cheapest_ticket_price AS event_cheapest_ticket_price,
    eb.is_online,
    NOT eb.is_online AS is_in_person,
    eb.online_platform,
    n.title AS need_title,
    n.description AS need_description,
    n.category AS need_category,
    n.criticality,
    n.status AS need_status,
    n.assigned_vendor_id,
    n.application_count,
    n.budget_min,
    n.budget_max,
    COALESCE(n.budget_max, n.budget_min, 0) AS reward_value,
    (COALESCE(n.budget_max, n.budget_min, 0) > 0) AS has_cash_reward,
    CASE
        WHEN COALESCE(n.budget_max, n.budget_min, 0) > 0 THEN 'cash'
        ELSE 'unspecified'
    END AS reward_kind,
    CASE
        WHEN LOWER(n.category) LIKE '%dj%'
          OR LOWER(n.category) LIKE '%music%'
          OR LOWER(n.title) LIKE '%dj%'
          OR LOWER(n.title) LIKE '%music%'
          OR LOWER(n.title) LIKE '%sound%'
            THEN 'dj_music'
        WHEN LOWER(n.category) LIKE '%food%'
          OR LOWER(n.category) LIKE '%cater%'
          OR LOWER(n.title) LIKE '%food%'
          OR LOWER(n.title) LIKE '%cater%'
          OR LOWER(n.title) LIKE '%cook%'
          OR LOWER(n.title) LIKE '%bake%'
            THEN 'food_catering'
        WHEN LOWER(n.category) LIKE '%photo%'
          OR LOWER(n.category) LIKE '%video%'
          OR LOWER(n.title) LIKE '%photo%'
          OR LOWER(n.title) LIKE '%camera%'
          OR LOWER(n.title) LIKE '%video%'
          OR LOWER(n.title) LIKE '%reel%'
            THEN 'photography'
        WHEN LOWER(n.category) LIKE '%equipment%'
          OR LOWER(n.title) LIKE '%equipment%'
          OR LOWER(n.title) LIKE '%projector%'
          OR LOWER(n.title) LIKE '%speaker%'
          OR LOWER(n.title) LIKE '%chair%'
          OR LOWER(n.title) LIKE '%table%'
            THEN 'equipment'
        WHEN LOWER(n.category) LIKE '%venue%'
          OR LOWER(n.title) LIKE '%venue%'
          OR LOWER(n.title) LIKE '%space%'
          OR LOWER(n.title) LIKE '%studio%'
          OR LOWER(n.title) LIKE '%hall%'
          OR LOWER(n.title) LIKE '%garden%'
            THEN 'venue'
        WHEN LOWER(n.category) LIKE '%staff%'
          OR LOWER(n.title) LIKE '%staff%'
          OR LOWER(n.title) LIKE '%crew%'
          OR LOWER(n.title) LIKE '%usher%'
          OR LOWER(n.title) LIKE '%volunteer%'
            THEN 'staffing'
        WHEN LOWER(n.category) LIKE '%decor%'
          OR LOWER(n.title) LIKE '%decor%'
          OR LOWER(n.title) LIKE '%decoration%'
          OR LOWER(n.title) LIKE '%flowers%'
            THEN 'decoration'
        WHEN LOWER(n.category) LIKE '%instructor%'
          OR LOWER(n.title) LIKE '%instructor%'
          OR LOWER(n.title) LIKE '%teacher%'
          OR LOWER(n.title) LIKE '%coach%'
          OR LOWER(n.title) LIKE '%facilitator%'
            THEN 'instructor'
        ELSE 'other'
    END AS contributor_role_group,
    (eb.start_time >= DATE_TRUNC('day', NOW())
        AND eb.start_time < DATE_TRUNC('day', NOW()) + INTERVAL '1 day') AS is_tonight,
    (eb.start_time >= DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
        AND eb.start_time < DATE_TRUNC('day', NOW()) + INTERVAL '2 days') AS is_tomorrow,
    (eb.start_time >= DATE_TRUNC('week', NOW()) + INTERVAL '5 days'
        AND eb.start_time < DATE_TRUNC('week', NOW()) + INTERVAL '7 days') AS is_this_weekend,
    (eb.start_time >= DATE_TRUNC('week', NOW()) + INTERVAL '7 days'
        AND eb.start_time < DATE_TRUNC('week', NOW()) + INTERVAL '14 days') AS is_next_week,
    (eb.cheapest_ticket_price = 0) AS event_is_free,
    (eb.cheapest_ticket_price <= 200) AS event_is_under_200,
    (eb.cheapest_ticket_price <= 500) AS event_is_under_500,
    TRUE AS has_discount_available_proxy,
    (
        ((eb.ticket_velocity_7d + eb.interest_velocity_7d) * 10)
        + eb.attendee_count
        + eb.interest_count
        + (n.application_count * 2)
    ) AS opportunity_score
FROM needs_eventneed n
JOIN event_base eb
    ON eb.event_id = n.event_id
WHERE n.status = 'open';

CREATE VIEW browse_network_events_feed AS
WITH friend_edges AS (
    SELECT
        f.id AS friendship_id,
        f.user1_id AS viewer_user_id,
        f.user2_id AS buddy_user_id,
        f.met_at_event_id
    FROM events_friendship f
    WHERE f.status = 'accepted'
    UNION ALL
    SELECT
        f.id AS friendship_id,
        f.user2_id AS viewer_user_id,
        f.user1_id AS buddy_user_id,
        f.met_at_event_id
    FROM events_friendship f
    WHERE f.status = 'accepted'
),
ticket_rollup AS (
    SELECT
        t.event_id,
        COUNT(*) FILTER (WHERE t.status IN ('active', 'used')) AS attendee_count,
        COUNT(*) FILTER (
            WHERE t.status IN ('active', 'used')
              AND t.purchased_at >= NOW() - INTERVAL '7 days'
        ) AS ticket_velocity_7d
    FROM tickets_ticket t
    GROUP BY t.event_id
),
interest_rollup AS (
    SELECT
        i.event_id,
        COUNT(*) AS interest_count,
        COUNT(*) FILTER (
            WHERE i.created_at >= NOW() - INTERVAL '7 days'
        ) AS interest_velocity_7d
    FROM events_eventinterest i
    GROUP BY i.event_id
),
need_rollup AS (
    SELECT
        n.event_id,
        COUNT(*) FILTER (WHERE n.status = 'open') AS open_need_count
    FROM needs_eventneed n
    GROUP BY n.event_id
),
tier_rollup AS (
    SELECT
        tt.event_id,
        MIN(tt.price) AS min_tier_price
    FROM events_eventtickettier tt
    GROUP BY tt.event_id
),
event_base_raw AS (
    SELECT
        e.id AS event_id,
        e.host_id,
        e.title,
        e.slug,
        e.description,
        e.category_id,
        c.slug AS category_slug,
        c.name AS category_name,
        e.location_name,
        e.location_address,
        e.latitude,
        e.longitude,
        e.start_time,
        e.end_time,
        e.lifecycle_state,
        COALESCE(tr.attendee_count, e.ticket_count, 0) AS attendee_count,
        COALESCE(ir.interest_count, e.interest_count, 0) AS interest_count,
        COALESCE(tr.ticket_velocity_7d, 0) AS ticket_velocity_7d,
        COALESCE(ir.interest_velocity_7d, 0) AS interest_velocity_7d,
        COALESCE(nr.open_need_count, 0) AS open_need_count,
        tt.min_tier_price,
        e.ticket_price_standard,
        e.ticket_price_flexible,
        (LOWER(TRIM(COALESCE(e.location_address, ''))) = 'online event') AS is_online,
        NULL::text AS online_platform
    FROM events_event e
    LEFT JOIN events_eventcategory c
        ON c.id = e.category_id
    LEFT JOIN ticket_rollup tr
        ON tr.event_id = e.id
    LEFT JOIN interest_rollup ir
        ON ir.event_id = e.id
    LEFT JOIN need_rollup nr
        ON nr.event_id = e.id
    LEFT JOIN tier_rollup tt
        ON tt.event_id = e.id
    WHERE e.lifecycle_state IN ('published', 'at_risk', 'postponed', 'event_ready', 'live')
      AND e.end_time >= NOW()
),
event_base AS (
    SELECT
        r.*,
        CASE
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_standard IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_standard, r.ticket_price_flexible)
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_standard IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_standard)
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_flexible)
            WHEN r.ticket_price_standard IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.ticket_price_standard, r.ticket_price_flexible)
            WHEN r.min_tier_price IS NOT NULL
                THEN r.min_tier_price
            WHEN r.ticket_price_standard IS NOT NULL
                THEN r.ticket_price_standard
            WHEN r.ticket_price_flexible IS NOT NULL
                THEN r.ticket_price_flexible
            ELSE 0::numeric
        END AS cheapest_ticket_price
    FROM event_base_raw r
),
buddy_ticket_activity AS (
    SELECT
        fe.viewer_user_id,
        t.event_id,
        COUNT(DISTINCT fe.buddy_user_id) AS buddy_going_count
    FROM friend_edges fe
    JOIN tickets_ticket t
        ON t.goer_id = fe.buddy_user_id
       AND t.status IN ('active', 'used')
    GROUP BY fe.viewer_user_id, t.event_id
),
buddy_interest_activity AS (
    SELECT
        fe.viewer_user_id,
        i.event_id,
        COUNT(DISTINCT fe.buddy_user_id) AS buddy_interested_count
    FROM friend_edges fe
    JOIN events_eventinterest i
        ON i.user_id = fe.buddy_user_id
    GROUP BY fe.viewer_user_id, i.event_id
),
known_host_history AS (
    SELECT
        t.goer_id AS viewer_user_id,
        e.host_id,
        COUNT(DISTINCT e.id) AS prior_host_event_count,
        MAX(e.end_time) AS last_attended_host_event_at
    FROM tickets_ticket t
    JOIN events_event e
        ON e.id = t.event_id
    WHERE t.status IN ('active', 'used')
      AND e.end_time < NOW()
    GROUP BY t.goer_id, e.host_id
),
viewer_event_candidates AS (
    SELECT bta.viewer_user_id, bta.event_id
    FROM buddy_ticket_activity bta
    UNION
    SELECT bia.viewer_user_id, bia.event_id
    FROM buddy_interest_activity bia
    UNION
    SELECT kh.viewer_user_id, eb.event_id
    FROM known_host_history kh
    JOIN event_base eb
        ON eb.host_id = kh.host_id
)
SELECT
    vec.viewer_user_id,
    eb.event_id,
    eb.host_id,
    eb.title,
    eb.slug,
    eb.description,
    eb.category_id,
    eb.category_slug,
    eb.category_name,
    eb.location_name,
    eb.location_address,
    eb.latitude,
    eb.longitude,
    eb.start_time,
    eb.end_time,
    eb.lifecycle_state,
    eb.attendee_count,
    eb.interest_count,
    eb.open_need_count,
    eb.cheapest_ticket_price,
    eb.is_online,
    NOT eb.is_online AS is_in_person,
    eb.online_platform,
    COALESCE(bta.buddy_going_count, 0) AS buddy_going_count,
    COALESCE(bia.buddy_interested_count, 0) AS buddy_interested_count,
    COALESCE(bta.buddy_going_count, 0) + COALESCE(bia.buddy_interested_count, 0)
        AS buddy_activity_count,
    (COALESCE(kh.prior_host_event_count, 0) > 0) AS host_known_to_viewer,
    COALESCE(kh.prior_host_event_count, 0) AS prior_host_event_count,
    kh.last_attended_host_event_at,
    (eb.cheapest_ticket_price = 0) AS is_free,
    (eb.cheapest_ticket_price <= 200) AS is_under_200,
    (eb.cheapest_ticket_price <= 500) AS is_under_500,
    (eb.open_need_count > 0) AS has_discount_available_proxy,
    (eb.start_time >= DATE_TRUNC('day', NOW())
        AND eb.start_time < DATE_TRUNC('day', NOW()) + INTERVAL '1 day') AS is_tonight,
    (eb.start_time >= DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
        AND eb.start_time < DATE_TRUNC('day', NOW()) + INTERVAL '2 days') AS is_tomorrow,
    (eb.start_time >= DATE_TRUNC('week', NOW()) + INTERVAL '5 days'
        AND eb.start_time < DATE_TRUNC('week', NOW()) + INTERVAL '7 days') AS is_this_weekend,
    (eb.start_time >= DATE_TRUNC('week', NOW()) + INTERVAL '7 days'
        AND eb.start_time < DATE_TRUNC('week', NOW()) + INTERVAL '14 days') AS is_next_week,
    (
        (COALESCE(bta.buddy_going_count, 0) * 8)
        + (COALESCE(bia.buddy_interested_count, 0) * 5)
        + (CASE WHEN COALESCE(kh.prior_host_event_count, 0) > 0 THEN 10 ELSE 0 END)
        + ((eb.ticket_velocity_7d + eb.interest_velocity_7d) * 3)
    ) AS network_score
FROM viewer_event_candidates vec
JOIN event_base eb
    ON eb.event_id = vec.event_id
LEFT JOIN buddy_ticket_activity bta
    ON bta.viewer_user_id = vec.viewer_user_id
   AND bta.event_id = vec.event_id
LEFT JOIN buddy_interest_activity bia
    ON bia.viewer_user_id = vec.viewer_user_id
   AND bia.event_id = vec.event_id
LEFT JOIN known_host_history kh
    ON kh.viewer_user_id = vec.viewer_user_id
   AND kh.host_id = eb.host_id;

CREATE VIEW browse_people_feed AS
WITH friend_edges AS (
    SELECT
        f.id AS friendship_id,
        f.user1_id AS viewer_user_id,
        f.user2_id AS buddy_user_id,
        f.met_at_event_id
    FROM events_friendship f
    WHERE f.status = 'accepted'
    UNION ALL
    SELECT
        f.id AS friendship_id,
        f.user2_id AS viewer_user_id,
        f.user1_id AS buddy_user_id,
        f.met_at_event_id
    FROM events_friendship f
    WHERE f.status = 'accepted'
),
ticket_rollup AS (
    SELECT
        t.event_id,
        COUNT(*) FILTER (WHERE t.status IN ('active', 'used')) AS attendee_count
    FROM tickets_ticket t
    GROUP BY t.event_id
),
tier_rollup AS (
    SELECT
        tt.event_id,
        MIN(tt.price) AS min_tier_price
    FROM events_eventtickettier tt
    GROUP BY tt.event_id
),
event_base_raw AS (
    SELECT
        e.id AS event_id,
        e.host_id,
        e.title,
        e.slug,
        e.category_id,
        c.slug AS category_slug,
        c.name AS category_name,
        e.location_name,
        e.location_address,
        e.latitude,
        e.longitude,
        e.start_time,
        e.end_time,
        e.lifecycle_state,
        COALESCE(tr.attendee_count, e.ticket_count, 0) AS attendee_count,
        tt.min_tier_price,
        e.ticket_price_standard,
        e.ticket_price_flexible,
        (LOWER(TRIM(COALESCE(e.location_address, ''))) = 'online event') AS is_online,
        NULL::text AS online_platform
    FROM events_event e
    LEFT JOIN events_eventcategory c
        ON c.id = e.category_id
    LEFT JOIN ticket_rollup tr
        ON tr.event_id = e.id
    LEFT JOIN tier_rollup tt
        ON tt.event_id = e.id
    WHERE e.lifecycle_state IN ('published', 'at_risk', 'postponed', 'event_ready', 'live')
      AND e.end_time >= NOW()
),
event_base AS (
    SELECT
        r.*,
        CASE
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_standard IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_standard, r.ticket_price_flexible)
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_standard IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_standard)
            WHEN r.min_tier_price IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.min_tier_price, r.ticket_price_flexible)
            WHEN r.ticket_price_standard IS NOT NULL
             AND r.ticket_price_flexible IS NOT NULL
                THEN LEAST(r.ticket_price_standard, r.ticket_price_flexible)
            WHEN r.min_tier_price IS NOT NULL
                THEN r.min_tier_price
            WHEN r.ticket_price_standard IS NOT NULL
                THEN r.ticket_price_standard
            WHEN r.ticket_price_flexible IS NOT NULL
                THEN r.ticket_price_flexible
            ELSE 0::numeric
        END AS cheapest_ticket_price
    FROM event_base_raw r
),
shared_history AS (
    SELECT
        fe.viewer_user_id,
        fe.buddy_user_id,
        COUNT(DISTINCT t1.event_id) AS shared_events_count
    FROM friend_edges fe
    JOIN tickets_ticket t1
        ON t1.goer_id = fe.viewer_user_id
       AND t1.status IN ('active', 'used')
    JOIN tickets_ticket t2
        ON t2.goer_id = fe.buddy_user_id
       AND t2.status IN ('active', 'used')
       AND t2.event_id = t1.event_id
    JOIN events_event e
        ON e.id = t1.event_id
    WHERE e.end_time < NOW()
    GROUP BY fe.viewer_user_id, fe.buddy_user_id
),
buddy_going_activity AS (
    SELECT
        fe.viewer_user_id,
        fe.buddy_user_id,
        fe.friendship_id,
        fe.met_at_event_id,
        t.event_id,
        'going'::text AS activity_type,
        t.purchased_at AS activity_at
    FROM friend_edges fe
    JOIN tickets_ticket t
        ON t.goer_id = fe.buddy_user_id
       AND t.status IN ('active', 'used')
),
buddy_interest_activity AS (
    SELECT
        fe.viewer_user_id,
        fe.buddy_user_id,
        fe.friendship_id,
        fe.met_at_event_id,
        i.event_id,
        'interested'::text AS activity_type,
        i.created_at AS activity_at
    FROM friend_edges fe
    JOIN events_eventinterest i
        ON i.user_id = fe.buddy_user_id
),
all_activity AS (
    SELECT * FROM buddy_going_activity
    UNION ALL
    SELECT * FROM buddy_interest_activity
)
SELECT
    a.viewer_user_id,
    a.buddy_user_id,
    a.friendship_id,
    a.met_at_event_id,
    met_event.title AS met_at_event_title,
    u.username AS buddy_username,
    u.first_name AS buddy_first_name,
    u.last_name AS buddy_last_name,
    p.avatar AS buddy_avatar,
    COALESCE(sh.shared_events_count, 0) AS shared_events_count,
    a.event_id,
    eb.host_id,
    eb.title AS event_title,
    eb.slug AS event_slug,
    eb.category_id,
    eb.category_slug,
    eb.category_name,
    eb.location_name,
    eb.location_address,
    eb.latitude,
    eb.longitude,
    eb.start_time,
    eb.end_time,
    eb.lifecycle_state,
    eb.attendee_count,
    eb.cheapest_ticket_price,
    eb.is_online,
    NOT eb.is_online AS is_in_person,
    eb.online_platform,
    a.activity_type,
    a.activity_at,
    (eb.cheapest_ticket_price = 0) AS is_free,
    (eb.cheapest_ticket_price <= 200) AS is_under_200,
    (eb.cheapest_ticket_price <= 500) AS is_under_500,
    (eb.start_time >= DATE_TRUNC('day', NOW())
        AND eb.start_time < DATE_TRUNC('day', NOW()) + INTERVAL '1 day') AS is_tonight,
    (eb.start_time >= DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
        AND eb.start_time < DATE_TRUNC('day', NOW()) + INTERVAL '2 days') AS is_tomorrow,
    (eb.start_time >= DATE_TRUNC('week', NOW()) + INTERVAL '5 days'
        AND eb.start_time < DATE_TRUNC('week', NOW()) + INTERVAL '7 days') AS is_this_weekend,
    (eb.start_time >= DATE_TRUNC('week', NOW()) + INTERVAL '7 days'
        AND eb.start_time < DATE_TRUNC('week', NOW()) + INTERVAL '14 days') AS is_next_week,
    (
        (CASE WHEN a.activity_type = 'going' THEN 15 ELSE 8 END)
        + (COALESCE(sh.shared_events_count, 0) * 3)
        + eb.attendee_count
    ) AS person_score
FROM all_activity a
JOIN event_base eb
    ON eb.event_id = a.event_id
JOIN auth_user u
    ON u.id = a.buddy_user_id
LEFT JOIN profiles_userprofile p
    ON p.user_id = u.id
LEFT JOIN shared_history sh
    ON sh.viewer_user_id = a.viewer_user_id
   AND sh.buddy_user_id = a.buddy_user_id
LEFT JOIN events_event met_event
    ON met_event.id = a.met_at_event_id;
