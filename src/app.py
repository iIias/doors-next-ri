# Copyright IBM Corp. 2025
from flask import Flask, request, render_template,jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from prompt import requirementQuery
load_dotenv()
app = Flask(__name__,static_url_path='/',static_folder='../public')
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
CORS(app)
app.config.from_object(__name__)
@app.route('/config')
def getConfig():
    print('in config')
    config = {
        'integrationID':os.getenv('WXA_integrationID'),
        'region':os.getenv('WXA_region'),
        'serviceInstanceID':os.getenv('WXA_serviceInstanceID'),

    }
    return jsonify(config)

@app.route('/queryrequirement', methods=['POST'])
def post_query_requirement():
    query = request.json['query']
    requirements = request.json['requirements']
    answer = requirementQuery(query, requirements)
    return jsonify({'answer': answer})



if __name__ == '__main__':
    app.run(ssl_context=('dng-ri.crt', 'dng-ri.key'),port=8443,host='0.0.0.0')