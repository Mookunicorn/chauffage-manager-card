# Chauffage Manager Card

Carte Lovelace pour l'intégration [Chauffage Manager](https://github.com/Mookunicorn/ha-chauffage-manager) : pièces, plannings, absence et configuration des chauffages.

[![Ouvrir dans HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Mookunicorn&repository=chauffage-manager-card&category=plugin)

## Installation via HACS
1. Installer d'abord l'intégration **Chauffage Manager**.
2. HACS → menu ⋮ → **Dépôts personnalisés** → `https://github.com/Mookunicorn/chauffage-manager-card`, catégorie **Tableau de bord**.
3. Télécharger **Chauffage Manager Card** (la ressource est ajoutée automatiquement), puis recharger la page sans cache.

## Utilisation
```yaml
type: custom:chauffage-manager-card
title: Chauffage                            # optionnel
tabs: [rooms, schedules, absence, config]   # optionnel, ex. [rooms] pour une carte « pièces » seule
group_by_floor: true                        # optionnel : sépare les pièces par étage
```
Les onglets Plannings (édition), Absence (enregistrement) et Configuration sont réservés aux administrateurs.

## Tri par étage (optionnel)
Chaque chauffage ou groupe a un champ **Étage** (Configuration). Les étages définis dans Home Assistant sont proposés dans la liste, et vous pouvez en saisir un autre. Avec `group_by_floor: true`, l'onglet Pièces affiche un séparateur par étage (ordre des niveaux Home Assistant), puis « Sans étage ». Sans cette option, la liste reste inchangée.
