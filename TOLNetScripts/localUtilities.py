#####################################
## AUTHOR: Justin Whitlock         ##
## justin.allen.whitlock@gmail.com ##
## July 2019                       ##
#####################################

from pyhdf.SD import SD, SDC
import regex as re


# CONVERTS A MILLISECOND DATE SINCE 2000 INTO ISO FORMAT STRING
def getDateString(dateInMilli):
	days = dateInMilli
	year = days//365
	leapdays = year//4 # CALCULATE NUMBER OF LEAPYEARS OCCURRED SINCE 2000

	days -= leapdays
	year = (days-1)//365 # RECALC YEAR AFTER LEAPDAYS REMOVED, SOLVES ENDCASE ERROR FOR END OF YEAR

	days -= (year * 365) # SUBTRACT CURRENT YEAR FROM TOTAL TO GET CURRENT DAY OF YEAR

	days_in_month = [31,28,31,30,31,30,31,31,30,31,30,31]
	if (year % 4 == 0): # ADD DAY TO FEBRUARY FOR LEAPYEAR CASE
		days_in_month[1] += 1

	month = 1; #START MONTH AT JANUARY

	for numdays in days_in_month:
		if(days - numdays < 1): #IF NEGATIVE, THEN  WE ARE STILL IN CURRENT MONTH NUMBER
			break;
		else:                  # OTHERWISE SUBTRACT DAYS IN MONTH FROM DAYS IN YEAR AND LOOK AT THE NEXT MONTH
			days -= numdays
			month += 1

	day = days//1 # ROUND DAY OF MONTH FROM DAYS IN YEAR

	days -= day  # SUBTRACT DAY IN MONTH FROM DAYS IN YEAR WHICH IS NOW DOWN TO HOURS::MINS::SECS
	seconds = days * 24 * 3600
	hour = seconds//3600
	seconds -= hour * 3600
	minute = seconds // 60
	seconds -= minute * 60
	second = seconds//1

	year += 2000 # ADDS 2000 TO THE BASELINE YEAR

	#print("{:.0f}-{:02.0f}-{:02.0f},{:02.0f}:{:02.0f}:{:02.0f}".format(year,month,day,hour,minute,second))

	return "{:.0f}-{:02.0f}-{:02.0f},{:02.0f}:{:02.0f}:{:02.0f}".format(year,month,day,hour,minute,second)

##########################################################################################################################	
# PULLS DATE FROM LINE AND REMOVES SURPLUS SPACE SO DATE MATCHES HDF FORMAT IN function getDateString()
def getDateFromDat(line):
	
	nums = [int(n) for n in re.findall(r'[0-9]+', line)] # RETURNS A LIST OF INTEGERS EXTRACTED FROM LINE

	return "{:.0f}-{:02.0f}-{:02.0f},{:02.0f}:{:02.0f}:{:02.0f}".format(nums[0],nums[1],nums[2],nums[3],nums[4],nums[5])


##########################################################################################################################	


