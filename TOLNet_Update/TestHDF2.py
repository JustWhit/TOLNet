#####################################
## AUTHOR: Justin Whitlock         ##
## justin.allen.whitlock@gmail.com ##
## July 2019                       ##
#####################################
# THIS FILE IS INTENDED TO BE A TEST FILE FOR THE FUNCTIONS IN localUtilities.py BEFORE USING THEM IN ProcessHDF.py
#

import os
import json
from localUtilities2 import *

# # Open File.
# FILENAME = 'Data/groundbased_lidar.o3_uah001_huntsville.al_20180904t175830z_20180904t190354z_001.hdf'
# #FILENAME = request.args.get('filepath')
# hdf = SD(FILENAME, SDC.READ)

# #List available SDS Datasets
# for key in hdf.datasets():
# 	print (key)
# print('\n')
# print(hdf.select('DATETIME.START')[:])

# Open File.
#FILENAME = 'Data/groundbased_lidar.o3_nasa.jpl003_table.mountain.ca_20190610t044545z_20190610t070057z_002.hdf'
#FILENAME = request.args.get('filepath')

DIR= 'Data2/'

for FILENAME in [f for f in os.listdir(DIR) if f.endswith('.hdf') or f.endswith('.dat')]:
	FILENAME = os.path.join(DIR, FILENAME)
	if FILENAME.endswith('.hdf'):
		profile = formatHDFData(FILENAME)
	else:
		profile = formatDATdata(FILENAME)

	out = FILENAME + '.json'
	with open(out,'w') as json_file:
		json.dump(profile, json_file)
