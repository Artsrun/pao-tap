# PAO TAP

Single-file mobile WebGL trainer for a 00–19 Person-Action-Object deck.

Open `index.html` on a phone. GitHub Pages works from the repo root.

## What it is

A digit is a scene: **who does what to which thing**.

- **Bind** — tap pieces into WHO / DOES / THING, then Save
- **Recall** — tap person → action → object for the shown digit
- **Export JSON** — download + clipboard (`localStorage` key `pao-deck-v2`)

## Deck provenance (not fabricated averages)

There is no published “average user PAO dataset.” This starter does not pretend to be one.

| Slot | Source |
|---|---|
| Objects 00–19 | Public [Art of Memory Forum Major System peg worksheet](https://forum.artofmemory.com/t/major-system-peg-list-00-99-worksheet/32589) (2017-05-25). Key **11** uses `tote` instead of the forum’s crude peg. |
| Persons / actions | Common English roles and verbs, unique across the range. Not a championship PAO. |
| Phonetics | Major System: 0=S/Z 1=T/D 2=N 3=M 4=R 5=L 6=SH/J 7=K/G 8=F/V 9=P/B |

See `pao.json` `provenance` field.

## Stack

No build. WebGL points + HTML overlay. `touch-action: none`, 44px tap targets, safe-area insets.

## License

MIT
