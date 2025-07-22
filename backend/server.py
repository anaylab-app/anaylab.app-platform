from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import os
import uuid
from datetime import datetime
from pymongo import MongoClient
import asyncio

# Stripe integration
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.anaylab_builder

# Stripe setup
STRIPE_API_KEY = "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"

# Fixed pricing packages (security: never accept amounts from frontend)
PACKAGES = {
    "starter": {"name": "Starter", "amount": 20.0, "currency": "eur", "modules": 6},
    "premium": {"name": "Premium", "amount": 49.0, "currency": "eur", "modules": 11},
    "dsa_express": {"name": "DSA Express", "amount": 99.0, "currency": "eur", "modules": 19}
}

# Pydantic models
class UserForm(BaseModel):
    prenom: str
    email: str
    competences: str
    passion: str
    temps_semaine: str
    revenu_vise: str
    niveau_experience: str
    version_choisie: str

class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str
    user_form: UserForm

class PaymentTransaction(BaseModel):
    id: str
    session_id: str
    package_id: str
    amount: float
    currency: str
    user_email: str
    user_form: Dict
    payment_status: str
    created_at: datetime
    updated_at: datetime

# Content generation functions
def generate_starter_modules(user_form: UserForm) -> List[Dict]:
    """Generate 6 starter modules based on user input"""
    modules = [
        {
            "id": "business_idea",
            "title": "💡 Idée de Business",
            "content": f"Basé sur tes compétences en {user_form.competences} et ta passion pour {user_form.passion}, voici ton idée de business personnalisée:\n\n**Concept Principal:** Créer une activité de {user_form.competences.lower()} ciblant les personnes intéressées par {user_form.passion.lower()}.\n\n**Pourquoi ça marche:** Tu combines tes forces naturelles avec un sujet qui te passionne, garantissant motivation et expertise.\n\n**Première étape:** Identifie 3 problèmes spécifiques que ton audience rencontre dans le domaine de {user_form.passion.lower()}."
        },
        {
            "id": "brand_name",
            "title": "🏷️ Nom de Marque", 
            "content": f"**Ton nom de marque suggéré:** {user_form.prenom} {user_form.competences.split()[0] if user_form.competences else 'Expert'}\n\n**Alternatives créatives:**\n- {user_form.passion.split()[0] if user_form.passion else 'Success'}Lab by {user_form.prenom}\n- {user_form.prenom} {user_form.competences.split()[0] if user_form.competences else 'Pro'} Academy\n- The {user_form.passion.split()[0] if user_form.passion else 'Smart'} Method\n\n**Conseil:** Choisis un nom simple, mémorable et qui reflète ton expertise unique."
        },
        {
            "id": "clear_offer",
            "title": "🎯 Offre Claire",
            "content": f"**Ton offre principale:**\n'J'aide les gens à {user_form.passion.lower()} grâce à mes compétences en {user_form.competences.lower()}'\n\n**Format détaillé:**\n- **Public cible:** Personnes qui veulent progresser en {user_form.passion.lower()}\n- **Problème résolu:** Manque de guidance pratique et expertise\n- **Solution unique:** Méthode personnalisée basée sur {user_form.competences}\n- **Résultat promis:** Maîtrise concrète en {user_form.temps_semaine}\n\n**Prix suggéré:** Entre 47€ et 97€ pour commencer"
        },
        {
            "id": "mini_funnel",
            "title": "🔄 Mini Tunnel de Vente",
            "content": f"**Étape 1 - Accroche (Post gratuit):**\n'Comment j'ai transformé ma passion pour {user_form.passion.lower()} en expertise {user_form.competences.lower()}'\n\n**Étape 2 - Valeur gratuite:**\n'3 erreurs à éviter quand on débute en {user_form.passion.lower()}'\n\n**Étape 3 - Témoignage personnel:**\nRaconte ton parcours en {user_form.competences}\n\n**Étape 4 - Offre:**\n'Méthode complète: Maîtrise {user_form.passion.lower()} en {user_form.temps_semaine} (même en partant de zéro)'"
        },
        {
            "id": "action_plan",
            "title": "📋 Plan d'Action Simple",
            "content": f"**Semaine 1:** Création de contenu\n- 3 posts sur ton expertise {user_form.competences}\n- 1 story par jour montrant ton quotidien\n\n**Semaine 2:** Engagement\n- Répondre à tous les commentaires\n- Commenter 10 comptes de ta niche {user_form.passion}\n\n**Semaine 3:** Première offre\n- Lancer ton mini-service à 47€\n- Viser {user_form.revenu_vise} avec 10-15 ventes\n\n**Semaine 4:** Optimisation\n- Analyser les retours clients\n- Préparer l'offre premium\n\n**Temps requis:** {user_form.temps_semaine} répartis intelligemment"
        },
        {
            "id": "pitch_post",
            "title": "🎤 Pitch à Poster",
            "content": f"**Post prêt à copier-coller:**\n\n🎯 NOUVELLE MÉTHODE 2025\n\nSalut, je suis {user_form.prenom} !\n\nGrâce à mes {user_form.competences.lower()}, j'aide les gens passionnés par {user_form.passion.lower()} à passer au niveau supérieur.\n\n❌ Plus besoin de formations à 500€\n❌ Plus de théorie sans pratique\n❌ Plus de perte de temps\n\n✅ Méthode personnalisée\n✅ Résultats en {user_form.temps_semaine}\n✅ Accompagnement direct\n\nObjectif: {user_form.revenu_vise} par mois\nNiveau requis: {user_form.niveau_experience}\n\n📩 MP pour en savoir plus !\n\n#entrepreneur #business #{user_form.passion.lower().replace(' ', '')} #{user_form.competences.lower().replace(' ', '')}"
        }
    ]
    return modules

