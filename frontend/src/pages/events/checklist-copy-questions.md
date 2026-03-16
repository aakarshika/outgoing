# Checklist Copy Questions

Please edit the assumptions below directly.

## 1. Sales threshold looks healthy

- Condition assumption:
  Mark this as checked when ticket sales are healthy, or when a later milestone in this 3-item sequence is already checked.

- Before checked text assumption:
  `Min 20% sold (x/y). Now z%.`
  If capacity is missing: `Set capacity to track readiness against ticket sales.`

- After checked text assumption:
  `Min 20% sold (x/y). Now z%.`
  If it is only checked because a later milestone is checked: `Readiness milestone reached for this event.`

## 2. Go Live, and start admitting guests

- Condition assumption:
  Mark this as checked when all earlier checklist items are complete, or when `Live the event` is already checked.

- Before checked text assumption:
  `Finish the checklist above before going live.`

- After checked text assumption:
  `You are perfectly ready to go live now.`

## 3. Live the event

- Condition assumption:
  Do not show this item while unchecked.
  Show it as checked when event lifecycle is `live` or `completed`.

- Before checked text assumption:
  `Do not show when unchecked.`

- After checked text assumption:
  If lifecycle is `live`:
  `You are live. Nothing to do here but manage now, and celebrate later. Don't forget to add highlights, and return and tell us all about it!`

  If lifecycle is `completed`:
  `All wrapped up here! Hope it went well.`

## Notes

- Assumption:
  These 3 items are cumulative in order:
  `Sales threshold looks healthy` -> `Go Live, and start admitting guests` -> `Live the event`

- Assumption:
  If any later one is checked, all earlier ones in this 3-item sequence should also render checked.
