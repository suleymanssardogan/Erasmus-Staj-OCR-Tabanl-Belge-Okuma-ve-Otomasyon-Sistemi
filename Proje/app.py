
#Sunucu kurmak için Flask
#request gelen HTTP isteklerini (POST, GET, PUT, DELETE) yönetmek için
#jsonify JSON formtaında HTTP cevabı haline getirir 
# secure_filename Kullanıcının yüklediği dosya adını güvenli hâle getirir (örneğin boşlukları siler, özel karakterleri kaldırır).

"""from flask import Flask,request,jsonify,render_template 
import os 
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = "Uploads"

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
@app.route('/')
def home():
    return 'OCR Otomasyon Sistemi Başarıyla Çalışıyor!'

@app.route("/")
def index():
    return render_template("index.html")
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
    app.run(debug=True)"""

from flask import Flask, request, jsonify, render_template
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# Upload klasörünü oluştur
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Dosya uzantısının izin verilen türde olup olmadığını kontrol eder"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def index():
    """Ana sayfa"""
    return render_template("index.html")
@app.route("/test")
def test():
    return "Flask çalışıyor!"

@app.route("/api/ocr", methods=["POST"])
def upload_file():
    """Dosya yükleme"""
    try:
        # Dosya varlığını kontrol et
        if "file" not in request.files:
            return jsonify({
                "success": False, 
                "error": "Dosya alanı eksik"
            }), 400
        
        file = request.files["file"]
        
        # Dosya adı kontrolü
        if file.filename == "":
            return jsonify({
                "success": False,
                "error": "Dosya seçilmedi"
            }), 400
        
        # Dosya uzantısı kontrolü
        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "error": "Desteklenmeyen dosya formatı. İzin verilen formatlar: PNG, JPG, JPEG, GIF, BMP, TIFF, PDF"
            }), 400
        
        # Dosyayı kaydet
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        return jsonify({
            "success": True,
            "message": "Dosya başarıyla yüklendi",
            "filename": filename,
            "extracted_text": "OCR özelliği henüz eklenmedi. Dosya başarıyla yüklendi.",
            "file_size": 45
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Sunucu hatası: {str(e)}"
        }), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    """Sistem sağlık kontrolü"""
    return jsonify({
        "status": "healthy",
        "message": "OCR Sistemi çalışıyor",
        "upload_folder": UPLOAD_FOLDER,
        "allowed_extensions": list(ALLOWED_EXTENSIONS)
    }), 200

@app.errorhandler(413)
def too_large(e):
    """Dosya boyutu çok büyük hatası"""
    return jsonify({
        "success": False,
        "error": "Dosya boyutu çok büyük. Maksimum 16MB"
    }), 413

@app.errorhandler(404)
def not_found(e):
    """Sayfa bulunamadı hatası"""
    return jsonify({
        "success": False,
        "error": "Endpoint bulunamadı"
    }), 404

if __name__ == '__main__':
    print("🚀 OCR Belge Sistemi başlatılıyor...")
    print(f"📁 Upload klasörü: {UPLOAD_FOLDER}")
    print(f"📋 Desteklenen formatlar: {', '.join(ALLOWED_EXTENSIONS)}")
    app.run(debug=True)