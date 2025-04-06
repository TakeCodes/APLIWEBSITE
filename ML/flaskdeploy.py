from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import os

app = Flask(__name__)

# Load the model
model = joblib.load("job_title_predictor_enhanced.joblib")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        queried_salary = data.get("Queried_Salary", "")
        skill = data.get("Skill", "")
        no_of_skills = data.get("No_of_Skills", 0)

        input_df = pd.DataFrame([{
            "Queried_Salary": queried_salary,
            "Skill": skill,
            "No_of_Skills": no_of_skills
        }])

        prediction = model.predict(input_df)[0]

        return jsonify({"prediction": prediction})
    
    except Exception as e:
        return jsonify({"prediction": "Unable to determine accurately — default prediction: Data Analyst"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
