# Sandakers verden

Samleside for de digitale læringsressursene jeg bruker i undervisningen. Siden er laget for
klasserommet: den skal være rolig å se på, rask å laste, og enkel nok til at elevene finner
fram selv.

**Publisert på:** https://theodorjs.github.io/sandakersverden/

## Ressursene

| # | Ressurs | Lenke |
|---|---------|-------|
| 1 | Klasseromsskjerm | https://theodorjs.github.io/Klasseromsskjerm/ |
| 2 | Klassekart | https://theodorjs.github.io/kooperative-grupper/ |
| 3 | Fortellerverksted | https://theodorjs.github.io/forteller/ |
| 4 | Setningsverksted | https://theodorjs.github.io/setning/ |
| 5 | Næringskjeder og økosystemer | https://theodorjs.github.io/naturfag/ |
| 6 | Svartedauden | https://theodorjs.github.io/svartedauden/ |
| 7 | Hvorfor er det ikke fredag? | https://theodorjs.github.io/hvorforerdetikkefredag/ |

## Slik er siden bygget

Tre filer, ingen byggesteg og ingen avhengigheter som må installeres:

- `index.html` – innholdet: toppseksjonen og de sju ressurskortene med SVG-illustrasjoner
- `styles.css` – all utforming
- `script.js` – stjernehimmelen og 3D-scenen

3D-scenen bruker [Three.js](https://threejs.org/) lastet som ES-modul fra et CDN. Jordkloden,
skylaget, månen, raketten og UFO-en tegnes på canvas i kode, så det finnes ingen bildefiler å
holde styr på. Hvis WebGL ikke er tilgjengelig, vises en enkel statisk klode i stedet.

Alle bevegelser stopper automatisk for brukere som har slått på «reduser bevegelse» i
operativsystemet.

## Kjøre siden lokalt

```bash
python3 -m http.server 8471
```

Åpne deretter http://localhost:8471 i nettleseren. (Det holder også å åpne `index.html`
direkte, men en lokal server gir et mer korrekt bilde.)

## Legge til en ny ressurs

Kopier et av `<a class="card">`-blokkene i `index.html`, og bytt ut lenken, overskriften,
beskrivelsen, merkelappene og SVG-illustrasjonen.

Ressurser som ikke er publisert ennå, ligger som `<article class="card">` med merket
«Kommer snart» i stedet for en lenke. Når en slik ressurs blir klar: bytt `<article>` til
`<a href="...">`, fjern `<span class="badge">` og bytt «Under arbeid» til «Åpne».

### Temaer og temaknapper

Hvert kort har én farget temamerkelapp, for eksempel:

```html
<span class="chip tema" data-tema="norsk">Norsk</span>
```

Grå merkelapper (`<span class="chip">Grammatikk</span>`) er bare beskrivende og blir ikke
egne knapper.

Knapperaden over kortene lages automatisk ut fra temamerkelappene, så den skal aldri
redigeres for hånd. Bruker du et tema som finnes fra før, dukker kortet opp under riktig
knapp av seg selv.

| Tema | `data-tema` | Farge |
|------|-------------|-------|
| Verktøy | `verktoy` | turkis |
| Norsk | `norsk` | lilla |
| Naturfag | `naturfag` | grønn |
| Samfunnsfag | `samfunnsfag` | korall |
| Moro | `moro` | gul |

Et helt nytt tema trenger én linje i temablokken øverst i ressursdelen av `styles.css`.
Fargen der brukes både på knappen og på merkelappen, så de alltid er like.

## Å gjøre

- [ ] Legge inn e-postadresse i kontaktlenka nederst i `index.html` (står nå som
      `mailto:DIN-EPOST-HER`)

---

© 2026 Theodor Sandaker
