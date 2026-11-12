# Chauffage Manager Card

Carte Lovelace pour l'intégration [Chauffage Manager](https://github.com/Mookunicorn/ha-chauffage-manager) : pièces, plannings, absence, ouvertures et configuration des chauffages.

[![Ouvrir dans HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Mookunicorn&repository=chauffage-manager-card&category=plugin)

## Installation via HACS
1. Installer d'abord l'intégration **Chauffage Manager**.
2. HACS → menu ⋮ → **Dépôts personnalisés** → `https://github.com/Mookunicorn/chauffage-manager-card`, catégorie **Tableau de bord**.
3. Télécharger **Chauffage Manager Card** (la ressource est ajoutée automatiquement), puis recharger la page sans cache.

## Configuration de la carte
Mode édition → **Ajouter une carte** → **Chauffage Manager** : un formulaire propose toutes les options, sans YAML :

| Option | Effet | Défaut |
|---|---|---|
| `title` | Titre de la carte | aucun |
| `tabs` | Onglets affichés (`rooms`, `schedules`, `absence`, `config`) | tous |
| `default_tab` | Onglet ouvert au chargement | premier onglet |
| `group_by_floor` | Séparateurs par étage | non |
| `show_power` | Affiche la puissance (W) | oui |
| `show_temperature` | Affiche la température mesurée | oui |
| `show_mode` | Affiche le badge de mode | oui |
| `show_all_off` | Bouton « Tout éteindre » | oui |
| `heating_color` | Couleur de l'icône quand ça chauffe (couleur du thème, ex. `orange`) | couleur de chauffe du thème |
| `temp_step` | Pas du réglage de température (0.5 ou 1) | 0.5 |

Le YAML reste possible :
```yaml
type: custom:chauffage-manager-card
title: Chauffage
tabs: [rooms]
show_power: false
heating_color: deep-orange
```
Les onglets Plannings (édition), Absence (enregistrement) et Configuration sont réservés aux administrateurs.

## Températures des modes (thermostats)
Onglet Configuration → **Températures des modes** : une température par mode, utilisée pour les thermostats (`climate`) dans les plannings, le mode absence, les ouvertures et les boutons de mode.

| Mode | Défaut |
|---|---|
| Confort | 19 °C |
| Confort -1 | 18 °C |
| Confort -2 | 17 °C |
| Éco | 15,5 °C |
| Hors-gel | 7 °C |

« Off » n'a pas de température : il éteint le thermostat. Les créneaux de planning n'ont plus de champ température : ils suivent le mode. Dans l'onglet Pièces, un thermostat affiche sa consigne dans le badge (la couleur suit le mode correspondant) et garde le bouton Off et le réglage − / + (qui fixe une consigne libre).

## Tri par étage (optionnel)
Chaque chauffage ou groupe a un champ **Étage** (Configuration). Les étages définis dans Home Assistant sont proposés dans la liste, et vous pouvez en saisir un autre. Avec `group_by_floor: true`, l'onglet Pièces affiche un séparateur par étage (ordre des niveaux Home Assistant), puis « Sans étage ». Sans cette option, la liste reste inchangée.

## Jours fériés dans les plannings
1. Ajoutez dans Home Assistant l'intégration **Jours fériés** (Holiday) pour votre pays : elle crée un calendrier.
2. Onglet Configuration → **Jours fériés** : choisissez ce calendrier.
3. Dans un planning, la section **Jours fériés** accepte des créneaux avec les jours L M M J V S D : un jour férié qui tombe un mercredi utilise les créneaux fériés du mercredi. S'il n'y en a pas pour ce jour de la semaine, le planning normal s'applique.

Les plannings qui ont des créneaux fériés affichent une ligne **F** sous les jours L à D (dans l'éditeur et dans la liste). Elle montre les créneaux fériés du premier jour de la semaine concerné ; survolez-la pour voir lequel. Un bandeau « Jour férié aujourd'hui » apparaît dans l'onglet Pièces.

## Ouvertures (pause des chauffages)
Dans chaque chauffage ou groupe, le champ **Ouvertures** accepte des capteurs `binary_sensor` (fenêtres, portes). Dans l'onglet Configuration, la section **Ouvertures** règle le délai avant la pause, le délai avant la reprise et le mode appliqué pendant l'ouverture. À la fermeture, le chauffage retrouve sa consigne (ou son planning en mode Auto). Une commande manuelle pendant la pause l'annule jusqu'à la prochaine fermeture. Pour un chauffage dans un groupe, ce sont les ouvertures du groupe qui comptent.

Le badge de la pièce suit les étapes, avec un contour et un fond teinté :
- **Pause dans 1:30** (orange, qui pulse) : l'ouverture est ouverte, le délai avant la pause court ;
- **En pause (ouverture)** (orange, plein) : le chauffage est en pause ;
- **Reprise dans 0:45** (couleur principale du thème, qui pulse) : l'ouverture est fermée, le délai avant la reprise court.

## Chauffe en cours (capteur de puissance)
Chaque chauffage a un champ optionnel **Capteur de puissance** (par exemple la consommation de la prise ou du module Zigbee) et un **seuil de chauffe** en watts (10 W par défaut), réglables indépendamment. Au-dessus du seuil, l'icône de la pièce passe en orange ; la puissance est affichée à côté du nom (somme des membres pour un groupe). Sans capteur, un thermostat `climate` utilise son attribut `hvac_action`. Un capteur indisponible laisse l'icône neutre.
