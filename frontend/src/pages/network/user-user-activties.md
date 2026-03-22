
| # | User-visible label (pattern)  | Origin data | sorted by data |
| - | -----------------------------  | ------------- | ------------- |
| 1 | "{orbit category} Friend request sent”  | `friendship.orbit_category`       |            `friendship.created_at` |
| 2 | “Became {orbit category} friends”  | `friendship.orbit_category`       |            `friendship.accepted_at` |
| 3 | “Went to {event} together”  |  for event: `eventOverviewRows.attendee_user_id = target`; `same = currentuser`; and event.lifecycle_state == 'completed' | `event.start_time`  |
| 4 | “Going to {event} together”  | same as went to event together , event.lifecycle_state != 'completed' | `event.start_time`  |
| 5 | “You hosted {target}”  | `eventOverviewRows.attendee_user_id = target`  and `eventOverviewRows.host_user_id = currentUserId` | `event.start_time`  |
| 6 | “{target} hosted you”  | the above - reversed | `event.start_time` |
| 7 | “You serviced {target}”  | `eventOverviewRows.attendee_user_id = target`  and `eventOverviewRows.need_assigned_user_id = currentUserId` | `event.start_time`  |
| 8 | “{target} serviced you”  | the above - reversed | `event.start_time` |
| 9 | “{target} is hosting {event}”  | `eventOverviewRows.host_user_id = target` any event | `event.start_time` |
| 10 | “{target} is servicing at {event}”  | `eventOverviewRows.need_assigned_user_id = target` any event | `event.start_time` |
| 11 | “You are hosting {event}”  | `eventOverviewRows.host_user_id = currentUserId` any event | `event.start_time` |
| 12 | “You are servicing at {event}”  | `eventOverviewRows.need_assigned_user_id = currentUserId` any event | `event.start_time` |

