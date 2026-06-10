# Content Entry Notes

Running log of formatting decisions, special cases, and quirks encountered per chapter/section. Use this to QA entries and as a reference when entering future content.

---

## Manual para el Maestro (mft.json)

### Ch16 — ¿Cómo debe pasar el día el maestro de Dios? (11 paragraphs)
- P3 v6→v7: comma continuation (`Eso depende del mismo maestro de Dios,` → `quien no puede…`)
- P7 v2→v3: comma continuation (`ha dejado de interesarle,` → `pues está a salvo…`)
- P10 v5→v6: colon continuation with embedded quote (`Quizá necesite recordar: \"Dios está conmigo.` → `No puedo ser engañado\".`)
- P10 v10: `\"sacrificio\"` escaped
- P11 v6: full quoted sentence `\"No hay más voluntad que la de Dios.\"`

### Ch17 — ¿Cómo lidian los maestros de Dios con los pensamientos mágicos? (9 paragraphs)
- P2 v8→v9: comma continuation (`se le concede su propio regalo,` → `pues él solo puede dar…`)
- P4 v2→v3: direct continuation (v2 ends without period); v2 has `_aparentemente_` italic
- P5 v8: `\"enemigo\"` escaped
- P6 v8: `\"enemigo\"`, v10: `\"contrincante\"`, v11: `\"olvido\"` — all escaped
- P7 v3→v4: colon continuation with embedded quote (`atemorizada: \"has usurpado el lugar de Dios.` → `No creas que Él se ha olvidado\".`)
- P7 v7→v8: comma continuation (`no queda ninguna esperanza,` → `excepto la de matar.`)
- P7 v11–v13: quoted speech block — v11 opens `\"Mata o te matarán…`, v13 closes `…condenado a morir.\"`
- P8 v1→v2: comma continuation; v3→v4: direct continuation
- P9: footnote verse `"a"` placed after v7 (`No obstante, es un testigo fidedigno…`)

### Ch18 — ¿Cómo se lleva a cabo la corrección? (4 paragraphs)
- P1 v3: `\"probado\"` escaped; v8→v9: comma continuation
- P2 v3→v4: comma continuation; v4: `{NT:impecabilidad}` tag (key already exists in NT_NOTES from prior chapters)
- P3: **split into text block (v1–v6) + stanza block (v7–v12)** — v6 ends with colon introducing the Correction's quoted response
  - v1: `\"¡La culpa es real!\"` escaped
  - v3: `\"ven\"` and `\"oír\"` escaped; v3→v4: direct continuation (v3 has no closing period)
  - Stanza v7→v8: comma continuation (`Confundes tus interpretaciones con la verdad,` → `y te equivocas.`)
- P4: no special cases

### Ch19 — ¿Qué es la justicia? (5 paragraphs)
- P3 v4: `\"pecados\"` escaped; v5: `\"pecado\"` escaped
- P4 v4→v5: direct continuation (v4 ends without period: `…la Compleción es inmortal` → `y por siempre semejante…`)

### Ch20 — ¿Qué es la Paz de Dios? (6 paragraphs)
- P3 v7: `_tiene que_` italic mid-sentence
- P4 v3: source text has apparent typo — "La guerra volverá a aceptarse se volverá a aceptar una vez más" — preserved as-is from source

### Ch21 — ¿Qué papel desempeñan las palabras en el proceso de curación? (5 paragraphs)
- P4 v6: escaped quoted lesson title `\"Me haré a un lado y dejaré que Él me muestre el camino\"`

### Ch22 — ¿Qué relación existe entre la curación y la Expiación? (7 paragraphs)
- P4 v5: `_y_` italic (Él mira más allá de la mente `_y_` del cuerpo)
- P7 v10: escaped quoted speech `\"Este es mi Hijo amado, que fue creado perfecto y que así ha de permanecer eternamente\"`

### Ch23 — ¿Desempeña Jesús un papel especial en la curación? (7 paragraphs)
- P1 v4: escaped quoted scripture `\"Pide en el nombre de Jesucristo\"`
