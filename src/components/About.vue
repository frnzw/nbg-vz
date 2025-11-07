<template>
  <v-container class="d-flex align-center justify-center fill-height pa-0">
    <v-card
      class="d-flex flex-column"
      style="max-height: 90vh; max-width: 70vw"
      elevation="4"
    >
      <v-card-title class="text-center flex-grow-1"> About </v-card-title>
      <v-card-subtitle class="text-center flex-grow-1"
        >Informationen zu Umfang und Daten der Visualisierung</v-card-subtitle
      >

      <v-card-text
        class="flex-grow-1 overflow-y-auto mx-auto"
        style="max-width: 70%"
      >
        <p>
          Diese Anwendung visualisiert Daten verschiedener Quellen über
          <b>Personen und Orte</b> aus dem Kontext der
          <b>Herrnhuter Brüdergemeine</b> im 19. Jahrhundert. Sie entstand im
          Rahmen eines Praktikums von Franz Wendt (Student M. Sc. Digital
          Humanities, Universität Leipzig) am TextLab der SLUB in Dresden.
          <br />
          <br />
          Die Anwendung ist ein <b>Prototyp</b> auf Grundlage
          <b>weniger, beispielhafter Daten</b>, kein ausgereiftes
          Analysewerkzeug auf umfassender Datengrundlage. Das Ziel der
          Entwicklung war vielmehr, im Prozess Möglichkeiten und Grenzen der
          Visualisierung zu untersuchen und interaktives Anschauungsmaterial zu
          schaffen um Anforderungen an eine visuelle Forschungsumgebung für
          Herrnhuter Daten zukünftig besser formulieren zu können.
          <br />
          <br />
          Die Visualisierung basiert auf folgenden <b>Quellen</b>:
          <br />
          <br />
        </p>
        <ul style="margin-left: 20px">
          <li>
            <b>Aufenthaltsorte:</b> ausgewählte Personenverzeichnisse aus den
            Nachrichten aus der Brüdergemeine
          </li>
          <li>
            <b>Metadaten Personen:</b> Personenregister von südafrikanischen
            Missionen ("Die in Afrika tätigen Geschwister, 1737-1962".
            Zusammengestellt aus dem Unitätsarchiv der Brüdergemeine Herrnhut
            von ... )
          </li>
          <li><b>Metadaten Orte:</b> Missionsatlanten der Brüdergemeine</li>
          <li>
            Ergänzungen der o.g. Quellen durch Recherchearbeit innerhalb des MKN
          </li>
        </ul>
        <br />
        <br />
        <p>
          Für die
          <b>Anzahl der laut NBG-Verzeichnissen als Personal anwesenden</b>
          Personen wurde ein Testdatensatz mit folgenden Einschränkungen von
          Hand erfasst:
          <br />
          <br />
        </p>
        <ul style="margin-left: 20px">
          <li>
            Zeitraum 1828 - 1843 für das Missionsgebiet Südafrika (es fehlen
            Daten für 1832 und 1833)
          </li>
          <li>
            Einzelne Jahre 1828 und 1838 für alle Missionsgebiete, die in den
            jeweiligen Verzeichnissen gelistet sind
          </li>
          <li>
            In der Anreise befindliche und außerordentlich abwesende Personen
            mit expliziten Angaben wie "auf Besuch in ..." im Verzeichnis wurden
            nicht mit erfasst.
          </li>
          <li>
            Eine Desambiguierung liegt nur für einen Teil der erfassten Personen
            (Genadendal 1839, Südafrika 1843) vor. Für die meisten Jahre wurden
            Personen ohne Desambiguierung nach folgendem Schema erfasst:
            [Nachname]_[Initialen Vorname, falls vorhanden]_[XX für Schwester,
            XY für Bruder]
          </li>
          <li>
            Visualisiert werden nur die Daten derjenigen Stationen, für die eine
            Geokodierung vorhanden war – insgesamt 17 Stück:
            <ul style="margin-left: 40px">
              <li>Missionsgebiet Südafrika: Elim, Enon, Genadendal, Mamre</li>
              <li>
                Missionsgebiet Grönland: Neuherrnhut, Lichtenfels, Lichtenau,
                Friedrichsthal
              </li>
              <li>Missionsgebiet Labrador: Nain, Okak, Hebron</li>
              <li>
                Missionsgebiet Dänisch-Westindien (Karibik): Neuherrnhut (St.
                Croix), Friedensthal (St. Croix), Friedensfeld (St. Croix),
                Emmaus (St. John)
              </li>
              <li>
                Missionsgebiet Suriname: Paramaribo, Plantage Charlottenburg
              </li>
            </ul>
          </li>
        </ul>
        <br />
        <p>
          Für die <b>Größe der Gemeindeorte</b> wurde auf Daten aus den
          Missionsatlanten der Brüdergemeine mit folgenden Einschränkungen
          zurückgegriffen:
        </p>
        <br />
        <br />
        <ul style="margin-left: 20px">
          <li>
            Zeitraum 1822 - 1860 für die Missionsstation Genadendal in Südafrika
          </li>
          <li>
            Einzelnes Jahr 1860 für alle Missionsstationen, die in den
            ausgewählten Verzeichnissen gelistet sind und für die Geokoordinaten
            vorliegen
          </li>
        </ul>
        <br />
      </v-card-text>
      <v-card-actions class="mx-auto flex-shrink-0">
        <v-btn
          color="deep-purple-lighten-2"
          text="Link zum Github-Repo"
          border
          href="https://github.com/frnzw/nbg-vz"
          target="_blank"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
