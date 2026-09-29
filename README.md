# ChartAI Insights

Crée une application web moderne appelée **ChartAI**, spécialisée dans l’analyse technique de graphiques de trading avec l’aide de l’intelligence artificielle.

IMPORTANT :
- Ce n’est pas une plateforme permettant de passer des ordres.
- L’application fournit uniquement une analyse éducative et informative de graphiques.
- Elle ne doit jamais présenter une analyse comme une certitude ou une garantie de gain.
- Ne pas utiliser de formulations comme « achète maintenant », « tu vas gagner » ou « trade garanti ».
- Présenter les scénarios comme des possibilités et expliquer clairement les risques.
- L’interface doit être entièrement en français.

## 1. DESIGN

Créer une interface premium, moderne et professionnelle inspirée des plateformes financières modernes.

Style :
- thème sombre par défaut
- fond noir / gris très foncé
- cartes légèrement contrastées
- accents verts et bleus utilisés avec modération
- typographie moderne et lisible
- animations légères et fluides
- interface responsive pour ordinateur, tablette et téléphone
- aucun élément inutile

Le résultat doit ressembler à une véritable startup fintech, pas à un simple site vitrine.

Nom :
**ChartAI**

Logo :
Créer un logo simple avec le texte « ChartAI » et un petit symbole représentant un graphique.

## 2. PAGE D’ACCUEIL

Créer une landing page avec :

Titre principal :

« Analyse tes graphiques avec l’IA »

Sous-titre :

« Importe une capture de ton graphique et obtiens une analyse technique structurée en quelques secondes. »

Bouton principal :
« Analyser un graphique »

Deuxième bouton :
« Découvrir ChartAI »

Ajouter une section expliquant le fonctionnement :

1. Importe ton graphique
2. L’IA analyse les éléments visibles
3. Consulte l’analyse détaillée

Ajouter une section présentant les fonctionnalités :

- Analyse de tendance
- Supports et résistances
- Structures de marché
- Indicateurs visibles
- Scénarios possibles
- Gestion du risque
- Historique des analyses

Ajouter une section « Important » expliquant que ChartAI ne fournit pas de garantie de résultat et que les marchés financiers comportent des risques.

## 3. PAGE D’ANALYSE

Créer une page principale appelée « Nouvelle analyse ».

Elle doit permettre à l’utilisateur d’importer une capture d’écran de graphique.

Zone d’upload :
- drag & drop
- bouton « Importer une image »
- formats JPG, JPEG, PNG et WEBP
- aperçu de l’image avant analyse
- possibilité de supprimer/remplacer l’image

Ajouter éventuellement des champs facultatifs :

Actif :
BTC/USDT, ETH/USDT, EUR/USD, AAPL, etc.

Timeframe :
1 min
5 min
15 min
1 h
4 h
1 jour
1 semaine

Marché :
Crypto
Forex
Actions
Indices
Autre

Bouton :
« Lancer l’analyse »

Pendant l’analyse, afficher une animation de chargement avec des étapes :

« Lecture du graphique »
« Détection de la structure »
« Analyse des indicateurs »
« Identification des niveaux »
« Génération du rapport »

## 4. ANALYSE IA

Après l'analyse, afficher les résultats dans une interface claire.

Créer les sections suivantes :

### Résumé

Afficher :
- Actif détecté ou renseigné
- Timeframe
- Type de marché
- Synthèse courte

### Tendance

Afficher :
- Tendance principale : haussière / baissière / neutre / indéterminée
- Structure du marché
- Explication

### Supports et résistances

Afficher les niveaux détectés par l'IA lorsqu'ils sont suffisamment visibles sur le graphique.

Pour chaque niveau :
- type
- niveau approximatif
- importance
- explication

### Indicateurs

Si des indicateurs sont visibles sur la capture :
- identifier leur nom lorsque possible
- relever leurs valeurs lorsque lisibles
- expliquer ce qu'ils indiquent

Si un indicateur n'est pas clairement identifiable, écrire :
« Indicateur non identifiable avec suffisamment de certitude ».

Ne jamais inventer une valeur qui n'est pas visible.

### Scénarios possibles

Présenter plusieurs scénarios lorsque les données permettent de le faire.

Exemple de structure :

Scénario haussier
- Conditions nécessaires
- Niveau d'invalidation
- Éléments qui soutiennent ce scénario

Scénario baissier
- Conditions nécessaires
- Niveau d'invalidation
- Éléments qui soutiennent ce scénario

Scénario neutre
- Conditions nécessaires
- Ce qui pourrait confirmer une sortie de range

Ne jamais présenter un scénario comme certain.

