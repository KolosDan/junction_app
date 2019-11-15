from flask import Flask, request
import web_analysis

app = Flask(__name__)

#POST 
@app.route('/analyze_raw', methods=['POST'])
def analyze_raw():
    try:
        post_data = eval(request.data.decode())
        print(post_data['type'])
        
        if post_data['type'] == 'unclassified':
            return {"result": web_analysis.analyze_unclassified(post_data)}
        elif post_data['type'] == 'search':
            return {"result": web_analysis.analyze_search(post_data)}
        elif post_data['type'] == 'sn_message':
            return {"result": web_analysis.analyze_messages(post_data)}
        elif post_data['type'] == 'sn_feed':
            return {"result": web_analysis.analyze_posts(post_data)}
    except Exception as e:
        print(e)
        return {'error': str(e)}

app.run(host='0.0.0.0', ssl_context='adhoc')