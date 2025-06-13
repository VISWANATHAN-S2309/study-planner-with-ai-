from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
import bcrypt
from datetime import datetime, timedelta
import json
from bson import ObjectId
from chat import get_chatbot_response,generate_smarts_study_plan,generate_quiz
import fitz  # PyMuPDF
import PyPDF2
import re
from PIL import Image
import tempfile
import pytesseract
from pdf2image import convert_from_path
import os

app = Flask(__name__)
CORS(app)

app.config["MONGO_URI"] = "mongodb://localhost:27017/studyplan"
mongo = PyMongo(app)

users_collection = mongo.db.users
plans_collection = mongo.db.plan
collection=mongo.db.syllabus
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    existing_user = users_collection.find_one({"email": data["email"]})
    if existing_user:
        return jsonify({"message": "User already exists"}), 400
    hashed_pw = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())
    user = {
        "_id": ObjectId(),
        "name": data["name"],
        "email": data["email"],
        "password": hashed_pw
    }
    users_collection.insert_one(user)
    return jsonify({"message": "User registered successfully", "userId": str(user["_id"])}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = users_collection.find_one({"email": data["email"]})
    if user and bcrypt.checkpw(data["password"].encode('utf-8'), user["password"]):
        return jsonify({"success": True, "userId": str(user["_id"])})
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

# with open("studyassist.json", "r", encoding="utf-8") as file:
#     qa_data = json.load(file)

# def find_answer(question):
#     """Search for the answer in the dataset."""
#     question = question.lower()
#     for category in qa_data["chatbot_dataset"]:  # Loop through categories
#         for q in category["questions"]:  # Loop through questions in each category
#             if q["question"].lower() == question:
#                 return q["answer"]  # Return the answer if found
#   return "I'm not sure. Can you rephrase your question?"

@app.route("/chat", methods=["POST"])
def chat():
    """Handle chatbot requests."""
    data = request.json
    question = data.get("question", "")
    if not question:
        return jsonify({"answer": "Please ask a valid question!"})
    answer = get_chatbot_response(question)  
    return jsonify({"answer": answer})

@app.route('/get_study_plan', methods=['GET'])
def get_study_plan():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"message": "User ID is required"}), 400
    try:
        user_id = ObjectId(user_id)
        study_plan_doc = plans_collection.find_one({"user_id": user_id}, {"_id": 0, "plan": 1})
        if not study_plan_doc:
            return jsonify({"message": "No study plan found"}), 404

        # Ensure all sessions have a valid time
        study_plan = study_plan_doc["plan"]
        for subject, subject_data in study_plan.items():
            for day in subject_data.get("schedule", []):
                for session in day.get("sessions", []):
                    if "time" not in session or not isinstance(session["time"], (int, float)):
                        session["time"] = 30  # Default to 30 minutes if missing

        return jsonify({"study_plan": study_plan})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/mark_topic_completed', methods=['POST'])
def mark_completed():
    data = request.json
    user_id = data.get("user_id")
    subject = data.get("subject")
    topic_name = data.get("topic")
    actual_time = data.get("actualTime", 0)  # Default to 0 if not provided
    completion_time = datetime.now()

    try:
        user_id = ObjectId(user_id)
    except:
        return jsonify({"message": "Invalid User ID"}), 400

    study_plan = plans_collection.find_one({"user_id": user_id})
    if not study_plan:
        return jsonify({"message": "Study plan not found"}), 404

    plans_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            f"progress.{subject}.{topic_name}.completion_time": completion_time,
            f"progress.{subject}.{topic_name}.actual_time": actual_time
        }}
    )

    return jsonify({"message": "Topic marked as completed", "status": "success"}), 200

def format_time(hour):
    period = "AM" if hour < 12 else "PM"
    hour = hour if hour <= 12 else hour - 12
    hour = 12 if hour == 0 else hour
    return f"{hour}:00 {period}"
