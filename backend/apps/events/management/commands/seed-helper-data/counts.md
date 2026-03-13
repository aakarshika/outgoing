


# Hosts	(decided from seed) - select a user of host type from users_seed.json. pick one by one and follow the following directions. 
    PICK A CATEGORY from his categories. seeed is only for[ 'arts-culture', 'comedy', 'music'] - use this to pick events from event_title_seed.json
       
# Events - use the category of host to pick events from event_title_seed.json create all the events in the list with given name and description.
    5 events seed data is provided for 3 categories, it will create 15 events.
    add capacity of events - a random number from 20-40


python manage.py generate_seed_simple
python manage.py seed_simple
    
# Services/Needs   
    for all events created: 
        randomly pick 2-6 services from the service_categories.json from any group.
        create the needs for this event. 


----- next phase. 
# Vendors -  (decided from seed) - select a user of vendor type from users_seed.json. pick one by one and follow the following directions. for each vendor:  
    randomly pick 4-8 services from service_categories.json from any category. 
    create the services given by this vendor. 
    



----- next phase.
# Goers	60 - create all goers with goer_index username.
    for each goer, iterate through all the events created. 
        0.5 probability: buy ticket for this event.
            0.5 probability: status of ticket - bought
        

DO NOT CREATE ANY HIGHLIGHTS OR REVIEWS or any other table's data .


only the tables and columns described in the seed_description.md file will be created.

