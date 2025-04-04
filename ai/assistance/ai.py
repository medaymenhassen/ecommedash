import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import LabelEncoder
import random
import requests
from bs4 import BeautifulSoup
import os

def load_intent_data(file_path):
    """Charge les données d'intentions depuis un fichier JSON"""
    try:
        print(f"Tentative de chargement des données depuis : {file_path}")
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            print(f"Données chargées avec succès : {data}")
            return data
    except Exception as e:
        print(f"Erreur lors du chargement des données d'intentions : {e}")
        return {}


def preprocess_data(data):
    """Prépare les données pour l'entraînement du modèle"""
    try:
        print("Début de la préparation des données...")
        patterns = []
        tags = []
        responses = {}

        for intent in data.get('intents', []):
            print(f"Traitement de l'intention : {intent.get('tag')}")
            for pattern in intent.get('patterns', []):
                patterns.append(pattern)
                tags.append(intent['tag'])
                responses[intent['tag']] = intent['responses']

        encoder = LabelEncoder()
        tags_encoded = encoder.fit_transform(tags)
        print("Encodage des tags terminé.")

        tokenizer = tf.keras.preprocessing.text.Tokenizer(oov_token="<OOV>")
        tokenizer.fit_on_texts(patterns)
        sequences = tokenizer.texts_to_sequences(patterns)
        padded_sequences = tf.keras.preprocessing.sequence.pad_sequences(sequences)
        print("Tokenisation et séquencement terminés.")

        return padded_sequences, tags_encoded, responses, encoder, tokenizer
    except Exception as e:
        print(f"Erreur lors de la préparation des données : {e}")
        return None, None, None, None, None

def train_model(X, y, num_classes, model_path):
    """Entraîne et enregistre le modèle"""
    if os.path.exists(model_path):
        model = load_model(model_path)
        print("Modèle chargé depuis le fichier.")
    else:
        print("Entraînement du modèle...")
        model = Sequential([
            Dense(256, input_shape=(X.shape[1],), activation='relu'),
            Dropout(0.5),
            Dense(128, activation='relu'),
            Dropout(0.5),
            Dense(num_classes, activation='softmax')
        ])
        model.compile(loss='sparse_categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
        early_stopping = EarlyStopping(monitor='loss', patience=5)
        model.fit(X, y, epochs=2000, batch_size=8, verbose=1, callbacks=[early_stopping])
        model.save(model_path)
        print("Modèle entraîné et sauvegardé.")
    return model

def scrape_all_sites():
    """Scrape le contenu de tous les sites spécifiés"""
    urls = [
        "https://www.cognitiex.com/",
        "https://www.oseox.fr/ux/",
        "https://www.psychomedia.qc.ca/psychologie/biais-cognitifs"
    ]
    contents = {}
    print("Début du scraping des sites...")
    for url in urls:
        print(f"Scraping en cours pour : {url}")
        contents[url] = scrape_content(url)
    print("Scraping terminé.")
    return contents

def scrape_content(url):
    """Récupère le contenu complet d'un site (toutes les pages disponibles)."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        content = ""
        print("4")
        # Scraping spécifique pour chaque site
        if "cognitiex" in url:
            while True:
                content += soup.find('div', class_='entry-content').get_text(strip=True)
                next_page = soup.find('a', class_='next page-numbers')
                if not next_page or 'href' not in next_page.attrs:
                    break
                response = requests.get(next_page['href'])
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')

        elif "oseox" in url:
            while True:
                content += soup.find('div', class_='entry-content').get_text(strip=True)
                next_page = soup.find('a', class_='next')
                if not next_page or 'href' not in next_page.attrs:
                    break
                response = requests.get(next_page['href'])
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')

        elif "psychomedia" in url:
            while True:
                content += soup.find('div', class_='field-item').get_text(strip=True)
                next_page = soup.find('a', class_='pager-next')
                if not next_page or 'href' not in next_page.attrs:
                    break
                next_url = "https://www.psychomedia.qc.ca" + next_page['href']
                response = requests.get(next_url)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')
                print("5")
        return content

    except Exception as e:
        print(f"Erreur lors du scraping de l'URL {url}: {e}")
        return ""


def predict_class(model, tokenizer, encoder, responses, text, unanswered_file="unanswered_questions.json"):
    """Prédit la classe d'un message utilisateur"""
    try:
        # Préparer la séquence
        sequence = tokenizer.texts_to_sequences([text])
        padded_sequence = tf.keras.preprocessing.sequence.pad_sequences(sequence, maxlen=model.input_shape[1], padding='post')

        # Faire une prédiction
        prediction = model.predict(padded_sequence, verbose=0)
        predicted_index = np.argmax(prediction)
        confidence = prediction[0][predicted_index]
        # Vérifier le seuil de confiance
        if confidence < 0.1:
            save_unanswered_question(text, "Confiance trop faible", unanswered_file)
            return "Désolé, je n'ai pas compris."

        # Décoder la classe prédite
        predicted_class = encoder.inverse_transform([predicted_index])[0]
        # Vérifier si la classe a une réponse définie
        if predicted_class not in responses:
            save_unanswered_question(text, f"Aucune réponse pour le tag : {predicted_class}", unanswered_file)
            return "Désolé, je n'ai pas trouvé d'information pertinente pour votre demande."

        return random.choice(responses[predicted_class])
    except Exception as e:
        return "Désolé, une erreur est survenue."


def save_unanswered_question(question, response, file_path="unanswered_questions.json"):
    """Sauvegarde les questions sans réponse dans un fichier JSON"""
    try:
        data = []
        if os.path.exists(file_path):
            print("7")
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)

        data.append({"question": question, "predicted_response": response})
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Erreur lors de la sauvegarde de la question sans réponse : {e}")