def generate_smart_study_plan(subjects, study_hours, exam_dates, start_datetime):
    plan = {}
    exam_dates = sorted(exam_dates)
    sleep_time = (23, 7)  # 11 PM - 7 AM Sleep
    meal_times = [(8, "Breakfast"), (13, "Lunch"), (19, "Dinner")]
    relaxation_times = [(16, "Relaxation Break"), (21, "Short Walk")]
    total_days_available = (exam_dates[0] - start_datetime.date()).days if exam_dates else 30
    total_topics = sum(len(chapter["topics"]) for subject in subjects for chapter in subject["chapters"])
    
    optimized_study_time = min(study_hours, max(1, round(total_topics * 2 / total_days_available, 2)))
    study_day = start_datetime.date()
    hour = start_datetime.hour

    for i, subject in enumerate(subjects):
        total_topics = sum(len(chapter["topics"]) for chapter in subject["chapters"])
        next_exam_date = exam_dates[i] if i < len(exam_dates) else None
        days_until_exam = (next_exam_date - study_day).days if next_exam_date else 30
        days_until_exam = max(days_until_exam, 1)  # Ensure at least 1 day to avoid division by zero
        daily_hours = min(study_hours, max(1, round((total_topics * 2) / days_until_exam, 2)))
        plan[subject["name"]] = {
            "total_topics": total_topics,
            "recommended_hours_per_day": daily_hours,
            "schedule": []
        }

        while study_day < (next_exam_date if next_exam_date else study_day + timedelta(days=30)):
            if study_day in exam_dates:
                study_day += timedelta(days=1)
                continue

            schedule = []
            current_hour = hour if study_day == start_datetime.date() else 7  # Start at specified hour on the first day, then 7 AM
            session_id = 0
            for chapter in subject["chapters"]:
                for topic in chapter["topics"]:
                    time_needed = {"hard": 3, "medium": 2, "easy": 1.5}.get(topic["difficulty"], 2)
                    time_allocation = max(1, round(time_needed * (optimized_study_time / study_hours), 1))
                    while time_allocation > 0 and current_hour < 23:
                        if current_hour >= 23 or current_hour < 7:  # Sleep time
                            schedule.append({"time": format_time(current_hour), "activity": "Sleep", "id": session_id})
                            current_hour += 1
                            session_id += 1
                            if current_hour >= 24:  # Move to the next day
                                current_hour = 7
                                study_day += timedelta(days=1)
                                plan[subject["name"]]["schedule"].append({"date": study_day.strftime("%Y-%m-%d"), "sessions": schedule})
                                schedule = []
                        elif any(meal[0] == current_hour for meal in meal_times):
                            schedule.append({"time": format_time(current_hour), "activity": next(meal[1] for meal in meal_times if meal[0] == current_hour), "id": session_id})
                            current_hour += 1
                            session_id += 1
                        elif any(relax[0] == current_hour for relax in relaxation_times):
                            schedule.append({"time": format_time(current_hour), "activity": next(relax[1] for relax in relaxation_times if relax[0] == current_hour), "id": session_id})
                            current_hour += 1
                            session_id += 1
                        elif current_hour >= sleep_time[0] or current_hour < sleep_time[1]:
                            schedule.append({"time": format_time(current_hour), "activity": "Sleep", "id": session_id})
                            session_id += 1
                        else:
                            schedule.append({"time": format_time(current_hour), "study": topic["name"], "id": session_id})
                            time_allocation -= 1
                            current_hour += 1
                            session_id += 1

            plan[subject["name"]]["schedule"].append({"date": study_day.strftime("%Y-%m-%d"), "sessions": schedule})
            study_day += timedelta(days=1)
            hour = 7  # Ensure subsequent days start at 7 AM

    return plan





