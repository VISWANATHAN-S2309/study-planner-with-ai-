import os
import google.generativeai as genai
import json
import re
genai.configure(api_key="AIzaSyCk4y_Mh9l3Ycr-AZbggroKONaGe_Ry2eQ")

# Create the model
generation_config = {
  "temperature": 0.7,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
  model_name="gemini-2.0-flash",
  generation_config=generation_config,
  system_instruction="You are an expert study planner. Generate structured study plans based on syllabus content and student constraints and also clear the student doubts ",
)

chat_session = model.start_chat(
  history=[
  ]
)
def get_chatbot_response(question):
    print(f"Received Question: {question}")  # Debugging
    response = chat_session.send_message(question)
    print(f"Generated Response: {response.text}")  # Debugging
    return response.text


def extract_json_from_response(response_text):
    # Use regex to extract JSON from the response
    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
    if json_match:
        return json_match.group(0)
    return None
def generate_smarts_study_plan(syllabus, study_hours, exam_dates, start_datetime, completed_sessions=None):
    # Set default for completed_sessions
    if completed_sessions is None:
        completed_sessions = []

    prompt = f"""
You are an AI study planner. Generate an optimized study plan based on the following details:

- *Syllabus*: {syllabus}
- *Total Study Hours per Day*: {study_hours}
- *Exam Dates*: {exam_dates}
- *Start Date and Time*: {start_datetime}

The schedule should include:
- Daily study sessions with specific topics.
- Prioritization of difficult topics earlier.
- Breaks for meals and rest.
- Adjustments based on the time available before exams.

Format the output as a valid JSON object with the following structure:
{{
  "study_plan": [
    {{
      "date": "YYYY-MM-DD",
      "sessions": [
        {{
          "time": "HH:MM AM/PM",
          "topic": "Topic Name",
          "duration": "X minutes"
        }}
      ]
    }}
  ]
}}
Additional requirements:
    - Prioritize topics with higher difficulty
    - Include 25% more time for topics marked as missed
    - Add weekly revision sessions
    - Balance workload across days
    {f"- Adjust for current progress: {completed_sessions}" if completed_sessions else ""}
Return only the JSON object. Do not include any additional text or explanations.
"""
    
    try:
        response = model.generate_content(prompt)
        print(f"Raw Model Response: {response.text}")  # Debugging
        
        # Extract JSON from the response
        json_response = extract_json_from_response(response.text)
        if not json_response:
            return {"error": "No valid JSON found in the response"}
        
        # Parse the JSON
        study_plan = json.loads(json_response)
        print(f"Parsed Study Plan: {study_plan}")  # Debugging
        
        return study_plan
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        return {"error": "Failed to parse the response as JSON"}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"error": str(e)}


def generate_quiz(topic):
    prompt = f"""Generate a 5-question quiz about {topic} with multiple choice answers. 
Format as JSON with this structure:
{{
    "questions": [
        {{
            "question": "Question text",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctIndex": 0
        }}
    ]
}}"""
    
    try:
        response = model.generate_content(prompt)
        return extract_json_from_response(response.text)
    except Exception as e:
        return json.dumps({"error": str(e)})

def extract_json_from_response(response_text):
    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
    return json_match.group(0) if json_match else None