def generate_premium_modules(user_form: UserForm) -> List[Dict]:
    """Generate 11 premium modules (starter + 5 more)"""
    modules = generate_starter_modules(user_form)
    
    premium_extras = [
        {
            "id": "complete_funnel",
            "title": "🚀 Tunnel Complet",
            "content": f"**Page 1 - Accroche:** 'La méthode {user_form.prenom} pour {user_form.passion}'\n\n**Page 2 - Problème:** 'Pourquoi 95% échouent en {user_form.passion.lower()}'\n\n**Page 3 - Solution:** 'Ma méthode {user_form.competences} qui change tout'\n\n**Page 4 - Preuves:** Tes résultats et témoignages\n\n**Page 5 - Offre:** Formation complète {user_form.revenu_vise}/mois\n\n**Page 6 - Urgence:** 'Places limitées - {user_form.temps_semaine} d'accompagnement'\n\n**Page 7 - Commande:** Paiement sécurisé\n\n**Taux de conversion visé:** 3-5%"
        },
        {
            "id": "30_day_plan",
            "title": "📅 Plan sur 30 Jours",
            "content": f"**JOUR 1-7: Fondations**\n- Profil optimisé ({user_form.competences})\n- 1 post/jour sur {user_form.passion}\n\n**JOUR 8-14: Autorité**\n- 3 conseils d'expert par semaine\n- Répondre aux questions dans ta niche\n\n**JOUR 15-21: Communauté**\n- Live hebdomadaire sur {user_form.passion}\n- Stories quotidiennes\n\n**JOUR 22-28: Monétisation**\n- Lancement offre {user_form.revenu_vise}\n- 5 prospects qualifiés/jour\n\n**JOUR 29-30: Scaling**\n- Automatisation avec {user_form.temps_semaine}\n- Préparation offre premium"
        },
        {
            "id": "content_ideas",
            "title": "💭 Idées de Contenu",
            "content": f"**Posts Éducatifs (3/semaine):**\n- 'Erreur #1 en {user_form.passion.lower()}'\n- 'Ma routine {user_form.competences} quotidienne'\n- 'Avant/Après: client transformation'\n\n**Stories Engagement (7/semaine):**\n- Coulisses de ton expertise\n- Questions/réponses {user_form.passion}\n- Témoignages clients\n\n**Contenu Viral (1/semaine):**\n- 'Thread: 7 secrets de {user_form.competences}'\n- 'Vidéo: {user_form.prenom} explique {user_form.passion}'\n- 'Carrousel: Guide complet débutant'\n\n**Call-to-Action:**\n'MP pour ma méthode {user_form.revenu_vise}/mois'\n\n**Temps requis:** {user_form.temps_semaine} de création"
        },
        {
            "id": "prospecting_messages",
            "title": "📨 Messages Prospection",
            "content": f"**Message DM 1 (Soft):**\n'Salut ! J'ai vu ton intérêt pour {user_form.passion.lower()}. Je partage des tips {user_form.competences.lower()} gratuits si ça t'intéresse 😉'\n\n**Message DM 2 (Direct):**\n'Hello ! Tu cherches à progresser en {user_form.passion.lower()} ? J'accompagne des gens comme toi vers {user_form.revenu_vise}/mois. Intéressé(e) ?'\n\n**Email Follow-up:**\n'Salut [Prénom],\n\nSuite à notre échange sur {user_form.passion}, voici ma méthode {user_form.competences} qui transforme les débutants en experts.\n\nElle fonctionne même avec seulement {user_form.temps_semaine}.\n\nTu veux que je te montre ?\n\n{user_form.prenom}'\n\n**SMS (si numéro):**\n'Salut [Prénom] ! {user_form.prenom} ici. Prêt(e) pour la méthode {user_form.passion} qui change tout ? 🚀'"
        },
        {
            "id": "launch_checklist",
            "title": "✅ Check-list Lancement",
            "content": f"**AVANT LANCEMENT:**\n☐ Bio optimisée avec {user_form.competences}\n☐ 10 posts de valeur sur {user_form.passion}\n☐ Landing page {user_form.revenu_vise}\n☐ Système de paiement\n☐ Email de bienvenue\n\n**LE JOUR J:**\n☐ Post d'annonce à 9h\n☐ Stories toutes les 2h\n☐ Live de lancement à 18h\n☐ Réponse immédiate aux commentaires\n☐ Follow-up DM prospects chauds\n\n**SUIVI (J+1 à J+7):**\n☐ Relance prospects tièdes\n☐ Témoignages premiers clients\n☐ Ajustement prix si besoin\n☐ Planning {user_form.temps_semaine} confirmé\n☐ Préparation prochaine offre\n\n**OBJECTIF:** {user_form.revenu_vise} en 30 jours maximum"
        }
    ]
    
    modules.extend(premium_extras)
    return modules

