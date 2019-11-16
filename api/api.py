from flask import Flask, request, jsonify
import web_analysis
from flask_cors import CORS, cross_origin
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

#POST 
@app.route('/analyze_raw', methods=['POST'])
def analyze_raw():
    try:
        post_data = eval(request.data.decode())
        print("data: ")
        print(post_data['type'])

        if post_data['type'] == 'unclassified':
            result = {'result': web_analysis.analyze_unclassified(post_data)}
        elif post_data['type'] == 'search':
            result = {"result": web_analysis.analyze_search(post_data)}
        elif post_data['type'] == 'sn_message':
            result = {"result": web_analysis.analyze_messages(post_data)}
        elif post_data['type'] == 'sn_feed':
            result = {"result": web_analysis.analyze_posts(post_data)}
        
        db = MongoClient().junction_app
        db.samples.insert_one(result)

        del result['_id']
        
        return result
    except Exception as e:
        print(e)
        return {'error': str(e)}

#POST: array inside map
@app.route('/analyze_map', methods=['POST'])
def analyze_map():
    try:
        post_data = eval(request.data.decode())
        print(post_data)
    except Exception as e:
        print(e)
        return {'error': str(e)}

app.run(host='0.0.0.0', ssl_context='adhoc')