### Gestion du risque

Afficher des informations éducatives concernant :
- risque potentiel
- invalidation
- ratio risque/rendement lorsqu'il peut être calculé à partir des données fournies
- rappel de ne pas risquer une somme qu'on ne peut pas se permettre de perdre

Ne pas donner de conseil financier personnalisé.

## 5. NIVEAU DE CONFIANCE

Ajouter un indicateur appelé :

« Qualité de l'analyse »

avec :
- Faible
- Moyenne
- Élevée

Cette valeur doit représenter uniquement la qualité et la lisibilité des informations présentes dans la capture.

IMPORTANT :
Ne jamais utiliser ce niveau comme une « probabilité de gagner ».

## 6. IMAGE ORIGINALE

Afficher la capture originale à côté ou au-dessus de l'analyse.

Permettre à l'utilisateur de comparer facilement :
graphique original ↔ analyse.

## 7. HISTORIQUE

Créer une page « Mes analyses ».

Chaque analyse enregistrée doit afficher :
- date
- actif
- timeframe
- miniature du graphique
- résumé
- bouton « Voir l'analyse »

Permettre de supprimer une analyse.

## 8. COMPTE UTILISATEUR

Créer :
- inscription
- connexion
- déconnexion
- mot de passe oublié
- profil utilisateur

Utiliser Supabase pour l'authentification et la base de données.

Chaque utilisateur ne doit pouvoir accéder qu'à ses propres analyses.

## 9. BASE DE DONNÉES

Créer les tables nécessaires dans Supabase.

Table users/profiles :
- id
- email
- created_at

Table analyses :
- id
- user_id
- image_url
- asset
- timeframe
- market
- analysis_result
- created_at

Mettre en place les règles de sécurité nécessaires afin qu'un utilisateur ne puisse jamais consulter les analyses d'un autre utilisateur.

## 10. IA

Préparer l'application pour utiliser une API d'IA capable d'analyser des images.

L'IA doit recevoir :
- la capture du graphique
- les informations renseignées par l'utilisateur
- des instructions précises pour analyser uniquement les éléments réellement visibles

L'IA doit produire une réponse structurée contenant :

{
  "summary": "",
  "trend": "",
  "market_structure": "",
  "supports": [],
  "resistances": [],
  "indicators": [],
  "bullish_scenario": {},
  "bearish_scenario": {},
  "neutral_scenario": {},
  "risk_notes": "",
  "analysis_quality": ""
}

IMPORTANT :
- Ne jamais inventer une information absente de l'image.
- Lorsque l'image est trop floue ou incomplète, le signaler.
- Ne pas prétendre connaître les données futures du marché.
- Ne pas donner de garantie de rendement.
- Ne pas transformer automatiquement l'analyse en ordre d'achat ou de vente.

Préparer le code afin que la clé API soit stockée dans des variables d'environnement sécurisées et jamais dans le frontend.

## 11. GESTION DES ERREURS

Prévoir des messages clairs si :
- l'image est trop grande
- le format n'est pas accepté
- aucun graphique n'est détecté
- l'image est illisible
- l'API IA ne répond pas
- l'analyse échoue
- l'utilisateur n'est pas connecté

Exemple :
« Impossible d'analyser correctement cette image. Essayez avec une capture plus nette et montrant davantage le graphique. »

## 12. NAVIGATION

Header :

Logo ChartAI

- Accueil
- Nouvelle analyse
- Mes analyses
- Profil

Si l'utilisateur n'est pas connecté :
- Se connecter
- Créer un compte

Si l'utilisateur est connecté :
- Nouvelle analyse
- Mes analyses
- Profil
- Déconnexion

## 13. RESPONSIVE

L'application doit fonctionner correctement sur :
- Mac
- Windows
- iPhone
- Android
- tablette

Sur mobile, l'upload d'image doit être particulièrement simple afin que l'utilisateur puisse sélectionner directement une capture depuis sa galerie.

## 14. IMPORTANT POUR LA PREMIÈRE VERSION

Ne crée pas de fonctionnalités inutiles.

La priorité absolue est que ce parcours fonctionne :

Accueil
→ Créer un compte
→ Nouvelle analyse
→ Importer une capture
→ Envoyer à l'IA
→ Recevoir l'analyse
→ Enregistrer l'analyse
→ Retrouver l'analyse dans « Mes analyses »

Construis d'abord une V1 propre et fonctionnelle avant d'ajouter des fonctionnalités supplémentaires.

Utilise une architecture propre et facilement extensible.
Le code doit être organisé et maintenable.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f24ae19-a10f-4119-b573-ad91dff9a054).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
