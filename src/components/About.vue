<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card class="mx-auto pa-8 d-flex flex-column" elevation="4">
      <v-card-title class="text-center"> About </v-card-title>
      <v-card-subtitle class="text-center"
        >Informationen zu Umfang und Daten der Visualisierung</v-card-subtitle
      >

      <v-card-text class="text-left mx-auto" style="max-width: 80%">
        <p>
          Diese Anwendung visualisiert Daten verschiedener Quellen über
          <b>Personen und Orte</b> aus dem Kontext der
          <b>Herrnhuter Brüdergemeine</b> im 19. Jahrhundert. Sie entstand im
          Rahmen eines Praktikums als <b>Prototyp</b> auf Grundlage weniger,
          beispielhafter Daten. Es handelt sich also nicht um ein ausgereiftes
          Analysewerkzeug auf umfassender Datengrundlage. Das Ziel der
          Entwicklung war vielmehr, im Prozess Möglichkeiten und Grenzen der
          Visualisierung zu untersuchen und interaktives Anschauungsmaterial zu
          schaffen um Anforderungen an eine visuelle Forschungsumgebung für
          Herrnhuter Daten zukünftig besser formulieren zu können.
          <br />
          <br />
          Die Visualisierung basiert auf folgenden Quellen:
          Personenverzeichnisse aus den Nachrichten aus der Brüdergemeine, ... .
          <br />
          <br />
          Für die Anzahl der laut NBG-Verzeichnissen als Personal anwesenden
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
            nicht mit erfasst
          </li>
          <li>
            Eine Desambiguierung liegt nur für einen Teil der erfassten Personen
            in den Jahren ... vor. Für die meisten Jahre wurden Personen ohne
            Desambiguierung nach folgendem Schema erfasst: [Nachname]_[Initialen
            Vorname, falls vorhanden]_[XX für Schwester, XY für Bruder]
          </li>
        </ul>
        <br />
      </v-card-text>
      <v-card-actions class="mx-auto">
        <v-btn
          color="deep-purple-lighten-2"
          text="Link zum Github-Repo"
          border
          href="https://frnzw.github.com/nbg-vz"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