# READS AN HDF FILE AND FORMATS IT INTO A LIST OF DICTIONARIES CONTAINING KEY:VALUE TUPLES. EACH DICTIONARY REPRESENTS A SINGLE DATA POINT 
def formatHDFData(FILENAME):
	# READS HDF FILE AND CREATES HDF OBJECT
	hdf = SD(FILENAME, SDC.READ)
	#THIS WILL TEMPORARILY STORE THE DATA EXTRACTED FROM HDF 
	Data = {}
	KEYS = ['DATETIME.START','DATETIME.STOP','ALTITUDE','PRESSURE_INDEPENDENT','O3.NUMBER.DENSITY_ABSORPTION.DIFFERENTIAL','O3.MIXING.RATIO.VOLUME_DERIVED', 'O3.MIXING.RATIO.VOLUME_DERIVED_UNCERTAINTY.COMBINED.STANDARD']
	#EXTRACTS DATA FROM HDF OBJECT
	for key in KEYS:
		Data[key] = hdf.select(key)[:].tolist()

	Data[KEYS[0]] = getDateString(Data[KEYS[0]][0])
	Data[KEYS[1]] = getDateString(Data[KEYS[1]][0])
	# THE DATAPOINTS ARE TAKEN FROM DATA AND STORED AS A LIST OF DICTIONARIES IN PROFILE. Remove lines for extra data to save space
	profile = []
	for at,pi,nd,mr,err in zip(Data[KEYS[2]],Data[KEYS[3]],Data[KEYS[4]],Data[KEYS[5]],Data[KEYS[6]]):
		# Any negative values can be considered missing data points and are not saved
		if not any(n<0 for n in [at,pi,nd,mr]):
			profile.append({
				KEYS[0]:Data[KEYS[0]]
				, KEYS[1]:Data[KEYS[1]]
				, KEYS[2]:float('{:.1f}'.format(at//1)) # rounded altitude
				#, KEYS[3]:float(pi) 							# Pressure
				#, KEYS[4]:float('{:.3f}'.format(nd))    # O3 Number Density
				, KEYS[5]:float('{:.2f}'.format(mr *1000)) # O3 Mixing Ratio
				, KEYS[6]:float('{:.4f}'.format(err))
				})

	return profile

##########################################################################################################################	

# FORMATS .DAT FILES INTO A LIST OF DICTIONARIES CONTAINING KEY:VALUE TUPLES. EACH DICTIONARY REPRESENTS A SINGLE DATA POINT
def formatDATdata(FILENAME):

	profile = []
	# READ DAT FILE INTO LIST OF ROWS, WITH THE CARRIAGE RETURN STRIPPED OFF
	dat = [line.rstrip() for line in open(FILENAME)]

	# KEYS FOR THE DICTIONARY
	KEYS = ['DATETIME.START','DATETIME.STOP','ALTITUDE','PRESSURE_INDEPENDENT','O3.NUMBER.DENSITY_ABSORPTION.DIFFERENTIAL','O3.MIXING.RATIO.VOLUME_DERIVED', 'O3.MIXING.RATIO.VOLUME_DERIVED_UNCERTAINTY.COMBINED.STANDARD']

	ngh = int(dat[0][:dat[0].find(' ')]) # number of general header lines after 1
	nprof = int(dat[2][:dat[2].find(' ')]) # number of profiles in document
	ncol = int(dat[3][:dat[3].find(' ')]) # number of data columns in each profile
	ngc = int(dat[ngh+1][:dat[ngh+1].find(' ')]) # number of general comment lines
	MDV = dat[ngh][:dat[ngh].find(', ')] #missing data value indicator
	currIndex = ngh + ngc + 2

	for i in range(nprof):
		nph = int(dat[currIndex + 1][:dat[currIndex+1].find(' ')]) # number of profile header lines after this
		ndp = int(dat[currIndex + 2][:dat[currIndex+2].find(' ')]) # number data points (rows) in this profile
		
		START = getDateFromDat(dat[currIndex + 6]) # start time for this profile
		STOP = getDateFromDat(dat[currIndex + 7]) # stop time for this profile

		currIndex += nph + 2

		for line in [ row for row in dat[currIndex:currIndex + ndp] if not MDV in row]: # ANY ROWS CONTAINING MISSING VALUES ARE REMOVED.
			# ANY SPACES ARE REMOVED, THEN THE LINE IS SPLIT ON COMMAS
			temp = line.replace(' ','').split(',')
			# LINE IS ADDED AS A SINGLE DATA POINT WITH FEATURES IN KEY:VALUE TUPLES USING THE SAME KEYS AS HDF. 
			# THIS MAKES IT SIMPLER TO PARSE FROM THE JSON IN JS
			profile.append({
				KEYS[0]:START
				, KEYS[1]:STOP
				, KEYS[2]:float('{:.1f}'.format(float(temp[0])//1)) # rounded altitude
				#, KEYS[3]:float(temp[8]) # air pressure
				#, KEYS[4]:float('{:.3f}'.format(float(temp[1]))) # o3 number density
				, KEYS[5]:float('{:.2f}'.format(float(temp[6]))) # o3 mixing ratio
				, KEYS[6]:float('{:.4f}'.format(float(temp[7]))) # o3 mixing ration Uncertainty combined standard
				})
		currIndex += ndp 

	return profile
		







