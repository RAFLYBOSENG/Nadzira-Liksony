from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

# Kredensial admin
ADMIN_CREDENTIALS = {
    'Admin@admin.com': '$%12QwaszX#!!'
}

# Pastikan folder instance ada untuk menyimpan SQLite DB
os.makedirs(app.instance_path, exist_ok=True)

# Gunakan path absolut di dalam folder instance
db_path = os.path.join(app.instance_path, 'wedding.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Model untuk RSVP
class RSVP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    attendance = db.Column(db.Boolean, nullable=False)
    number_of_guests = db.Column(db.Integer, default=1)
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Model untuk Ucapan
class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    likes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Model untuk Amplop Digital
class Gift(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Model untuk Protokol Kesehatan
class HealthScreening(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    temperature = db.Column(db.Float, nullable=False)
    symptoms = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Route untuk halaman utama
@app.route('/')
def home():
    return render_template('index.html')

# Route Dashboard (dengan proteksi login)
@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# Route untuk login admin
@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    if email in ADMIN_CREDENTIALS and ADMIN_CREDENTIALS[email] == password:
        session['admin_logged_in'] = True
        session['admin_email'] = email
        return jsonify({'status': 'success'})
    return jsonify({'status': 'error', 'message': 'Email atau password salah'}), 401

@app.route('/admin/logout')
def admin_logout():
    session.clear()
    return jsonify({'status': 'success'})

@app.route('/admin/status')
def admin_status():
    return jsonify({
        'logged_in': bool(session.get('admin_logged_in')),
        'email': session.get('admin_email')
    }), (200 if session.get('admin_logged_in') else 401)

# Route untuk RSVP
@app.route('/rsvp', methods=['POST'])
def rsvp():
    data = request.json
    rsvp = RSVP(
        name=data['name'],
        attendance=data['attendance'],
        number_of_guests=data.get('number_of_guests', 1),
        message=data.get('message', '')
    )
    db.session.add(rsvp)
    db.session.commit()
    return jsonify({'status': 'success'})

# Route untuk Ucapan
@app.route('/comment', methods=['POST'])
def comment():
    data = request.json
    comment = Comment(
        name=data['name'],
        message=data['message']
    )
    db.session.add(comment)
    db.session.commit()
    return jsonify({'status': 'success'})

# Route untuk Like Ucapan
@app.route('/comment/<int:id>/like', methods=['POST'])
def like_comment(id):
    comment = Comment.query.get_or_404(id)
    comment.likes += 1
    db.session.commit()
    return jsonify({'status': 'success', 'likes': comment.likes})

# Route untuk Edit Ucapan (Admin only)
@app.route('/comment/<int:id>/edit', methods=['PUT'])
def edit_comment(id):
    if not session.get('admin_logged_in'):
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    comment = Comment.query.get_or_404(id)
    comment.message = data.get('message', comment.message)
    db.session.commit()
    return jsonify({'status': 'success'})

# Route untuk Hapus Ucapan (Admin only)
@app.route('/comment/<int:id>/delete', methods=['DELETE'])
def delete_comment(id):
    if not session.get('admin_logged_in'):
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    
    comment = Comment.query.get_or_404(id)
    db.session.delete(comment)
    db.session.commit()
    return jsonify({'status': 'success'})

# Route untuk Amplop Digital
@app.route('/gift', methods=['POST'])
def gift():
    data = request.json
    gift = Gift(
        name=data['name'],
        amount=data['amount'],
        message=data.get('message', '')
    )
    db.session.add(gift)
    db.session.commit()
    return jsonify({'status': 'success'})

# Route untuk Protokol Kesehatan
@app.route('/health-screening', methods=['POST'])
def health_screening():
    data = request.json
    screening = HealthScreening(
        name=data['name'],
        temperature=data['temperature'],
        symptoms=data.get('symptoms', '')
    )
    db.session.add(screening)
    db.session.commit()
    return jsonify({'status': 'success'})

# Route untuk mendapatkan data RSVP
@app.route('/rsvp/list')
def rsvp_list():
    rsvps = RSVP.query.all()
    return jsonify([{
        'name': rsvp.name,
        'attendance': rsvp.attendance,
        'number_of_guests': rsvp.number_of_guests,
        'message': rsvp.message,
        'created_at': rsvp.created_at.isoformat()
    } for rsvp in rsvps])

# Route untuk mendapatkan data Ucapan
@app.route('/comment/list')
def comment_list():
    comments = Comment.query.order_by(Comment.created_at.desc()).all()
    return jsonify([{
        'id': comment.id,
        'name': comment.name,
        'message': comment.message,
        'likes': comment.likes,
        'created_at': comment.created_at.isoformat()
    } for comment in comments])

# Inisialisasi DB saat import (berlaku untuk gunicorn dan dev server)
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)