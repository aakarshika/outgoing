


# Hosts	(decided from seed) - select a user of host type from users_seed.json. pick one by one and follow the following directions. 
    PICK A CATEGORY from his categories. seeed is only for[ 'arts', 'comedy', 'music'] - use this to pick events from event_title_seed.json
       
# Events - use the category of host to pick events from event_title_seed.json create all the events in the list with given name and description.
    5 events seed data is provided for 3 categories, it will create 15 events.
    add capacity of events - a random number from 20-40
    0.7 probability: ADD the host to HIGHLIGHT GIVERS LIST (user_id, event_id)

    
# Services/Needs   
    for all events created: 
        randomly pick 2-6 services from the service_categories.json from any group.
        create the needs for this event. 


----- next phase. 
# Vendors -  (decided from seed) - select a user of vendor type from users_seed.json. pick one by one and follow the following directions. for each vendor:  
    randomly pick 4-8 services from service_categories.json from any category. 
    create the services given by this vendor. 
    if a need that is created for this event and this vendor has that service:
        0.5 probablity: create an application for this event for this service for this vendor.
            0.5 probability: status of application - "accepted" or "pending". - when accepting
    



----- next phase.
# Goers	60 - create all goers with goer_index username.
    for each goer, iterate through all the events created. 
        0.5 probability: buy ticket for this event.
            0.5 probability: status of ticket - "active" or "used".
            0.7 probability: ADD TO HIGHLIGHT GIVERS LIST (user_id, event_id)
            0.5 probability: ADD TO REVIEW GIVERS LIST (user_id, event_id)
        


# Highlights	
    for all HIGHLIGHT GIVERS LIST:
        pick a random highlight from the seed data list and create a highlight for this event.

    "arts": [
        "It was such a fun event! I learned a lot.",
        "Look at my first attempt at this flower painting!.",
        ....
    ]

# Reviews	
    for all HIGHLIGHT GIVERS LIST:
        pick a random highlight from the same highlight list as above and add a review.