def generate_dsa_express_modules(user_form: UserForm) -> List[Dict]:
    """Generate 19 DSA Express modules (premium + 8 more)"""
    modules = generate_premium_modules(user_form)
    
    dsa_extras = [
        {
            "id": "entrepreneurship_intro",
            "title": "🎓 Introduction Entrepreneuriat",
            "content": f"**Module Fondamental DSA Express**\n\n**Qu'est-ce que l'entrepreneuriat moderne ?**\nCréer de la valeur avec tes {user_form.competences} pour une audience passionnée par {user_form.passion}.\n\n**Les 3 piliers du succès:**\n1. **Expertise** - Tes {user_form.competences}\n2. **Passion** - Ton intérêt pour {user_form.passion}\n3. **Action** - {user_form.temps_semaine} d'exécution\n\n**Mindset DSA Express:**\n- Commence maintenant, perfectionne en route\n- Vise {user_form.revenu_vise} rapidement\n- Niveau {user_form.niveau_experience} = avantage\n\n**Prochaine étape:** Appliquer la méthode DSA dans les 24h"
        },
        {
            "id": "mindset_positioning",
            "title": "🧠 Mindset & Positionnement",
            "content": f"**Ton positionnement unique:**\n'Le seul {user_form.competences.lower()} qui comprend vraiment {user_form.passion.lower()}'\n\n**Croyances limitantes à éliminer:**\n❌ 'Je suis trop {user_form.niveau_experience.lower()}'\n❌ 'Il faut des années pour réussir'\n❌ 'J'ai pas assez de temps ({user_form.temps_semaine})'\n\n**Nouvelles croyances DSA:**\n✅ Mon expérience {user_form.niveau_experience} = mon atout\n✅ Résultats possibles en 30 jours\n✅ {user_form.temps_semaine} bien utilisées = succès\n\n**Affirmation quotidienne:**\n'Je suis {user_form.prenom}, expert {user_form.competences}, et j'aide les gens à réussir en {user_form.passion}. Mon objectif {user_form.revenu_vise} est déjà en route.'\n\n**Action:** Répéter cette affirmation chaque matin"
        },
        {
            "id": "premium_offer",
            "title": "💎 Offre Haut de Gamme",
            "content": f"**Ta formation premium DSA Express:**\n\n**Nom:** 'Méthode {user_form.prenom} - {user_form.passion} Mastery'\n**Prix:** 297€ (après validation à 97€)\n**Durée:** 8 semaines intensives\n**Format:** Vidéos + Live + Groupe privé\n\n**Module 1:** Fondations {user_form.competences}\n**Module 2:** Stratégie {user_form.passion} avancée\n**Module 3:** Automatisation {user_form.temps_semaine}\n**Module 4:** Scaling vers {user_form.revenu_vise}\n**Module 5:** Mindset {user_form.niveau_experience} pro\n**Module 6:** Outils et ressources\n**Module 7:** Études de cas clients\n**Module 8:** Plan d'action personnalisé\n\n**Bonus:** Accès groupe VIP à vie\n**Garantie:** Résultats sous 60 jours ou remboursé"
        },
        {
            "id": "strategic_funnel",
            "title": "🎯 Tunnel Stratégique 4 Étapes",
            "content": f"**ÉTAPE 1 - ATTRACTION (Organique)**\n- Contenu viral {user_form.passion}\n- SEO sur {user_form.competences}\n- Partenariats influenceurs niche\n\n**ÉTAPE 2 - CONVERSION (Lead Magnet)**\n- PDF: 'Guide {user_form.passion} en {user_form.temps_semaine}'\n- Webinar: 'De {user_form.niveau_experience} à Expert'\n- Quiz: 'Quel est ton profil {user_form.competences} ?'\n\n**ÉTAPE 3 - NURTURING (Email séquence)**\n- J+1: Histoire personnelle {user_form.prenom}\n- J+3: Erreurs communes {user_form.passion}\n- J+5: Méthode secrète {user_form.competences}\n- J+7: Offre {user_form.revenu_vise} limitée\n\n**ÉTAPE 4 - SCALING (Automatisation)**\n- Chatbot qualification prospects\n- Retargeting publicités\n- Programme affiliation\n- Upsells formations premium"
        },
        {
            "id": "recommended_tools",
            "title": "🛠️ Outils Recommandés",
            "content": f"**CRÉATION CONTENU:**\n- Canva Pro (design posts {user_form.passion})\n- ChatGPT (idées contenu {user_form.competences})\n- Loom (vidéos explicatives)\n\n**GESTION BUSINESS:**\n- Notion (planning {user_form.temps_semaine})\n- Calendly (RDV prospects)\n- Stripe (paiements {user_form.revenu_vise})\n\n**MARKETING:**\n- Mailchimp (email marketing)\n- Buffer (programmation posts)\n- Hotjar (analyse comportement)\n\n**NIVEAU {user_form.niveau_experience.upper()} - PRIORITÉS:**\n1. Canva + ChatGPT (contenu)\n2. Calendly + Stripe (vente)\n3. Notion (organisation)\n\n**Budget mensuel:** 50-100€ max\n**ROI attendu:** x10 minimum avec {user_form.revenu_vise}"
        },
        {
            "id": "launch_plan",
            "title": "🚀 Plan de Lancement",
            "content": f"**PHASE 1 - PRÉ-LANCEMENT (7 jours)**\n- Teasing {user_form.passion} quotidien\n- Liste attente 100 personnes minimum\n- Beta test avec 3-5 cobayes\n\n**PHASE 2 - LANCEMENT OFFICIEL (3 jours)**\n- J-1: 'Demain je dévoile tout'\n- J0: Ouverture + Live {user_form.competences}\n- J+1: Témoignages + urgence\n\n**PHASE 3 - FERMETURE (2 jours)**\n- J+2: 'Plus que 24h'\n- J+3: 'Dernières heures' + clôture\n\n**OBJECTIFS PHASE:**\n- 50 ventes minimum = {user_form.revenu_vise} x 50\n- Taux conversion 5% minimum\n- Temps investi: {user_form.temps_semaine} concentrées\n\n**Niveau {user_form.niveau_experience}:** Start small, scale fast !"
        },
        {
            "id": "guided_exercises",
            "title": "📚 Exercices Guidés",
            "content": f"**EXERCICE 1 - AVATAR CLIENT (15 min)**\nTon client idéal pour {user_form.passion}:\n- Âge: ___\n- Problème principal: ___\n- Budget disponible: ___\n- Objection #1: ___\n\n**EXERCICE 2 - PITCH 30 SECONDES (10 min)**\nComplète:\n'J'aide [qui] à [résultat] grâce à [ta méthode {user_form.competences}] en [temps {user_form.temps_semaine}] même si [objection niveau {user_form.niveau_experience}]'\n\n**EXERCICE 3 - PLANNING RÉALISTE (20 min)**\nRépartis tes {user_form.temps_semaine}:\n- Création contenu: ___h\n- Prospection: ___h  \n- Ventes: ___h\n- Formation: ___h\n\n**EXERCICE 4 - PREMIER PRODUIT (30 min)**\nDéfinis:\n- Nom: Méthode {user_form.prenom} ___\n- Prix: ___€ (vise {user_form.revenu_vise})\n- Livrable: ___\n- Garantie: ___"
        },
        {
            "id": "first_client",
            "title": "🎯 Objectif 1er Client",
            "content": f"**MISSION: TON PREMIER CLIENT EN 14 JOURS**\n\n**JOUR 1-3: PRÉPARATION**\n✅ Offre claire {user_form.competences} pour {user_form.passion}\n✅ Prix défini (commencer à 47€)\n✅ Process de vente simple\n\n**JOUR 4-7: PROSPECTION MASSIVE**\n✅ 20 DM personnalisés/jour\n✅ 5 commentaires valeur sur posts niche\n✅ 1 post 'success story' par jour\n\n**JOUR 8-10: CONVERSION**\n✅ Follow-up prospects intéressés\n✅ Appels découverte (Calendly)\n✅ Témoignage premier client\n\n**JOUR 11-14: OPTIMISATION**\n✅ Analyse ce qui a marché\n✅ Prix suivant: 97€\n✅ Plan pour client #2 et #3\n\n**AVEC {user_form.temps_semaine}:**\n- Matin: Contenu (1h)\n- Midi: Prospection (1h30)\n- Soir: Vente (30min)\n\n**OBJECTIF:** 1 client = validation concept\n**NEXT:** 10 clients = {user_form.revenu_vise}/mois !"
        }
    ]
    
    modules.extend(dsa_extras)
    return modules

