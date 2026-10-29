# Rivet · gestion d'interventions pour artisans et techniciens

Rivet planifie et suit les interventions des métiers du dépannage à domicile : plomberie, électricité, chauffage et climatisation, serrurerie, vitrerie, électroménager.

- **Bureau** : tableaux personnalisables (colonnes, groupes, éléments et sous-éléments), vues Tableau, Kanban et Calendrier.
- **Terrain** : la vue « Ma journée » donne à chaque technicien ses passages du jour, triés par heure, avec itinéraire, appel du client et avancement en un geste (En route → Sur place → Terminée).
- **Multi-entreprise** : un seul compte peut appartenir à plusieurs instances de travail. On choisit l'instance au moment de se connecter, et on bascule de l'une à l'autre sans se reconnecter.
- **Administration** : invitations par e-mail, rôles, droits individuels par espace et par tableau (aucun accès, lecture, édition).
- **Temps réel** : une mise à jour faite par un technicien apparaît chez les autres sans recharger la page.

Site 100 % statique (HTML, CSS, JavaScript) hébergé sur GitHub Pages. Les données et les comptes sont gérés par Supabase.

---

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique de l'application |
| `styles.css` | Styles (thème clair et sombre automatique) |
| `app.js` | Interface : connexion, tableaux, Ma journée, fiches, administration |
| `api.js` | Accès aux données Supabase |
| `config.js` | **À remplir** : URL du projet Supabase et clé publique |
| `schema.sql` | **À exécuter une fois** dans Supabase : tables, sécurité, temps réel |
| `email-invitation.html` | Modèle d'e-mail d'invitation à coller dans Supabase |
| `email-confirmation.html` | Modèle d'e-mail de confirmation de compte |

---

## Mise en ligne (environ 20 minutes)

### 1. Créer la base Supabase

1. Crée un compte sur [supabase.com](https://supabase.com), puis **New project** (région conseillée : Europe, Paris ou Francfort).
2. Ouvre **SQL Editor → New query**, colle tout le contenu de `schema.sql`, clique **Run**. Le message attendu est « Success. No rows returned ».

### 2. Mettre le site sur GitHub

1. Sur GitHub : **New repository**, nomme-le par exemple `rivet`, coche **Public**, puis **Create repository**.
2. Clique **uploading an existing file** (ou **Add file → Upload files**), glisse **tous les fichiers** de ce dossier, puis **Commit changes**.
3. **Settings → Pages** : dans *Build and deployment*, choisis **Deploy from a branch**, branche **main**, dossier **/ (root)**, puis **Save**.
4. Après une à deux minutes, l'adresse du site s'affiche, par exemple `https://ton-pseudo.github.io/rivet/`. Note-la.

### 3. Relier le site à Supabase

1. Dans Supabase : **Project Settings → API** (ou **Data API / API Keys**). Copie l'**URL du projet** et la clé **anon** (appelée aussi *publishable*).
2. Sur GitHub, ouvre `config.js`, clique sur le crayon ✎, remplace les deux valeurs, puis **Commit changes**.

> La clé `anon` est faite pour être publique : la sécurité repose sur les règles RLS de `schema.sql`. Ne mets **jamais** la clé `service_role` / `secret` dans ce fichier.

### 4. Régler l'authentification dans Supabase

1. **Authentication → URL Configuration**
   - *Site URL* : l'adresse GitHub Pages, par exemple `https://ton-pseudo.github.io/rivet/`
   - *Redirect URLs* : ajoute `https://ton-pseudo.github.io/rivet/**`
2. **Authentication → Emails → Templates**
   - *Magic Link* : sujet « Vous êtes invité sur Rivet », corps = contenu de `email-invitation.html`
   - *Confirm signup* : sujet « Activez votre compte Rivet », corps = contenu de `email-confirmation.html`
3. **Authentication → Sign In / Providers → Email** : laisse *Confirm email* activé en production. Pour tester vite, tu peux le désactiver : l'inscription ouvre alors l'instance immédiatement.

### 5. Configurer l'envoi d'e-mails (indispensable pour les invitations)

L'envoi d'e-mails intégré à Supabase est prévu pour les tests : à ma connaissance, il est limité à quelques e-mails par heure et n'écrit qu'aux adresses des membres de ton équipe Supabase. Pour inviter de vraies personnes :

1. Crée un compte gratuit chez un service d'envoi, par exemple Resend ou Brevo, et récupère ses identifiants SMTP.
2. Supabase : **Authentication → Emails → SMTP Settings → Enable custom SMTP**, puis colle l'hôte, le port, l'utilisateur et le mot de passe.

En attendant, chaque invitation propose **Copier le lien** dans *Paramètres → Équipe* : tu peux l'envoyer toi-même par SMS ou messagerie.

### 6. Tester

1. Ouvre le site, clique **Créer mon entreprise** et remplis le formulaire. Une instance est créée avec un premier tableau « Dépannages » et trois interventions d'exemple.
2. Dans **Paramètres → Équipe**, invite une deuxième adresse e-mail.
3. Ouvre le lien d'invitation dans une fenêtre privée, crée le compte, puis donne-lui des accès dans **Paramètres → Accès**.

---

## Parcours de connexion

| Situation | Ce qui se passe |
|---|---|
| Connexion | 1. Saisie de l'instance (`rivet / plomberie-durand`) → 2. e-mail et mot de passe. Un compte qui n'appartient pas à cette instance est refusé. |
| Création de compte | Le compte et son instance sont créés ensemble. Le créateur en devient propriétaire. |
| Invitation d'une personne sans compte | Elle reçoit un e-mail, clique, choisit son nom et son mot de passe : son compte est créé et rattaché à l'instance. |
| Invitation d'une personne qui a déjà un compte | Le lien ajoute l'instance à son compte. L'invitation apparaît aussi dans le sélecteur d'instances en haut à gauche. |
| Plusieurs entreprises | Le sélecteur en haut à gauche liste toutes les instances du compte et permet d'en créer une nouvelle. |
| Lien de connexion direct | *Paramètres → Instance → Copier le lien de connexion* : l'instance est pré-remplie. |

## Sécurité

- Toutes les règles d'accès sont appliquées **par la base de données** (Row Level Security), pas par le navigateur. Un utilisateur ne peut lire que les instances dont il est membre, et que les tableaux qui lui sont ouverts.
- Les colonnes sensibles (instance d'un tableau, numéro d'intervention, auteur d'une note) sont fixées par la base au moment de l'écriture.
- Le propriétaire d'une instance ne peut être ni rétrogradé ni retiré.
- L'identifiant d'une instance ne peut plus être modifié après sa création.

## Limites connues

- Une instance charge au plus 1 000 éléments à l'ouverture (limite par défaut de Supabase). C'est largement suffisant pour une démonstration ; au-delà, il faudra paginer par tableau.
- Les changements de droits d'accès s'appliquent chez la personne concernée à son prochain chargement de page.
- Pas de mode hors-ligne : la vue terrain nécessite une connexion réseau.
