from flask import Flask,request,jsonify 
import os 
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = "Uploads"

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

#Enpoint to upload a file
@app.route("/api/ocr",methods=["POST"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"success":False, "error":"Dosya alanı eksik"}), 400
    file = request.files["file"]

    if file.filename == "":
        return jsonify({"success":False,"error":"Dosya adı boş"}),400
    
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)


    return jsonify({"success":True,"message":"Dosya başarıyla yüklendi", "filename": filename}), 200

if __name__ == '__main__':
    app.run(debug=True)