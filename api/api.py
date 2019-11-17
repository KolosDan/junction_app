from flask import Flask, request, jsonify
import web_analysis, map_analysis
from flask_cors import CORS, cross_origin
from pymongo import MongoClient
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

app = Flask(__name__)
CORS(app)

null = None

def send_email(from_,to,password,html):
    s = smtplib.SMTP('smtp.gmail.com', 587)
    s.ehlo()
    s.starttls()
    s.login(from_, password)
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "Link"
    msg['From'] = from_
    msg['To'] = to

    msg.attach(MIMEText(html, 'html'))
    s.sendmail(from_, to, msg.as_string())

#POST 
@app.route('/analyze_raw', methods=['POST'])
def analyze_raw():
    try:
        post_data = eval(request.data.decode())

        if post_data['type'] == 'unclassified':
            result = {'result': web_analysis.analyze_unclassified(post_data)}
        elif post_data['type'] == 'search':
            result = {"result": web_analysis.analyze_search(post_data)}
        elif post_data['type'] == 'sn_messages':
            result = {"result": web_analysis.analyze_messages(post_data)}
        elif post_data['type'] == 'sn_feed':
            result = {"result": web_analysis.analyze_posts(post_data)}
        
        return result
    except Exception as e:
        print(e)
        return {'error': str(e)}

#POST: {'map': []}
@app.route('/get_charts', methods=['POST'])
def analyze_map():
    try:
        post_data = list(filter(lambda x: x != None, eval(request.data.decode())['map']))
        
        sessions = map_analysis.to_sessions(post_data, 'unclassified')

        from_ = re.sub(r'\d+:\d+:\d+', '00:00:01', post_data[-1]['timestamp'])
        to_ = re.sub(r'\d+:\d+:\d+', '23:59:59', post_data[-1]['timestamp'])

        stats = map_analysis.get_basic_stats(sessions, from_=from_, to_=to_)

        result = map_analysis.compile_charts(stats)
        
        return {'result': result}
    except Exception as e:
        print(e)
        return {'error': str(e)}

# POST {'map': []}
@app.route('/get_sentiment_charts', methods=['POST'])
def get_sentiment_charts():
    try:
        post_data = list(filter(lambda x: x != None, eval(request.data.decode())['map']))

        from_ = re.sub(r'\d+:\d+:\d+', '00:00:01', post_data[-1]['timestamp'])
        to_ = re.sub(r'\d+:\d+:\d+', '23:59:59', post_data[-1]['timestamp'])

        stats = map_analysis.sentiment_stats(post_data, from_=from_, to_=to_)

        result = map_analysis.compile_sentiment_charts(stats, 30)

        print('COMPILED SENTIMENT TIMESERIES')

        return {'result': result}
    except Exception as e:
        print(e)
        return {'error': str(e)}

# POST {'map': []}
@app.route('/get_recommendations', methods=['POST'])
def get_recommendations():
    try:
        print('STARTED RECOMMENDATIONS')
        post_data = list(filter(lambda x: x != None, eval(request.data.decode())['map']))
        from_ = re.sub(r'\d+:\d+:\d+', '00:00:01', post_data[-1]['timestamp'])
        to_ = re.sub(r'\d+:\d+:\d+', '23:59:59', post_data[-1]['timestamp'])

        stats = map_analysis.check_triggers(post_data, from_=from_, to_=to_)
        return {'result': map_analysis.compile_recommendations(stats)}
    except Exception as e:
        print(e)
        return {'error': str(e)}

@app.route('/request_email', methods=['POST'])
def request_email():
    send_email("kolodaio@gmail.com","kolodaio@gmail.com", "02468tyman",request.data.decode() )
    return "200"
app.run(host='0.0.0.0')