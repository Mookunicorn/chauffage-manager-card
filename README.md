# Chauffage Manager Card

Carte Lovelace pour l'intégration [Chauffage Manager](https://github.com/Mookunicorn/ha-chauffage-manager) : pièces, plannings, absence, ouvertures et configuration des chauffages.

[![Ouvrir dans HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Mookunicorn&repository=chauffage-manager-card&category=plugin)

## Installation via HACS
1. Installer d'abord l'intégration **Chauffage Manager**.
2. HACS → menu ⋮ → **Dépôts personnalisés** → `https://github.com/Mookunicorn/chauffage-manager-card`, catégorie **Tableau de bord**.
3. Télécharger **Chauffage Manager Card** (la ressource est ajoutée automatiquement), puis recharger la page sans cache.

## Ajout à un tableau de bord
Mode édition → **Ajouter une carte** → **Chauffage Manager** : un formulaire permet de régler le titre, les onglets affichés et le tri par étage. Le YAML reste possible :
```yaml
type: custom:chauffage-manager-card
title: Chauffage                            # optionnel
tabs: [rooms, schedules, absence, config]   # optionnel, ex. [rooms] pour une carte « pièces » seule
group_by_floor: true                        # optionnel : sépare les pièces par étage
```
Les onglets Plannings (édition), Absence (enregistrement) et Configuration sont réservés aux administrateurs.

## Tri par étage (optionnel)
Chaque chauffage ou groupe a un champ **Étage** (Configuration). Les étages définis dans Home Assistant sont proposés dans la liste, et vous pouvez en saisir un autre. Avec `group_by_floor: true`, l'onglet Pièces affiche un séparateur par étage (ordre des niveaux Home Assistant), puis « Sans étage ». Sans cette option, la liste reste inchangée.

## Ouvertures (pause des chauffages)
Dans chaque chauffage ou groupe, le champ **Ouvertures** accepte des capteurs `binary_sensor` (fenêtres, portes). Dans l'onglet Configuration, la section **Ouvertures** règle le délai avant la pause, le délai avant la reprise et le mode appliqué pendant l'ouverture. À la fermeture, le chauffage retrouve sa consigne (ou son planning en mode Auto). Une commande manuelle pendant la pause l'annule jusqu'à la prochaine fermeture. Pour un chauffage dans un groupe, ce sont les ouvertures du groupe qui comptent.

## Chauffe en cours (capteur de puissance)
Chaque chauffage a un champ optionnel **Capteur de puissance** (par exemple la consommation de la prise ou du module Zigbee) et un **seuil de chauffe** en watts (10 W par défaut), réglables indépendamment. Au-dessus du seuil, l'icône de la pièce passe en orange ; la puissance est affichée à côté du nom (somme des membres pour un groupe). Sans capteur, un thermostat `climate` utilise son attribut `hvac_action`. Un capteur indisponible laisse l'icône neutre.
