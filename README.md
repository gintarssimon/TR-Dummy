# Cash-Unterkonten · Klick-Prototyp

Funktionaler Dummy im Stil der Trade-Republic-App, gebaut um das **ausgedachte Feature „Unterkonten im Cash-Bereich“** zu präsentieren.
Alle Namen, Beträge, Kurse und IBANs sind zufällig erzeugt. Es gibt kein Login, kein Backend und keine echten Daten. Das ist ein privates Konzept für eine Präsentation: Es stammt nicht von Trade Republic und steht in keiner Verbindung zum Unternehmen; Name und Wortmarke gehören Trade Republic.

![Vorschau: Cash-Übersicht, Unterkonto, Umbuchen, Details](docs/preview.png)

## Starten

- **Live:** <https://tr-dummy.pages.dev> (Cloudflare Pages). Am Handy öffnen und über „Zum Home-Bildschirm“ hinzufügen, dann läuft die App im Vollbild ohne Browserleiste. Die Seite ist für jeden mit dem Link erreichbar, aber von Suchmaschinen ausgeschlossen.
- **Lokal:** `index.html` im Browser öffnen. Am Rechner erscheint die App in einem Handy-Rahmen.

`index.html` ist eine einzelne, eigenständige Datei (CSS, JS, Schrift und Logos inline) und funktioniert auch offline.

## Zufallsdaten

- Beim ersten Öffnen wird ein Datensatz gewürfelt und im Browser gespeichert, damit er während der Präsentation stabil bleibt.
- **Profil (Avatar oben rechts) → Demo → „Neue Zufallsdaten“** würfelt neu.
- **„Ohne Unterkonten starten“** zeigt den Einstieg ins Feature (nur Hauptkonto + Hinweiskarte).
- Mit `index.html?seed=1234` lässt sich ein fester Datensatz erzwingen (gleicher Seed = gleiche Namen und Zahlen).

## Das Feature: Unterkonten

| Wo | Was |
| --- | --- |
| Cash → „Konten“ | Übersicht aller Konten mit Saldo und Anteil am gesamten Cash, „Neu +“ legt ein Unterkonto an |
| Tippen auf ein Konto | Eigene Ansicht je Unterkonto: Saldo, Sparziel-Fortschritt, Transaktionen, eigene IBAN. Der Pfeil oben rechts führt zurück zur Übersicht |
| „Überweisung“ → „Umbuchen“ | Geld sofort zwischen Konten verschieben (Konten wählbar, Tauschen-Knopf, Schnellbeträge) |
| Karten im Unterkonto | Sparziel, monatliche Regel (Dauerauftrag vom Hauptkonto), Kartenverknüpfung, Details |
| Karte | „Zahle mit“ legt fest, von welchem Konto Kartenzahlungen abgebucht werden; „Round up“ wählt das Unterkonto fürs Aufrunden. „Kartenzahlung simulieren“ zeigt das live |
| Details | IBAN kopieren, Name und Symbol ändern, Unterkonto schließen (Guthaben geht zurück aufs Hauptkonto) |
| Transaktionen, Statistik | Filter-Chips je Konto |
| Kaufen, Sparpläne | „Zahlen mit“ lässt ein Unterkonto als Quelle wählen |

Der Rest der App ist ebenfalls klickbar, damit der Kontext stimmt: Ladescreen, Portfolio mit Chart, Suche, Einzelwert-Ansicht (Chart in Markenfarbe, Kennzahlen, Orderbuch, Derivate, Nachrichten, Ereignisse), Kaufen/Verkaufen, Sparpläne, Karten-Menü, Zinsen, Statistik und Profil.

### Vorschlag für den Ablauf einer Demo

1. Profil → „Ohne Unterkonten starten“ → Cash zeigt die Hinweiskarte.
2. Unterkonto eröffnen (z. B. „Urlaub“), Sparziel setzen, Geld umbuchen.
3. Monatliche Regel anlegen → erscheint unter „Demnächst“.
4. Karte → Aufrunden aktivieren → „Kartenzahlung simulieren“.
5. Zurück zur Übersicht: Split aller Konten, Transaktionen und Statistik je Konto filtern.

## Aktien, Logos und Symbole

- Aktien und Kryptowährungen sind echte Titel mit ihren echten Logos; viele Händler in den Transaktionen ebenfalls. **Kurse, Renditen und Umsätze sind erfunden.**
- Die Logos stammen als Vektordaten aus dem Paket [simple-icons](https://simpleicons.org) (CC0) und werden mit `tools/make-logos.mjs` nach `src/js/logos.js` übernommen. Die Marken gehören ihren Inhabern – gedacht ist das für die private Präsentation, nicht für eine Veröffentlichung.
- Unterkonten haben schlichte Symbole im selben Schwarz-Weiß-Stil wie die übrigen Icons (keine Emojis, keine Farben).
- Kennzahlen, Nachrichten und Termine in der Einzelwert-Ansicht sind Platzhalter und frei erfunden; nur die Kurzbeschreibungen der Unternehmen sind allgemein gehalten und sachlich.
- Schrift: [Inter](https://rsms.me/inter/) (SIL Open Font License), als Datei eingebettet, damit die App auf jedem Gerät gleich aussieht.

## Animationen

Zustandswechsel werden nicht hart umgeschaltet: Ansichten gleiten ineinander (Tabs seitlich, Konten in die Tiefe), Sheets fahren weich ein und die Ebene dahinter tritt zurück, der Chart morpht zwischen Zeiträumen, Beträge zählen hoch, Schalter, Chips, Ringe, Sparziel-Balken und Statistik-Bubbles laufen in ihren neuen Zustand. Zwischen Portfolio und Cash kann man wischen, Sheets lassen sich nach unten wegziehen. Bei „Bewegung reduzieren“ im System sind die Animationen aus.

## Entwicklung

```
src/index.html      Grundgerüst
src/styles.css      Styling
src/fonts/          Schrift Inter
src/js/util.js      Zufall (Seed), Formatierung, Icons, Konto-Symbole
src/js/logos.js     Marken-Logos (erzeugt, nicht von Hand bearbeiten)
src/js/data.js      Datenpools und Generator
src/js/meta.js      Beschreibungen und (erfundene) Kennzahlen je Wertpapier, Handelszeiten
src/js/store.js     Zustand, Speicherung, Aktionen auf den Daten
src/js/charts.js    Kursverläufe und SVG-Charts
src/js/views.js     Hauptansichten (Portfolio, Cash, Profil)
src/js/sheets.js    Alle Sheets (Transaktionen, Umbuchen, Suche, …)
src/js/app.js       Rendering (DOM-Abgleich, Übergänge), Events, Sheet-Stack
tools/              Logo-Import und Deployment
```

Zum Entwickeln `src/index.html` direkt öffnen. `node build.mjs` schreibt daraus die einzelne `index.html` im Hauptverzeichnis und den Ordner `dist/` zum Ausliefern (keine Abhängigkeiten nötig).

## Deployment (Cloudflare Pages)

```
CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… tools/deploy-pages.sh
```

Das Skript baut, bettet `dist/` in einen kleinen Pages-Worker ein und legt über die Cloudflare-API ein neues Deployment des Projekts `tr-dummy` an. Das Token braucht das Recht „Cloudflare Pages: Edit“. Alternativ: `npx wrangler pages deploy dist --project-name=tr-dummy`.
