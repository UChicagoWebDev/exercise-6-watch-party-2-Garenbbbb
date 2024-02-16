import string
import random
from datetime import datetime
import sqlite3
from flask import Flask, g, jsonify, request
from functools import wraps

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/watchparty.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None

def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' + 
        'values (?, ?, ?) returning id, name, password, api_key',
        (name, password, api_key),
        one=True)
    return u

# TODO: If your app sends users to any other routes, include them here.
#       (This should not be necessary).
@app.route('/')
@app.route('/profile')
@app.route('/login')
@app.route('/room')
@app.route('/room/<chat_id>')
def index(chat_id=None):
    return app.send_static_file('index.html')

@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('404.html'), 404



# -------------------------------- API ROUTES ----------------------------------

# TODO: Create the API

@app.route('/api/signup', methods=['POST'])
def signup():
    new_usr = new_user()
    print(new_user)
    if new_usr:
        return jsonify({
            "password": new_usr["password"],
            "user_name": new_usr["name"],
            "user_id": new_usr["id"],
            "api_key": new_usr["api_key"]
        }), 200
    else:
        return jsonify({"error": "Failed User Creation"}), 500
      
@app.route('/api/login', methods = ['POST'])
def login():
    
    if not request.json:
        return jsonify({"error": "Need Username or Password"}), 400
    username, password = request.json.get('username'),request.json.get('password')
    print(username, password)

    user_info = query_db("SELECT * FROM users WHERE name = ? AND password = ?", (username, password), one=True)
    print(user_info)
    if user_info:
        return jsonify({
            "success": True,
            "user_name": user_info["name"],
            "user_id": user_info["id"],
            "password": user_info["password"],
            "api_key": user_info["api_key"]
        }), 200

    return jsonify({"success": False, "error": "Login Failed"}), 500


@app.route('/api/update_username', methods=['POST'])
def update_username():
    try:
        user_id = request.json.get('uid')
        new_username = request.json.get('new_username')
        query = "UPDATE users SET name = ? WHERE id = ?"
        parameters = (new_username, user_id)
        conn = get_db() 
        cursor = conn.cursor()
        cursor.execute(query, parameters)
        conn.commit()
        conn.close()

        return jsonify({'success': True,'message': 'Username updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/updatePassword', methods = ['POST'])
def updatePassword():
    try:
        user_id = request.json.get('uid')
        new_pass = request.json.get('new_password')

        print(new_pass)
        print(user_id)
        query = "UPDATE users SET password = ? WHERE id = ?"
        parameters = (new_pass, user_id)
        conn = get_db() 
        cursor = conn.cursor()
        cursor.execute(query, parameters)
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Password updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/room/<int:room_id>/update_name', methods=['POST'])
def update_room_name(room_id):

    try:
        new_name = request.get_json().get('new_name')
        query = "UPDATE rooms SET name = ? WHERE id = ?"
        parameters = (new_name, room_id)
        conn = get_db() 
        cursor = conn.cursor()
        cursor.execute(query, parameters)
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Name updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/rooms/<int:room_id>',methods=['GET'])
def room(room_id):
    room = query_db('SELECT * FROM rooms WHERE id = ?', [room_id], one=True)
    if room:
        return jsonify(dict(room)), 200
    else:
        return jsonify({"success": False, "message": "Room not found"}), 404


@app.route('/api/room/createroom', methods = ['POST'])
def createRoom():
    try:
        new_room = query_db('INSERT INTO rooms (name) VALUES (?) RETURNING id, name',
            [ request.get_json().get('room_name')], one=True)
        return jsonify({"success": True, "room": dict(new_room)}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/room/showrooms', methods = ['GET'])
def showRoom():
    rooms = query_db('SELECT * FROM rooms', args=(), one=False)
    if rooms:
        return jsonify([{"id": room["id"], "name": room["name"]} for room in rooms]), 200
    else:
        return jsonify({"success": False, "message": "No rooms found"}), 404


@app.route('/api/rooms/<int:room_id>/messages', methods=['GET'])
def get_messages(room_id):
    try:
        query = "SELECT messages.id, users.name, messages.room_id, messages.body FROM messages INNER JOIN users ON messages.user_id = users.id WHERE messages.room_id = ?"
        messages = query_db(query, (room_id,), one=False)
        messages_list = []
        if not messages:
            return messages_list

        for message in messages:
            message_dict = {
                'id': message[0],
                'user_name': message[1],
                'room_id': message[2],
                'body': message[3]
            }
            messages_list.append(message_dict)

        return jsonify(messages_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/rooms/<int:room_id>/messages/post', methods=['POST'])
def post_message(room_id):
    try:
        body = request.json.get('body')
        user_id = request.json.get('uid')
        if not body:
            return jsonify({'error': 'Message body cannot be empty'}), 400

        query = "INSERT INTO messages (user_id, room_id, body) VALUES (?, ?, ?)"
        parameters = (user_id, room_id, body)
        conn = get_db() 
        cursor = conn.cursor()
        cursor.execute(query, parameters)
        conn.commit()
        conn.close()

        return jsonify({'message': 'Message posted successfully'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
app.run(host='0.0.0.0', port=5000, debug=True)