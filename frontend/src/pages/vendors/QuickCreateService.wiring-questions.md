# Quick Create Service: only important questions

I wired the search-page quick create as a single-page overlay using the same real fields the current create service API already supports:

- `title`
- `category`
- `description`
- optional `base_price`
- optional `travel_radius_miles`
- optional `portfolio_url`
- optional `portfolio_image`

## Questions I still need from you

1. Should quick create stay a single-page overlay, or do you want it split into multiple pages/steps?
   If split, list the exact pages you want, for example: `Basics`, `Pricing`, `Portfolio`.

2. If we do add multiple pages later, which fields belong on each page?
   Right now I assumed one compact page because that matches the current backend payload and keeps the search flow fast.

3. After service creation from search, should we always just close and stay on the same page?
   Current implementation assumes `yes` with no redirect.
