from flask import Flask, send_from_directory, render_template, jsonify, request
from pymongo import MongoClient
from config import MONGODB_URI, DATABASE_NAME
import json
import os

app = Flask(__name__, static_folder='.', template_folder='.')
# Đặt static_folder='.' để Flask có thể phục vụ files từ thư mục gốc

# Kết nối MongoDB
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]

# Khởi tạo collection
properties_collection = db['properties']

# Hàm để import dữ liệu từ file JSON vào MongoDB
def import_data_to_mongodb():
    data_file = os.path.join('data', 'data.json')
    if os.path.exists(data_file):
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            properties_collection.insert_many(data)

# Import dữ liệu khi khởi động ứng dụng
import_data_to_mongodb()

@app.route('/')
def index():
    return render_template('map.html')

@app.route('/index.html')
def serve_index():
    return render_template('index.html')

@app.route('/login.html')
def serve_login():
    return render_template('login.html')

@app.route('/map.html')
def serve_map():
    return render_template('map.html')

@app.route('/api/search', methods=['GET'])
def search_properties():
    query = request.args.get('q', '')
    if query:
        # Tìm kiếm trong MongoDB
        results = list(properties_collection.find({
            "$or": [
                {"address": {"$regex": query, "$options": "i"}},
                {"district": {"$regex": query, "$options": "i"}},
                {"ward": {"$regex": query, "$options": "i"}}
            ]
        }))
        # Chuyển đổi ObjectId thành string
        for result in results:
            result['_id'] = str(result['_id'])
        return jsonify(results)
    return jsonify([])

# Route để phục vụ các files tĩnh từ thư mục assets
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('assets', filename)

# Route để phục vụ các files tĩnh từ thư mục data
@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

# Route để phục vụ các files tĩnh khác
@app.route('/<path:filename>')
def serve_static(filename):
    try:
        return send_from_directory('.', filename)
    except:
        # Log lỗi hoặc xử lý ngoại lệ
        return "File not found", 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)