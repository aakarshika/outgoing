import json
import random
from pathlib import Path
from datetime import datetime, timedelta, timezone

from django.core.management.base import BaseCommand

HERE = Path(__file__).resolve().parent
HELPERS_DIR = HERE / "seed-helper-data"

class Command(BaseCommand):
    help = "Generates a simple JSON seed dataset strictly adhering to seed_description.md and counts.md."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            type=str,
            default=str(HERE / "seed_simple_generated.json"),
            help="Output JSON path.",
        )
        parser.add_argument("--rng-seed", type=int, default=1337, help="Random seed for reproducibility.")

    def handle(self, *args, **options):
        rng = random.Random(options["rng_seed"])
        out_path = Path(options["output"]).resolve()

        # Load helper data
        with open(HELPERS_DIR / "users_seed.json", "r", encoding="utf-8") as f:
            users_seed = json.load(f)
        with open(HELPERS_DIR / "event_title_seed.json", "r", encoding="utf-8") as f:
            event_titles = json.load(f)
        with open(HELPERS_DIR / "service_categories.json", "r", encoding="utf-8") as f:
            service_categories = json.load(f)

        base_users = users_seed.get("users", [])
        
        # Flatten service category IDs
        all_service_ids = []
        for group in service_categories:
            for item in group.get("items", []):
                if "id" in item:
                    all_service_ids.append(item["id"])

        # Flatten event titles by category
        titles_by_cat = {}
        for block in event_titles:
            cat = block.get("category")
            events = block.get("events", [])
            titles_by_cat[cat] = [{"name": e["name"], "description": e["description"]} for e in events]

        # Datastores for generated data
        out_users = []
        out_services = []
        out_events = []
        out_event_ticket_tiers = []
        out_event_needs = []
        out_tickets = []

        # --- Phase 1: Users ---
        hosts = []
        vendors = []
        goers = []

        # Parse base users from users_seed
        for u in base_users:
            username = u.get("username", "")
            if not username:
                continue
            
            # Simple role derivation from username pattern or just splitting
            # The counts.md says: pick hosts from users_seed, pick vendors from users_seed
            # We'll distribute them arbitrarily if not specified, but typically 'host' or 'vendor' is in the name.
            role = "user"
            if "host" in username.lower():
                role = "host"
            elif "vendor" in username.lower():
                role = "vendor"

            first_last = username.split('_') if '_' in username else username.split('-')
            first_name = first_last[0] if len(first_last) > 0 else username
            last_name = first_last[1] if len(first_last) > 1 else username

            user_obj = {
                "username": username,
                "email": f"{username}@outgoing.com",
                "password": "password123",
                "first_name": first_name.capitalize(),
                "last_name": last_name.capitalize()
            }
            out_users.append(user_obj)

            if role == "host":
                hosts.append(user_obj)
            else:
                vendors.append(user_obj) # If not host, treat as vendor for seed purposes

        # If zero hosts or vendors, just artificially split the base users!
        if not hosts and out_users:
            hosts = out_users[:len(out_users)//2]
            vendors = out_users[len(out_users)//2:]

        # Goers
        for i in range(1, 61):
            username = f"goer_{i}"
            goer_obj = {
                "username": username,
                "email": f"{username}@outgoing.com",
                "password": "password123",
                "first_name": "Goer",
                "last_name": str(i)
            }
            out_users.append(goer_obj)
            goers.append(goer_obj)

        now = datetime.now(timezone.utc)
        
        # --- Phase 2: Events & Tiers ---
        valid_event_categories = ['arts-culture', 'comedy', 'music']
        event_counter = 1

        for host in hosts:
            cat = rng.choice(valid_event_categories)
            cat_titles = titles_by_cat.get(cat, [])
            if not cat_titles:
                continue

            for t_item in cat_titles:
                start_days_ahead = rng.randint(1, 30)
                start_time = now + timedelta(days=start_days_ahead, hours=rng.randint(0, 23))
                end_time = start_time + timedelta(days=rng.randint(0, 4), hours=rng.randint(1, 12))
                capacity = rng.randint(20, 40)
                
                event_key = f"evt_{event_counter}"
                is_published = rng.random() < 0.7
                status = "published" if is_published else "draft"
                
                event_obj = {
                    "_key": event_key, # used internally for relation linking
                    "host": host["username"],
                    "category": cat,
                    "title": t_item["name"],
                    "start_time": start_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "end_time": end_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "status": status,
                    "lifecycle_state": status,
                    "capacity": capacity
                }
                out_events.append(event_obj)

                # Tiers
                num_tiers = rng.randint(1, 3)
                tier_names = ["General", "Premium", "VIP", "Adults + 1 Child"]
                tier_cap = capacity // num_tiers
                for t_idx in range(num_tiers):
                    tier_obj = {
                        "_key": f"{event_key}_tier_{t_idx}",
                        "event": event_key,
                        "name": tier_names[t_idx],
                        "price": 0,
                        "capacity": tier_cap
                    }
                    out_event_ticket_tiers.append(tier_obj)

                # --- Phase 3: Event Needs ---
                num_needs = rng.randint(2, 6)
                need_categories = rng.sample(all_service_ids, min(num_needs, len(all_service_ids)))
                for nc in need_categories:
                    need_obj = {
                        "event": event_key,
                        "category": nc,
                        "title": None,
                        "status": "pending",
                        "assigned_vendor": None
                    }
                    out_event_needs.append(need_obj)

                event_counter += 1

        # --- Phase 4: Vendor Services ---
        for vendor in vendors:
            num_services = rng.randint(4, 8)
            picked_services = rng.sample(all_service_ids, min(num_services, len(all_service_ids)))
            for svc_cat in picked_services:
                svc_obj = {
                    "vendor": vendor["username"],
                    "title": f"Service {svc_cat} by {vendor['username']}", # Title required for vendors per instructions
                    "description": "",
                    "category": svc_cat,
                    "location_city": "New York"
                }
                out_services.append(svc_obj)

        # --- Phase 5: Tickets ---
        # Track how many tickets are sold per tier
        tier_sold_counts = {t["_key"]: 0 for t in out_event_ticket_tiers}

        for goer in goers:
            for ev in out_events:
                if rng.random() < 0.3:
                    # Filter tiers for this event that still have capacity
                    ev_tiers = [
                        t for t in out_event_ticket_tiers 
                        if t["event"] == ev["_key"] and tier_sold_counts[t["_key"]] < t.get("capacity", float('inf'))
                    ]
                    
                    if ev_tiers:
                        tier = rng.choice(ev_tiers)
                        ticket_obj = {
                            "goer": goer["username"],
                            "tier": tier["_key"]
                        }
                        out_tickets.append(ticket_obj)
                        tier_sold_counts[tier["_key"]] += 1

        result = {
            "users": out_users,
            "services": out_services,
            "events": out_events,
            "event_ticket_tiers": out_event_ticket_tiers,
            "event_needs": out_event_needs,
            "tickets": out_tickets
        }

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
            
        self.stdout.write(self.style.SUCCESS(f"Successfully generated seed data at {out_path}"))

