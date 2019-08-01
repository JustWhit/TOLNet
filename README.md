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






