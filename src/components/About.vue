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
          <li>
            Visualisiert werden nur die Daten derjenigen Stationen, für die eine
            Geokodierung vorhanden war – insgesamt x Stück:
            <ul>
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
          Für die Größe der Gemeindeorte laut ... wurden Daten mit folgenden
          Einschränkungen erfasst:
        </p>
        <ul style="margin-left: 20px">
          <li>
            Zeitraum 1822 - 1860 für die Missionsstation Genadendal in Südafrika
          </li>
          <li>
            Einzelnes Jahre 1860 und 1838 für alle Missionsgebiete, die in den
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
      <v-card-actions class="mx-auto flex-shrink-0">
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

<!-- 
<template>
  <v-container
    class="d-flex align-center justify-center fill-height pa-0"
    fluid
  >
    <v-card class="d-flex flex-column" style="max-height: 90vh" width="500">
      <v-card-title class="flex-shrink-0"> Überschrift </v-card-title>

      <v-card-text class="flex-grow-1 overflow-y-auto">
        <p>Langer Inhalt...</p>
        ,stationId,wdId,altName,region,lat,long,yFounded,yRenewed
        1,Elim,Q1003342,,Südafrika,-34.59166666666667,19.758333333333333,1736,1790
        2,Enon,Q5379390,,Südafrika,-33.39805555555556,25.545,1736,1791
        3,Genadendal,Q1501295,Gnadenthal,Südafrika,-34.03333333333333,19.55,1736,1792
        5,Mamre,Q11142530,Grönekloof,Südafrika,-33.51669444444445,18.466694444444443,1736,1794
        8,Neuherrnhut_GRL,Q1996491,Neuherrnhut,Grönland,64.18061111111112,-51.74169444444445,1733,
        9,Lichtenfels,Q423740,Lichtenfels,Grönland,63.06083333333333,-50.74166666666667,1733,
        10,Lichtenau,Q1016295,Lichtenau,Grönland,60.5075,-45.53777777777778,1733,
        11,Friedrichsthal,Q663788,Friedrichsthal,Grönland,60.005,-44.665277777777774,1733,
        12,Nain,Q3335210,Nain,Labrador,56.55,-61.68333333333333,1770,
        13,Hoffenthal,Q11338369,Hoffenthal,Labrador,55.46666666666667,-60.21666666666667,1770,
        14,Okak,Q7081733,Okak,Labrador,57.56433333333333,-61.98302777777778,1770,
        15,Hebron,Q5695991,Hebron,Labrador,58.2,-62.626111111111115,1770,
        21,Neuherrnhut_ST,Q1979071,"Neuherrnhut, St.
        Thomas",Dänisch-Westindien,18.36577777777778,-64.99052777777779,1732,
        23,Friedensthal_SC,Q30624659,"Friedensthal, St.
        Croix",Dänisch-Westindien,17.74138888888889,-64.71194444444444,1732,
        25,Friedensfeld_SC,Q5503660,"Friedensfeld, St.
        Croix",Dänisch-Westindien,17.746111111111112,-64.78055555555555,1732,
        27,Emmaus_SJ,Q5373393,"Emmaus, St.
        John",Dänisch-Westindien,18.348055555555554,-64.71777777777778,1732,
        53,Paramaribo,Q3001,Paramaribo,Suriname,5.852222222222222,-55.20388888888889,1735,
        54,PlantageCH,Q59115570,Plantage
        Charlottenburg,Suriname,5.874761111111112,-54.7823,1735,
        ,stationId,wdId,altName,region,lat,long,yFounded,yRenewed
        1,Elim,Q1003342,,Südafrika,-34.59166666666667,19.758333333333333,1736,1790
        2,Enon,Q5379390,,Südafrika,-33.39805555555556,25.545,1736,1791
        3,Genadendal,Q1501295,Gnadenthal,Südafrika,-34.03333333333333,19.55,1736,1792
        5,Mamre,Q11142530,Grönekloof,Südafrika,-33.51669444444445,18.466694444444443,1736,1794
        8,Neuherrnhut_GRL,Q1996491,Neuherrnhut,Grönland,64.18061111111112,-51.74169444444445,1733,
        9,Lichtenfels,Q423740,Lichtenfels,Grönland,63.06083333333333,-50.74166666666667,1733,
        10,Lichtenau,Q1016295,Lichtenau,Grönland,60.5075,-45.53777777777778,1733,
        11,Friedrichsthal,Q663788,Friedrichsthal,Grönland,60.005,-44.665277777777774,1733,
        12,Nain,Q3335210,Nain,Labrador,56.55,-61.68333333333333,1770,
        13,Hoffenthal,Q11338369,Hoffenthal,Labrador,55.46666666666667,-60.21666666666667,1770,
        14,Okak,Q7081733,Okak,Labrador,57.56433333333333,-61.98302777777778,1770,
        15,Hebron,Q5695991,Hebron,Labrador,58.2,-62.626111111111115,1770,
        21,Neuherrnhut_ST,Q1979071,"Neuherrnhut, St.
        Thomas",Dänisch-Westindien,18.36577777777778,-64.99052777777779,1732,
        23,Friedensthal_SC,Q30624659,"Friedensthal, St.
        Croix",Dänisch-Westindien,17.74138888888889,-64.71194444444444,1732,
        25,Friedensfeld_SC,Q5503660,"Friedensfeld, St.
        Croix",Dänisch-Westindien,17.746111111111112,-64.78055555555555,1732,
        27,Emmaus_SJ,Q5373393,"Emmaus, St.
        John",Dänisch-Westindien,18.348055555555554,-64.71777777777778,1732,
        53,Paramaribo,Q3001,Paramaribo,Suriname,5.852222222222222,-55.20388888888889,1735,
        54,PlantageCH,Q59115570,Plantage
        Charlottenburg,Suriname,5.874761111111112,-54.7823,1735,
      </v-card-text>

      <v-card-actions class="flex-shrink-0">
        <v-btn>Aktion</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template> -->
