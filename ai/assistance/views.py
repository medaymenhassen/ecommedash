from django.http import JsonResponse
from rest_framework.decorators import api_view
import random
import os
import json
import random
import json
import os
import matplotlib.pyplot as plt
from PIL import Image
from django.http import JsonResponse
from rest_framework.decorators import api_view,  throttle_classes, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.throttling import AnonRateThrottle
from .throttles import AdminRateThrottle
import nltk

from django.contrib.sites.models import Site
from django.http import HttpResponse
from django.views.generic import View
from django.http import JsonResponse
from rest_framework.decorators import api_view
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from sklearn.preprocessing import LabelEncoder
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import LabelEncoder
import os
import random
from sklearn.preprocessing import LabelEncoder
from rest_framework.decorators import api_view
from django.http import JsonResponse
from django.views.generic import View
from django.contrib.sites.models import Site
from django.http import HttpResponse

import json
from .ai import load_intent_data, preprocess_data, train_model, predict_class
# Backend: Django (views.py)


# Définir les chemins pour les fichiers nécessaires
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'data', 'chat_model.keras')
INTENT_FILE_PATH = os.path.join(BASE_DIR, 'data', 'intent.json')

# Charger les données et préparer le modèle
data = load_intent_data(INTENT_FILE_PATH)
if data:
    X, y, responses, encoder, tokenizer = preprocess_data(data)
    model = train_model(X, y, len(set(y)), MODEL_PATH)
else:
    model = None
@api_view(['POST'])
def chat(request):
    """Endpoint principal pour gérer les requêtes de chat."""
    if request.method == "POST":
        try:
            # Charger le corps de la requête JSON
            body = json.loads(request.body)
            user_input = body.get("message", "").strip()  # Récupère et nettoie le message utilisateur

            if not user_input:
                return JsonResponse({"error": "Message est requis"}, status=400)

            if model is None:
                return JsonResponse({"error": "Le modèle n'a pas pu être chargé."}, status=500)

            # Appel de la fonction `predict_class` pour obtenir une réponse
            response = predict_class(model, tokenizer, encoder, responses, user_input)
            
            if not response or response == "Désolé, je n'ai pas compris.":
                return JsonResponse({
                    "tag": "unanswered",
                    "response": "Je n'ai pas compris votre demande. Veuillez reformuler ou consulter notre aide."
                }, status=200)

            # Retourner la réponse obtenue
            return JsonResponse({"tag": "response", "response": response}, status=200)
        except Exception as e:
            return JsonResponse({"error": "Une erreur est survenue côté serveur."}, status=500)

    return JsonResponse({"error": "Requête invalide"}, status=400)


class RobotsTextView(View):
    content_type = "text/plain"

    def get(self, request, *args, **kwargs):
        site = Site.objects.get_current()
        sitemap_url = f"https://{site.domain}/py/sitemap.xml"
        content = f"User-Agent: *\nDisallow:\nSitemap: {sitemap_url}\n"
        return HttpResponse(content, content_type=self.content_type)
