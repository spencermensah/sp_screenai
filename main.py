from flask import Flask, request
from google.cloud import storage
import base64
import os
import vertexai
from vertexai.generative_models import GenerativeModel, Part, FinishReason
import vertexai.preview.generative_models as generative_models

app = Flask(__name__)

video1 = Part.from_uri(
    mime_type="video/webm",
    uri="gs://8437955233/uploaded-video.webm")

generation_config = {
    "max_output_tokens": 8192,
    "temperature": 1,
    "top_p": 0.95,
}

safety_settings = {
    generative_models.HarmCategory.HARM_CATEGORY_HATE_SPEECH: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    generative_models.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    generative_models.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    generative_models.HarmCategory.HARM_CATEGORY_HARASSMENT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}

def generate(user_ask):
    vertexai.init(project="koboodle-telagram-alerts", location="us-central1")
    model = GenerativeModel(
        "gemini-1.5-pro-preview-0514",
    )
    responses = model.generate_content(
        [video1, user_ask],
        generation_config=generation_config,
        safety_settings=safety_settings,
        stream=True,
    )

    fullResponse = ""

    for response in responses:
        fullResponse += response.text
    
    return fullResponse


@app.route('/upload', methods=['POST'])
def upload_video(request):
    try:
        # Get the base64 encoded video data from the request
        video_base64 = request.json['blob']
        user_ask = request.json['userInput']
        
        # Decode the base64 string back into binary data
        video_bytes = base64.b64decode(video_base64.split(',')[1])
        
        # Set your bucket name and desired blob name
        bucket_name = '8437955233'
        blob_name = 'uploaded-video.webm'
        
        # Initialize a Google Cloud Storage client
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        
        # Upload the video data to Google Cloud Storage
        blob.upload_from_string(video_bytes)
        
        fullResponse = generate(user_ask)
        
        return {'status': 'success', 'message': 'Video uploaded successfully.', 'fullResponse': fullResponse}, 200
    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
