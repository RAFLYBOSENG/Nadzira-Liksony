from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wedding.db'
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)