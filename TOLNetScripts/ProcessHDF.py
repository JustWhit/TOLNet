#####################################
## AUTHOR: Justin Whitlock         ##
## justin.allen.whitlock@gmail.com ##
## July 2019                       ##
#####################################

import os
import json
from flask import Flask, jsonify, status, abort
from localUtilities import *

app = Flask(__name__)
@app.route("/getDATA")
def getDATA():
	
	
	# requests should include the associated filename in format http://host/getDATA?filepath='somefilepath'
	FILENAME = request.args.get('filepath')
	
	if FILENAME.endswith('.hdf'):
		data = formatHDFData(FILENAME)
	elif FILENAME.endswith('.dat'):
		data = formatDATdata(FILENAME)
	else:
		content = {'Error' : 'Requested file has neither the \'.hdf\' nor the \'.dat\' file extension'}
		return content, status.HTTP_400_BAD_REQUEST
	
	return jsonify(data)


if __name__ == '__main__':
	port = int(os.environ.get('PORT',5000))
	app.run(host = '0.0.0.0', port = port)
	# app.run()