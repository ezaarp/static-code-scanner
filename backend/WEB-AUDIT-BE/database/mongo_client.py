# database/mongo_client.py
from flask_pymongo import PyMongo

mongo = PyMongo()

def init_app(app):
    mongo.init_app(app)
    try:
        mongo.cx.server_info()
        print("✅ MongoDB connected successfully")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