@app.get("/")
async def root():
    return {"message": "Anaylab Builder API"}

@app.post("/api/checkout/session")
async def create_checkout_session(request: CheckoutRequest):
    # Validate package
    if request.package_id not in PACKAGES:
        raise HTTPException(status_code=400, detail="Package invalide")
    
    package = PACKAGES[request.package_id]
    
    # Generate unique transaction ID
    transaction_id = str(uuid.uuid4())
    
    # Initialize Stripe checkout
    webhook_url = f"{request.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create success and cancel URLs
    success_url = f"{request.origin_url}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/cancel"
    
    try:
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=package["amount"],
            currency=package["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "transaction_id": transaction_id,
                "package_id": request.package_id,
                "user_email": request.user_form.email,
                "user_name": request.user_form.prenom
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = {
            "id": transaction_id,
            "session_id": session.session_id,
            "package_id": request.package_id,
            "amount": package["amount"],
            "currency": package["currency"],
            "user_email": request.user_form.email,
            "user_form": request.user_form.dict(),
            "payment_status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        db.payment_transactions.insert_one(transaction)
        
        return {"url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur création session: {str(e)}")

@app.get("/api/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    try:
        # Get from database first
        transaction = db.payment_transactions.find_one({"session_id": session_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction non trouvée")
        
        # If already processed, return cached status
        if transaction.get("payment_status") == "paid":
            return {
                "status": "complete",
                "payment_status": "paid",
                "amount_total": int(transaction["amount"] * 100),  # Convert to cents
                "currency": transaction["currency"],
                "user_modules": transaction.get("user_modules")
            }
        
        # Check with Stripe
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update database if status changed
        if checkout_status.payment_status == "paid" and transaction.get("payment_status") != "paid":
            # Generate modules based on package
            user_form = UserForm(**transaction["user_form"])
            
            if transaction["package_id"] == "starter":
                modules = generate_starter_modules(user_form)
            elif transaction["package_id"] == "premium":
                modules = generate_premium_modules(user_form)
            else:  # dsa_express
                modules = generate_dsa_express_modules(user_form)
            
            # Update transaction with modules
            db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "payment_status": "paid",
                        "user_modules": modules,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            checkout_status.metadata = {"user_modules": modules}
        
        return checkout_status.dict()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur vérification paiement: {str(e)}")

@app.get("/api/modules/{session_id}")
async def get_user_modules(session_id: str):
    transaction = db.payment_transactions.find_one({"session_id": session_id})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    if transaction.get("payment_status") != "paid":
        raise HTTPException(status_code=402, detail="Paiement non validé")
    
    return {
        "modules": transaction.get("user_modules", []),
        "package": transaction["package_id"],
        "user": transaction["user_form"]
    }

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.event_type == "checkout.session.completed":
            # Update transaction status
            db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {
                    "$set": {
                        "payment_status": webhook_response.payment_status,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)