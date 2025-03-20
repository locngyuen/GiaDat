from flask import Flask, send_from_directory, render_template

app = Flask(__name__, static_folder='.', template_folder='.')
# Đặt static_folder='.' để Flask có thể phục vụ files từ thư mục gốc

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