
import ovh

# Initialisation du client OVH
client = ovh.Client(
    endpoint='ovh-eu',  # Pour l'Europe (modifier si vous êtes sur un autre endpoint)
    application_key='VOTRE_APPLICATION_KEY',  # Remplacez par votre clé API
    application_secret='VOTRE_APPLICATION_SECRET',  # Remplacez par votre secret API
    consumer_key='VOTRE_CONSUMER_KEY'  # Obtenez-le lors de l'initialisation
)

# Token fourni dans l'email
token = "XtprpYdJMTentYVFGjJgaTVQXqFx7GBn"

# Exemple de traitement d'une demande de contact
request_id = "3841358"  # ID mentionné dans l'email
try:
    response = client.get(f'/me/contactChange/{request_id}', {'token': token})
    print("Détails de la demande :", response)

    # Validation de la demande (si nécessaire)
    client.post(f'/me/contactChange/{request_id}/accept', {'token': token})
    print("Demande validée avec succès !")
except ovh.exceptions.APIError as e:
    print("Erreur :", e)