@app.route("/generate_plan", methods=["POST"])
def generate_plan():
    data = request.json
    user_id = data.get("user")
    if not user_id:
        return jsonify({"message": "User ID is required"}), 400
    try:
        user_id = ObjectId(user_id)
    except:
        return jsonify({"message": "Invalid User ID"}), 400
    subjects = data.get("subjects", [])
    study_hours = data.get("studyHours", 4)
    exam_dates = [datetime.strptime(d, "%Y-%m-%d").date() for d in data.get("examDates", [])]
    
    # Log the received startDateTime
    start_datetime_str = data.get("startDatetime", datetime.now().strftime("%Y-%m-%d %H:%M"))
    print("Received start_datetime:", start_datetime_str)  # Log the received start_datetime
    
    # Parse the start_datetime (handle both formats)
    try:
        # Try parsing with the expected format (YYYY-MM-DDTHH:MM)
        start_datetime = datetime.strptime(start_datetime_str, "%Y-%m-%dT%H:%M")
    except ValueError:
        try:
            # Try parsing with the alternative format (YYYY-MM-DD HH:MM)
            start_datetime = datetime.strptime(start_datetime_str, "%Y-%m-%d %H:%M")
        except ValueError as e:
            return jsonify({"message": f"Invalid start_datetime format: {start_datetime_str}"}), 400
    
    print("Parsed start_datetime:", start_datetime)  # Log the parsed start_datetime
    
    study_plan = generate_smart_study_plan(subjects, study_hours, exam_dates, start_datetime)
    plans_collection.insert_one({"user_id": user_id, "plan": study_plan, "progress": {}})
    return jsonify({"study_plan": study_plan})


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
def extract_syllabus_from_pdf(pdf_file):
    # Read PDF
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()

    # Preprocess the extracted text into structured format
    syllabus = []
    
    # Improved pattern matching for subjects, chapters, and topics
    subject_pattern = r"([A-Za-z\s]+):"  # Match subject headers followed by a colon
    chapter_pattern = r"(Unit\s+[A-Z]+|Chapter\s+[0-9]+):"  # Match chapters by "Unit A" or "Chapter 1"
    topic_pattern = r"([A-Za-z\s\-,\.]+)"  # Match topic names (placeholder regex for topics)
    
    # Identify all subjects
    subjects = re.findall(subject_pattern, text)
    
    # Split chapters and topics into sections
    chapters = re.findall(chapter_pattern, text)
    topics = re.findall(topic_pattern, text)
    
    # Assuming that chapters and topics are sequentially listed after subjects, we will group them
    subject_idx = 0
    chapter_idx = 0
    topic_idx = 0
    
    for subject in subjects:
        subject_data = {
            "subject": subject.strip(),
            "chapters": []
        }
        
        # Extract chapters and topics associated with this subject
        while chapter_idx < len(chapters) and topic_idx < len(topics):
            chapter_data = {
                "chapterTitle": chapters[chapter_idx].strip(),
                "topics": []
            }
            
            # Extract topics for this chapter (assuming each chapter has 5 topics listed)
            for i in range(5):
                if topic_idx < len(topics):
                    chapter_data["topics"].append(topics[topic_idx].strip())
                    topic_idx += 1
                else:
                    break
            
            subject_data["chapters"].append(chapter_data)
            chapter_idx += 1
        
        syllabus.append(subject_data)
    
    return syllabus


def extract_text_from_pdf(pdf_path):
    text = ""
    doc = fitz.open(pdf_path)
    for page in doc:
        text += page.get_text("text")
    return text.strip()

