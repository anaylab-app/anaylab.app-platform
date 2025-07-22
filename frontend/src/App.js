import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState('home'); // home, form, modules, success, cancel
  const [formData, setFormData] = useState({
    prenom: '',
    email: '',
    competences: '',
    passion: '',
    temps_semaine: '',
    revenu_vise: '',
    niveau_experience: '',
    version_choisie: ''
  });
  const [userModules, setUserModules] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const packages = {
    starter: {
      name: 'Starter',
      price: '20 €',
      modules: 6,
      features: ['Idée de business', 'Nom de marque', 'Offre claire à vendre', 'Mini tunnel de vente', 'Plan d\'action simple', 'Pitch à poster']
    },
    premium: {
      name: 'Premium',
      price: '49 €',
      modules: 11,
      features: ['Tout Starter +', 'Tunnel complet', 'Plan sur 30 jours', 'Idées de contenu', 'Messages prospection', 'Check-list lancement']
    },
    dsa_express: {
      name: 'DSA Express',
      price: '99 €',
      modules: 19,
      features: ['Tout Premium +', 'Introduction entrepreneuriat', 'Mindset & Positionnement', 'Offre haut de gamme', 'Tunnel stratégique', 'Outils recommandés', 'Plan de lancement', 'Exercices guidés', 'Objectif 1er client']
    }
  };

  const testimonials = [
    { name: 'Camille D.', rating: 5, text: 'En 10 minutes, j\'avais une offre claire. J\'ai pu poster direct.' },
    { name: 'Lucas R.', rating: 4, text: 'J\'aurais aimé plus d\'exemples, mais le plan était super clair.' },
    { name: 'Inès T.', rating: 5, text: 'DSA Express est mieux structuré que certaines formations à 500€ !' },
    { name: 'Mehdi L.', rating: 4, text: 'Le tunnel est bon, même si j\'ai ajusté 2 détails. Globalement top.' },
    { name: 'Sophie B.', rating: 5, text: 'Le contenu Premium est pro, j\'ai lancé direct sur Insta.' }
  ];

  // Check for return from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      setCurrentStep('success');
      pollPaymentStatus(sessionId);
    } else if (window.location.pathname.includes('/cancel')) {
      setCurrentStep('cancel');
    }
  }, []);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      alert('Vérification du paiement expirée. Contactez le support.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/checkout/status/${sessionId}`);
      const data = await response.json();

      if (data.payment_status === 'paid') {
        loadUserModules(sessionId);
        return;
      } else if (data.status === 'expired') {
        alert('Session de paiement expirée. Veuillez réessayer.');
        setCurrentStep('home');
        return;
      }

      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Erreur vérification paiement:', error);
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    }
  };

  const loadUserModules = async (sessionId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/modules/${sessionId}`);
      const data = await response.json();
      setUserModules(data.modules);
      setCurrentStep('modules');
    } catch (error) {
      console.error('Erreur chargement modules:', error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPackage) {
      alert('Veuillez choisir une offre');
      return;
    }

    setIsLoading(true);

    try {
      // Mode payant uniquement - Stripe checkout
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: selectedPackage,
          origin_url: window.location.origin,
          user_form: formData
        })
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (error) {
      alert('Erreur création session paiement: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePackageSelect = (packageId) => {
    setSelectedPackage(packageId);
    setFormData({
      ...formData,
      version_choisie: packages[packageId].name
    });
  };

  if (currentStep === 'modules') {
    const isDemo = userModules.length > 0 && (userModules[0].id === 'demo_info' || userModules[0].id === 'test_full_info');
    const isTestFull = userModules.length > 0 && userModules[0].id === 'test_full_info';
    
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            {isTestFull ? (
              <>
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  🧪 Ton Test Complet - 19 Modules
                </h1>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg inline-block mb-4">
                  <span className="font-bold">TEST COMPLET ACTIVÉ - EXPÉRIENCE DSA COMPLÈTE</span>
                </div>
                <p className="text-xl opacity-80">Tu expérimentes exactement ce que tes clients recevraient avec DSA Express</p>
              </>
            ) : isDemo ? (
              <>
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  🎯 Ta Démonstration Rapide
                </h1>
                <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg inline-block mb-4">
                  <span className="font-bold">DEMO RAPIDE ACTIVÉE</span>
                </div>
                <p className="text-xl opacity-80">Aperçu rapide de nos modules personnalisés</p>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  🎉 Tes Modules Anaylab Builder™
                </h1>
                <p className="text-xl opacity-80">Clique sur chaque module pour découvrir ton contenu personnalisé</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {userModules.map((module, index) => (
              <div 
                key={module.id} 
                className={`module-card group cursor-pointer transform hover:scale-105 transition-all duration-300 ${
                  module.id === 'demo_info' ? 'border-2 border-green-400 bg-gradient-to-br from-green-600/20 to-teal-600/20' : 
                  module.id === 'test_full_info' ? 'border-2 border-blue-400 bg-gradient-to-br from-blue-600/20 to-purple-600/20' : ''
                }`}
                onClick={() => {
                  const modal = document.getElementById('moduleModal');
                  const title = document.getElementById('modalTitle');
                  const content = document.getElementById('modalContent');
                  title.textContent = module.title;
                  content.innerHTML = module.content.replace(/\n/g, '<br/>');
                  modal.classList.remove('hidden');
                }}
              >
                <div className={`relative h-48 rounded-lg overflow-hidden p-6 flex items-center justify-center ${
                  module.id === 'demo_info' 
                    ? 'bg-gradient-to-br from-green-600 to-teal-600' 
                    : module.id === 'test_full_info'
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                    : 'bg-gradient-to-br from-purple-600 to-blue-600'
                }`}>
                  <h3 className="text-2xl font-bold text-white text-center group-hover:text-yellow-300 transition-colors">
                    {module.title}
                  </h3>
                  <div className="absolute inset-0 bg-black opacity-20 group-hover:opacity-10 transition-opacity"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            {isTestFull ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg inline-block">
                  <span className="font-bold">🧪 Test complet réussi ! Tu as vu la puissance de DSA Express</span>
                </div>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => setCurrentStep('home')}
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    💳 Passer à la version payante
                  </button>
                  <button 
                    onClick={() => {
                      setUserModules([]);
                      setCurrentStep('home');
                    }}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    🏠 Nouveau test
                  </button>
                </div>
              </div>
            ) : isDemo ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-lg inline-block">
                  <span className="font-bold">🚀 Prêt pour plus ? Teste la version complète !</span>
                </div>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => {
                      handlePackageSelect('test_full');
                      setCurrentStep('form');
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    🧪 Test complet (19 modules)
                  </button>
                  <button 
                    onClick={() => setCurrentStep('home')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    💳 Choisir mon package payant
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setCurrentStep('home')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                🏠 Retour à l'accueil
              </button>
            )}
          </div>
        </div>

        {/* Modal */}
        <div id="moduleModal" className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 hidden z-50">
          <div className="bg-white text-black rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 id="modalTitle" className="text-2xl font-bold"></h2>
                <button 
                  onClick={() => document.getElementById('moduleModal').classList.add('hidden')}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div id="modalContent" className="prose max-w-none whitespace-pre-line"></div>
              <div className="mt-6 flex gap-4">
                <button 
                  onClick={() => {
                    const content = document.getElementById('modalContent').textContent;
                    navigator.clipboard.writeText(content);
                    alert('Contenu copié !');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  📋 Copier le contenu
                </button>
                <button 
                  onClick={() => document.getElementById('moduleModal').classList.add('hidden')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">📋 Questionnaire Personnalisé</h1>
              <p className="text-xl opacity-80">8 questions pour créer tes modules sur mesure</p>
              <div className="mt-4 p-4 bg-black bg-opacity-30 rounded-lg">
                <p className="font-semibold">Offre sélectionnée: {packages[selectedPackage]?.name} - {packages[selectedPackage]?.price}</p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block text-lg font-semibold mb-2">1. Prénom *</label>
                <input 
                  type="text" 
                  name="prenom" 
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70"
                  placeholder="Ton prénom"
                  required 
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">2. Email *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70"
                  placeholder="ton.email@exemple.com"
                  required 
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">3. Quelles sont tes compétences principales ? *</label>
                <input 
                  type="text" 
                  name="competences" 
                  value={formData.competences}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70"
                  placeholder="Ex: Marketing digital, Coaching, Design..."
                  required 
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">4. Qu'est-ce qui te passionne ? *</label>
                <input 
                  type="text" 
                  name="passion" 
                  value={formData.passion}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70"
                  placeholder="Ex: Fitness, Business, Art..."
                  required 
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">5. Combien de temps peux-tu consacrer chaque semaine ? *</label>
                <select 
                  name="temps_semaine" 
                  value={formData.temps_semaine}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white"
                  required
                >
                  <option value="">Choisis une option</option>
                  <option value="2-5 heures">2-5 heures</option>
                  <option value="5-10 heures">5-10 heures</option>
                  <option value="10-20 heures">10-20 heures</option>
                  <option value="20+ heures">20+ heures</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">6. Quel revenu mensuel vises-tu ? *</label>
                <select 
                  name="revenu_vise" 
                  value={formData.revenu_vise}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white"
                  required
                >
                  <option value="">Choisis un objectif</option>
                  <option value="500-1000€">500-1000€</option>
                  <option value="1000-3000€">1000-3000€</option>
                  <option value="3000-5000€">3000-5000€</option>
                  <option value="5000€+">5000€+</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">7. Quel est ton niveau d'expérience ? *</label>
                <select 
                  name="niveau_experience" 
                  value={formData.niveau_experience}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white"
                  required
                >
                  <option value="">Choisis ton niveau</option>
                  <option value="Débutant">Débutant</option>
                  <option value="Confirmé">Confirmé</option>
                </select>
              </div>

              <div className="bg-black bg-opacity-30 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">8. Offre sélectionnée:</h3>
                <div className="text-lg">
                  <span className="font-semibold">{packages[selectedPackage]?.name} - {packages[selectedPackage]?.price}</span>
                  <p className="text-sm opacity-80 mt-2">{packages[selectedPackage]?.modules} modules inclus</p>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-lg text-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                  isLoading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                }`}
              >
                {isLoading ? '⏳ Création en cours...' : '💳 Payer et recevoir mes modules'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <div className="text-8xl mb-8">🎉</div>
          <h1 className="text-4xl font-bold mb-4">Paiement Confirmé !</h1>
          <p className="text-xl mb-8">Ton paiement a été validé. Tes modules personnalisés sont en cours de génération...</p>
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (currentStep === 'cancel') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 text-white flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <div className="text-8xl mb-8">❌</div>
          <h1 className="text-4xl font-bold mb-4">Paiement Annulé</h1>
          <p className="text-xl mb-8">Ton paiement a été annulé. Tu peux recommencer quand tu le souhaites.</p>
          <button 
            onClick={() => setCurrentStep('home')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            🏠 Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Home page
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
            Anaylab Builder™
          </h1>
          <p className="text-2xl md:text-3xl mb-4">💡 Avant de mettre 500 € dans une formation...</p>
          <p className="text-xl md:text-2xl opacity-80">commence ici.</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {Object.entries(packages).map(([id, pkg]) => (
            <div 
              key={id}
              onClick={() => {
                handlePackageSelect(id);
                setCurrentStep('form');
              }}
              className={`relative cursor-pointer transform hover:scale-105 transition-all duration-300 ${
                id === 'premium' ? 'md:-mt-4' : ''
              }`}
            >
              {id === 'premium' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold">
                  ⭐ POPULAIRE
                </div>
              )}
              <div className={`bg-white bg-opacity-10 backdrop-blur-lg border ${
                id === 'premium' ? 'border-yellow-400' : 'border-white border-opacity-30'
              } rounded-lg p-8 h-full hover:bg-opacity-20`}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-bold mb-2">{pkg.price}</div>
                  <p className="text-lg opacity-80">{pkg.modules} modules</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-400 mr-2">✅</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300">
                  Commencer
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">⭐ Témoignages & Avis Clients</h2>
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-white bg-opacity-20 backdrop-blur-lg rounded-lg px-6 py-3 border border-white border-opacity-30">
              <span className="text-2xl mr-2">⭐⭐⭐⭐</span>
              <span className="text-xl font-bold">4/5</span>
              <span className="text-lg ml-2 opacity-80">Note moyenne</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 border border-white border-opacity-30">
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-2">{renderStars(testimonial.rating)}</div>
                  <div className="font-semibold">{testimonial.name}</div>
                </div>
                <p className="italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">🎯 Générer un business structuré en moins de 10 minutes</h2>
          <p className="text-xl mb-8 opacity-80">Choisis ton offre et commence maintenant !</p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            {Object.entries(packages).map(([id, pkg]) => (
              <button
                key={id}
                onClick={() => {
                  handlePackageSelect(id);
                  setCurrentStep('form');
                }}
                className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                  id === 'test' ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700' :
                  id === 'starter' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' :
                  id === 'premium' ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' :
                  'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
                }`}
              >
                {pkg.name} - {pkg.price}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;