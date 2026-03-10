CREATE VIEW event_overview AS
WITH needs_per_event AS (
    SELECT
        event_id,
        COUNT(*) AS total_needs,
        COUNT(*) FILTER (WHERE status = 'filled') AS needs_filled,
        COUNT(*) FILTER (WHERE status = 'override_filled') AS needs_override_filled
    FROM needs_eventneed
    GROUP BY event_id
),
tickets_per_event AS (
    SELECT
        event_id,
        COUNT(*) FILTER (WHERE status <> 'cancelled') AS tickets_purchased_not_cancelled,
        COUNT(*) FILTER (WHERE status = 'used') AS tickets_used
    FROM tickets_ticket
    GROUP BY event_id
)
SELECT
    e.id AS event_id,
    e.created_at AS event_created_date,
    e.lifecycle_state AS event_lifecycle_state,
    e.capacity AS event_capacity,
    e.host_id AS host_user_id,

    COALESCE(ne.total_needs, 0) AS number_of_total_needs,
    COALESCE(ne.needs_filled, 0) AS number_of_needs_filled,
    COALESCE(ne.needs_override_filled, 0) AS number_of_needs_override_filled,

    n.id AS need_id,
    ni.vendor_id AS need_application_requested_by_host_vendor_user_id,
    na.vendor_id AS need_applied_to_user_id,
    n.assigned_vendor_id AS need_assigned_user_id,

    na.id AS need_application_id,
    na.status AS need_application_status,
    na.created_at AS need_application_created_date,
    n.status AS need_status,

    COALESCE(te.tickets_purchased_not_cancelled, 0) AS number_of_tickets_purchased_not_cancelled,
    COALESCE(te.tickets_used, 0) AS number_of_tickets_used,

    t.goer_id AS attendee_user_id,
    t.purchased_at AS ticket_created_date,
    t.status AS ticket_status
FROM events_event e
LEFT JOIN needs_per_event ne
    ON ne.event_id = e.id
LEFT JOIN tickets_per_event te
    ON te.event_id = e.id
LEFT JOIN needs_eventneed n
    ON n.event_id = e.id
LEFT JOIN needs_needapplication na
    ON na.need_id = n.id
LEFT JOIN needs_needinvite ni
    ON ni.need_id = n.id
LEFT JOIN tickets_ticket t
    ON t.event_id = e.id
    ;