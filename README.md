# TOLNet
Plot View

YAML file is intended for a Anaconda env build on a Linux OS

conda env create -f TOLNetInteractive.yml

Python Flask script as well as Index.html and supporting files (js, css) and Test Data are in the TOLNetScripts folder

When ProcessHDF.py is run, it creates a Flask server.


For real world deployment, getFileList() function (plotPlot.js line 536) will need to be altered to get a list from the hash table
currently it interogates the directory on the server.

populatePage() (plotPlot.js line 560) will need to be altered (line 567) to call the Flask Server for Data "\GetData" with filename as a query "?filename= ..."   instead of pulling the filename of the json directly.

ProcessHDF.py will need to be altered to work with hashfile names from the table

When you change the scripts to use the hashed file names, the getButtonText() function in plotPlot.js (line 610) might need to be changed. It uses the list of files to name the Dataset Nav buttons.

****** UPDATES *******
JSON formats for datasets has been altered to be Profile centric rather than datapoint centric.
[{DATETIME.START: variable, DATETIME.STOP: variable, PROFILE: [{ALTITUDE: variable, O3.Mix.....},{...},...]},{...},...]

this reduces the space occupied by the dataset, as there are no longer repeat DATETIME.START/STOP values.

localUtilities2.py has been altered to update the JSON format.

plotPlot2.js has updates for plotting with new JSON format, as well as changing the heatmaps to plot by Profile, rather than by drawing rectangles for every datapoint. 
This speeds up the plotting significantly, and allows the browser to handle larger datasets.

   ******** DRAWBACKS ***********
   NO LONGER ABLE TO MOUSE OVER DATA POINTS AND VIEW PRECISE MEASUREMENTS







