# Chip In tab UI questions

Please edit answers inline under each question.

## 1) Expand behavior

- Should the card expand when clicking only the chip (`Send inquiry` / `Show invite`)?
- Or should clicking anywhere on the card expand it?

Your answer:
yes. clicking card will take you to events/:id

## 2) Primary button actions

- For now, the expanded panel is UI-only.
- Should `Send inquiry` open an existing modal/route (if yes, share path/expected behavior)?
- Should invite actions (`I'm in`, `Not this time`) hit existing endpoints now, or stay UI-only?

Your answer:
later.

## 3) Which cards get action chips?

- Current logic:
  - `Show invite` if `is_invited === true`
  - `Send inquiry` if user has a matching service for that need
- For cards with neither condition, should we show a third chip (`Create service`) or no chip?

Your answer: yes. create service.

## 4) Compensation choices

- I added: `Free entry` and `<budget> cash` as selectable chips.
- Do you also want a middle option like `% discount` when available?

Your answer: yes. we will do the calculations and show them

## 5) Copy tone

- Should copy stay conversational (similar to your HTML prototype), or become shorter and more product-neutral?

Your answer: same exact as html.
