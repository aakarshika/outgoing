import secrets
from django.core.management.base import BaseCommand
from apps.tickets.models import Ticket

class Command(BaseCommand):
    help = 'Populates qr_secret for all existing tickets that do not have one.'

    def handle(self, *args, **options):
        self.stdout.write("Searching for tickets with missing secrets...")
        tickets = Ticket.objects.filter(qr_secret__isnull=True) | Ticket.objects.filter(qr_secret="")
        count = tickets.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS("All tickets already have secrets. Nothing to do."))
            return

        self.stdout.write(f"Found {count} tickets. Populating...")
        
        updated = 0
        for ticket in tickets:
            ticket.qr_secret = secrets.token_hex(32)
            ticket.save(update_fields=['qr_secret'])
            updated += 1
            if updated % 10 == 0:
                self.stdout.write(f"Progress: {updated}/{count}")

        self.stdout.write(self.style.SUCCESS(f"Success! Populated secrets for {updated} tickets."))