def extract_text_from_scanned_pdf(pdf_path):
    images = convert_from_path(pdf_path)
    text = "\n".join([pytesseract.image_to_string(img) for img in images])
    return text.strip()

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    allowed_extensions = {'pdf', 'png', 'jpg', 'jpeg'}
    if '.' not in file.filename or \
       file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({"error": "Unsupported file type"}), 400

    temp_path = None
    try:
        if file.filename.lower().endswith('.pdf'):
            # Handle PDF using in-memory processing
            syllabus = extract_syllabus_from_pdf(file)
        else:
            # Handle image with proper temp file cleanup
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp:
                file.save(temp.name)
                temp_path = temp.name

            # Open image with context manager to ensure closure
            with Image.open(temp_path) as img:
                text = pytesseract.image_to_string(img)
            syllabus = process_ocr_text(text)

        syllabus_structure = {"syllabus": syllabus}
        result = collection.insert_one(syllabus_structure)
        return jsonify({"message": "Syllabus stored successfully", "id": str(result.inserted_id)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Ensure temp file is deleted after processing
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                app.logger.error(f"Error deleting temp file: {e}")

def process_ocr_text(text):
    # Preprocess text
    text = text.replace('–', '-')  # Convert en-dash to hyphen
    text = re.sub(r'\s+', ' ', text)  # Remove extra whitespace
    
    syllabus = []
    current_subject = None
    current_unit = None
    
    for line in text.split('\n'):
        line = line.strip()
        
        # Detect subject line
        if re.match(r'.*SYLLABUS.*', line, re.IGNORECASE):
            if current_subject:
                syllabus.append(current_subject)
            current_subject = {
                "subject": re.sub(r'\s*-?\s*SYLLABUS\s*', '', line, flags=re.IGNORECASE).title(),
                "units": []
            }
        
        # Detect unit headers
        elif unit_match := re.match(r'(UNIT\s*[IVX]+)\s*(.*)', line, re.IGNORECASE):
            if current_subject:
                current_unit = {
                    "unit_number": unit_match.group(1).upper(),
                    "unit_title": unit_match.group(2).strip().title(),
                    "topics": []
                }
                current_subject["units"].append(current_unit)
        
        # Process topic items
        elif current_unit and '-' in line:
            topics = [t.strip() for t in re.split(r'-\s*', line)]
            for topic in topics:
                if topic and not re.match(r'UNIT\s*[IVX]+', topic, re.IGNORECASE):
                    current_unit["topics"].append({
                        "name": topic.title(),
                        "difficulty": "medium"  # Default value
                    })
    
    if current_subject:
        syllabus.append(current_subject)
    
    return syllabus

@app.route("/schedule", methods=["POST"])
def schedule_study_plan():
    data = request.json
    syllabus_id = data.get("syllabusId")
    syllabus_id = ObjectId(syllabus_id) 
    exam_date = data.get("examDate")
    start_datetime = data.get("startDatetime")
    study_hours = data.get("studyHours", 4)  # Default to 4 hours

    if not syllabus_id or not exam_date or not start_datetime:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        exam_date = datetime.strptime(exam_date, "%Y-%m-%d")
        start_datetime = datetime.strptime(start_datetime.replace("T", " "), "%Y-%m-%d %H:%M")
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    syllabus_data = collection.find_one({"_id": ObjectId(syllabus_id)})
    if not syllabus_data:
        return jsonify({"error": "Syllabus not found"}), 404

    syllabus = syllabus_data["syllabus"]
    
    # Generate study plan using Gemini (pass empty completed_sessions for new plan)
    study_plan = generate_smarts_study_plan(syllabus, study_hours, [exam_date], start_datetime, completed_sessions=[])
    print(f"Study plan to insert: {study_plan}")
    collection.insert_one({"syllabus_id": syllabus_id, "plan": study_plan, "progress": {}})
    return jsonify({"message": "Study plan scheduled successfully!", "studyPlan": study_plan})

@app.route("/get-study-plan/<syllabus_id>", methods=["GET"])
def get_plan(syllabus_id):
    try:
        # Convert to ObjectId if needed
        document = collection.find_one({"syllabus_id": ObjectId(syllabus_id)})
        
        if not document:
            return jsonify({"error": "Study plan not found"}), 404
            
        return jsonify({
            "_id": str(document["_id"]),
            "syllabus_id": str(document["syllabus_id"]),
            "plan": document["plan"],
            "progress": document["progress"]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/adjust-plan', methods=['POST'])
def adjust_study_plan():
    data = request.json
    syllabus_id = data.get('syllabusId')
    completed_sessions = data.get('completedSessions', [])
    metrics = data.get('performanceMetrics', {})

    try:
        # Get current plan
        plan = collection.find_one({"syllabus_id": ObjectId(syllabus_id)})
        if not plan:
            return jsonify({"error": "Plan not found"}), 404

        # Get missed sessions
        all_sessions = [session for day in plan['plan'] for session in day['sessions']]
        missed_sessions = [s for s in all_sessions if s['id'] not in completed_sessions]

        # Redistribute missed sessions
        updated_plan = redistribute_sessions(plan['plan'], missed_sessions, metrics)
        
        # Update database
        collection.update_one(
            {"_id": plan['_id']},
            {"$set": {"plan": updated_plan}}
        )

        return jsonify({"updatedPlan": updated_plan})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def redistribute_sessions(original_plan, missed_sessions, metrics):
    # Implementation of smart redistribution logic
    # This would include:
    # 1. Identifying available time slots
    # 2. Prioritizing missed topics
    # 3. Balancing workload
    # 4. Adding revision sessions
    
    # Example simplified implementation:
    for day in original_plan:
        # Find first available slot each day
        for i, session in enumerate(day['sessions']):
            if session.get('activity') == 'Break':
                # Insert missed session before break
                if missed_sessions:
                    day['sessions'].insert(i, missed_sessions.pop(0))
                    day['sessions'][i]['rescheduled'] = True
                break
    
    # Add extra revision days if behind schedule
    if metrics.get('pending', 0) > metrics.get('completed', 1):
        revision_day = {
            "date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "sessions": [{
                "time": "9:00 AM",
                "topic": "Revision Session",
                "duration": "60 minutes"
            }]
        }
        original_plan.append(revision_day)

    return original_plan

@app.route('/generate-quiz', methods=['POST'])
def handle_quiz_generation():
    topic = request.json.get('topic', '')
    if not topic:
        return jsonify({"error": "Topic is required"}), 400
    
    try:
        quiz_json = generate_quiz(topic)
        quiz_data = json.loads(quiz_json)
        return jsonify({"questions": quiz_data["questions"]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == "__main__":  # Corrected line
    app.run(debug=True)