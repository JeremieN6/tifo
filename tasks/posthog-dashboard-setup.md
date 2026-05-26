# PostHog Dashboard Setup (Tifo)

Ce document donne un setup prêt à configurer dans PostHog avec les événements déjà instrumentés dans le projet.

## 1) Dashboard Acquisition

Nom suggéré: `Tifo - Acquisition`

Cartes à créer:

1. `Signups réussis / jour`
- Type: Trends
- Event: `signup_succeeded`
- Breakdown: none
- Interval: day

2. `Échecs signup / jour`
- Type: Trends
- Event: `signup_failed`
- Breakdown: `reason`

3. `Logins réussis / jour`
- Type: Trends
- Event: `login_succeeded`
- Interval: day

4. `Funnel onboarding`
- Type: Funnel
- Steps:
  - `signup_succeeded`
  - `login_succeeded`
  - `poster_generation_requested`
- Conversion window: 7 days

## 2) Dashboard Activation Produit

Nom suggéré: `Tifo - Activation`

Cartes à créer:

1. `Funnel génération`
- Type: Funnel
- Steps:
  - `poster_generation_requested`
  - `poster_generation_succeeded`
  - `poster_downloaded`
- Conversion window: 24 hours
- Breakdown: `plan`

2. `Taux d'échec génération`
- Type: Insight (Formula)
- Numérateur: count(`poster_generation_failed`)
- Dénominateur: count(`poster_generation_requested`)
- Affichage: pourcentage
- Breakdown: `reason`

3. `Usage des formats`
- Type: Trends
- Event: `poster_generation_requested`
- Breakdown: `output_format`

4. `Poids des annonces vs match`
- Type: Trends
- Event: `poster_generation_requested`
- Breakdown: `poster_type`

## 3) Dashboard Revenue & Billing

Nom suggéré: `Tifo - Revenue`

Cartes à créer:

1. `Funnel achat`
- Type: Funnel
- Steps:
  - `checkout_started`
  - `checkout_success_page_viewed`
  - `subscription_activated`
- Conversion window: 3 days
- Breakdown: `plan`

2. `Échecs checkout`
- Type: Trends
- Event: `checkout_failed`
- Breakdown: `plan`

3. `Activations abonnement`
- Type: Trends
- Event: `subscription_activated`
- Breakdown: `plan`

4. `Montant total activé`
- Type: Trends (sum)
- Event: `subscription_activated`
- Property: `amount`
- Aggregation: sum

## 4) Cohortes recommandées

Créer ces cohortes:

1. `Nouveaux inscrits 7j`
- Condition: did `signup_succeeded` in the last 7 days

2. `Activateurs`
- Condition: did `poster_generation_succeeded` at least 1 time

3. `Payants Pro`
- Condition: did `subscription_activated` where `plan = pro`

4. `Payants Club`
- Condition: did `subscription_activated` where `plan = club`

## 5) Alertes recommandées

Configurer des alertes PostHog sur:

1. `Drop activation`
- Trigger: conversion `poster_generation_requested -> poster_generation_succeeded` baisse > 25% sur 24h

2. `Spike erreurs génération`
- Trigger: `poster_generation_failed` augmente > 40% sur 24h

3. `Drop checkout`
- Trigger: conversion `checkout_started -> subscription_activated` baisse > 20% sur 24h

## 6) Règles décisionnelles simples

1. Si `poster_generation_failed / requested > 15%` pendant 3 jours:
- Priorité à la fiabilité API (quota, prompt, upload image, erreurs réseau)

2. Si conversion `checkout_started -> subscription_activated < 35%`:
- Revoir pricing page, wording bénéfices, friction redirection Stripe

3. Si `starter` domine les requêtes mais peu de checkouts:
- Tester une offre d'entrée et améliorer CTA upgrade dans dashboard/create

## 7) Convention de période

Pour comparer proprement:

1. Vue opérationnelle: `Last 24 hours`
2. Vue pilotage: `Last 7 days`
3. Vue stratégie: `Last 28 days`
