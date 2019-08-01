// updated July 2019 BY JUSTIN WHITLOCK
/////////////////////////////////////////////////////////////////////
// real world deployment, read comments in function populatePage() //
/////////////////////////////////////////////////////////////////////

$(function(){


	listingfilepath = 'Data/';
	/// for getting data from the Python Flask Route
	datafilepath = '/getDATA';

	datasets = [];
	var datasetpicker;

	var checkBox;
	
	modal = document.getElementById("inModal");
	span = document.getElementById("close");
	modalOverlay = document.getElementById("modal-overlay")

	span.onclick = function(){
		modal.style.display = "none";
		modalOverlay.style.display="none";

	};

	window.onclick = function(event){
		if (event.target == modalOverlay){
			modal.style.display = "none";
			modalOverlay.style.display="none";
		}
	};


	/////////////////////////////////////////////////////////////////////////////////////////////////////
	//MAIN PLOT FUNCTION, GETS CALLED ON INITAL LOAD WITH FIRST FILE IN THE DATASET[] LIST, CALLED AGAIN ON DATASET BUTTON CLICK
	var Plot = ( function(window, d3, filename){

		// variables that are same regardless of plot
		var  data, data2, numProfiles=0, breakpoint = 400, type;
		// profile specific variables
		var psvg, px, py, pxAxis, pyAxis, pdim
			, pplotWrapper, pline, ppath, pmargin = {}
			, pwidth, pheight, ptooltip, bars; 
		// variables for curtain plot
		var colors, colorScale, colorPos, csvg, cx, cy, cxAxis, cyAxis, cdim
			, cplotWrapper, cmargin = {}
			, cwidth, cheight, ctooltip, cards, legendAxis, legendScale, legendWrapper, colorPnt, gradient;

		

		d3.json(filename, init);
		
		/////////////////////////////////////////////////////////////////////////////////////////////////////
		// INITIALIZES SVG AND OTHER ATTRIBUTES FOR THE PLOT
		function init(error, json){
			data = json;




			if(error){
				console.log('There was an error in the JSON call');
			}
			console.log('data called');

			console.log(data);

			var flags = [], l = data.length, i;
			var start = new Date();
			var end = new Date("January 1, 1970");

			for ( i=0; i<l ; i++){
				if(flags[data[i]["DATETIME.START"]]) continue;

				flags[data[i]["DATETIME.START"]] = true;
				tempS = new Date(data[i]["DATETIME.START"]);
				tempE = new Date(data[i]["DATETIME.STOP"]);

				if(tempS < start){ start = tempS;}
				if(tempE > end){ end = tempE}

				numProfiles +=1;
			}

			console.log("Number of Profiles: " + numProfiles);

			if(numProfiles > 1){
				// type is used to set the aspect ratio of the chart depending on curtain or profile
				type = 1;
				initCurtain('#plot',data);
				//render chart
				render();
				
			}
			else{
				// type is used to set the aspect ratio of the chart depending on curtain or profile
				type = 0;
				initProfile('#plot',data);
				//render chart
				render();

			}
			
		}
		//////////////////////////////////////////////////////////////////////////////////////////////////////
		// THIS FUNCTION  MAKES THE DIMENSIONS OF THE SVG FLEXIBLE BASED ON SCREEN DIMENSIONS
		function render(){

			// TODO: ADD FUNCTIONALITY FOR CURTAIN PLOTS

			//get dimensions based on window size
			updateDimensions(window.innerWidth, window.innerHeight);


			// IF OF TYPE CURTAIN (MULTIPLE PROFILES)
			if(type){
				//update x and y scales
				cx.range([0, cwidth]);
				cy.range([cheight, 0]);

				//update svg elements to new dimensions
				csvg
					.attr('width', cwidth + cmargin.left + cmargin.right)
					.attr('height', cheight + cmargin.top + cmargin.bottom);
					//.attr('viewBox', "0 0 100 100");
				cplotWrapper.attr('transform', 'translate(' + cmargin.left + ',' + cmargin.top + ')');

				//update axis and line

				cxAxis.scale(cx).tickFormat(d3.time.format('%H:%M'));
				cyAxis.scale(cy);

				csvg.select('.x.axis')
					.attr('transform', 'translate(0,' + cheight + ')')
					.call(cxAxis);
				csvg.select('.y.axis')
					.call(cyAxis);

				cards = csvg.selectAll(".profile")
					.data(data, function(d){return d.ALTITUDE + ':' + d["DATETIME.START"]; });


				cards.enter().append("rect")
					.attr("x", function(d){ return cx(str2jsDate(d["DATETIME.START"])) + cmargin.left + 1; })
					.attr("y", function(d){ return cy(d.ALTITUDE) + cmargin.top - 3; })
					.attr("class", "profile unbordered")
					.attr("width", function(d){ return cx(str2jsDate(d["DATETIME.STOP"])) - cx(str2jsDate(d["DATETIME.START"])); })
					.attr("height",Math.ceil(cheight/(data.length/numProfiles)))
					.attr("fill", function(d){ return colorScale(d["O3.MIXING.RATIO.VOLUME_DERIVED"]); })

				
				cards.append("title").text(function(d){return "O3MR: " + d["O3.MIXING.RATIO.VOLUME_DERIVED"] + " Alt: "+d.ALTITUDE ; });
				cards.on('click', function(d,i){
					modalOverlay.style.display = "block";
					modal.style.display = "block";
					inModalPlot(d["DATETIME.START"]);
				});
				// SET RECTANGLE MOUSEOVER FUNCTION
				cards.on({'mouseover':function(d){d3.select(this).style("cursor","pointer"); }, "mouseout": function(d){d3.select(this).style("cursor","default");}});

				cards.exit().remove();

				csvg.append("text")
						.attr("text-anchor", "middle")
						.attr("transform", "translate("+ ((cwidth+cmargin.left+cmargin.right)/2) + "," + (cheight + (1.5* cmargin.bottom)) + ")")
						.style("font-size", "16px")
						.style("fill", "#6f7e8e")
						.text("Time [UTC]");

				csvg.append("text")
						.attr("text-anchor", "right")
						.attr("transform", "translate("+ ((cwidth+cmargin.left)) + "," + (cheight + (1.5* cmargin.bottom)) + ")")
						.style("font-size", "16px")
						.style("fill", "#6f7e8e")
						.text("[ppbv]");

				csvg.append("text")
					.attr("text-anchor", "middle")
					.attr("transform", "translate(" + (cmargin.left/4) + "," + ((cheight+cmargin.bottom+cmargin.top)/2) + ")rotate(-90)")
					.style("font-size", "16px")
					.style("fill", "#6f7e8e")
					.text("Altitude [m]");

				csvg.append("text")
					.attr("text-anchor", "middle")
					.attr("transform", "translate(" + ((cwidth+cmargin.left+cmargin.right)/2) + "," + (cmargin.top-50) + ")")
					.style("font-size", "16px")
					.style("fill", "#6f7e8e")
					.text( moment(cxExtent[0], "YYYY-MM-DD,HH:mm:ss").format("D MMM YYYY HH:mm")+'z - '+ moment(cxExtent[1], "YYYY-MM-DD,HH:mm:ss").format("HH:mm") + "z\u2007\u2007 Profiles: " + numProfiles);

				csvg.append("text")
					.attr("text-anchor", "middle")
					.attr("transform", "translate(" + ((cwidth+cmargin.left+cmargin.right)/2) + "," + (cmargin.top-15) + ")")
					.style("font-size", "16px")
					.style("fill", "#6f7e8e")
					.text("O3 Mixing Ratio [ppbv]");
				//////////////////////////////////////////////////////
				// CREATE THE COLOR BAR
				addColorBar();
				//////////////////////////////////////////////////////
				// This creates a copy of the full data set. In the Curtain plot, datapoints are clickable, generting a profile plot
				// In order to reuse plot functionality, the "data" variable gets replaced with the profile data.
				data2=data;
				data=[];
			}// else render for profile
			else{
				//update x and y scales
				px.range([0, pwidth]);
				py.range([pheight, 0]);

				//update svg elements to new dimensions
				psvg
					.attr('width', pwidth + pmargin.left + pmargin.right)
					.attr('height', pheight + pmargin.top + pmargin.bottom);
					//.attr('viewBox', "0 0 100 100");
				pplotWrapper.attr('transform', 'translate(' + pmargin.left + ',' + pmargin.top + ')');

				//update axis and line

				pxAxis.scale(px);
				pyAxis.scale(py);

				psvg.select('.x.axis')
					.attr('transform', 'translate(0,' + pheight + ')')
					.call(pxAxis);
				psvg.select('.y.axis')
					.call(pyAxis);
				// SET VERTICAL GRID LINES ON X-TICKS
				psvg.selectAll("g.x.axis g.tick")
	            	.append("line") 
	                .classed("grid-line", true)
	                .attr("x1", 0)
	                .attr("y1", 0)
	                .attr("x2", 0)
	                .attr("y2", -(pheight));
	                //.style();
	            // SET HRIZONTAL GRID LINES ON Y-TICKS
	            psvg.selectAll("g.y.axis g.tick")
	            	.append("line")
	                .classed("grid-line", true)
	                .attr("x1", 0)
	                .attr("y1", 0)
	                .attr("x2", pwidth) 
	                .attr("y2", 0);

	            ppath = pplotWrapper.append('path').datum(data).classed('line',true);
				ppath.attr('d', pline);
				ppath.append("text").text(function(d){return "O3 MR: " + d["O3.MIXING.RATIO.VOLUME_DERIVED"];});

				psvg.append("text")
						.attr("text-anchor", "middle")
						.attr("transform", "translate("+ ((pwidth+pmargin.left+pmargin.right)/2) + "," + (pheight + (1.5* pmargin.bottom)) + ")")
						.style("font-size", "16px")
						.style("fill", "#6f7e8e")
						.text("O3 Mixing Ratio [ppbv]");

				psvg.append("text")
					.attr("text-anchor", "middle")
					.attr("transform", "translate(" + (pmargin.left/4) + "," + ((pheight+pmargin.bottom+pmargin.top)/2) + ")rotate(-90)")
					.style("font-size", "16px")
					.style("fill", "#6f7e8e")
					.text("Altitude [m]");

				psvg.append("text")
					.attr("text-anchor", "middle")
					.attr("transform", "translate(" + ((pwidth+pmargin.left+pmargin.right)/2) + "," + (.5 * pmargin.top) + ")")
					.style("font-size", "16px")
					.style("fill", "#6f7e8e")
					.text(moment(data[0]["DATETIME.START"], "YYYY-MM-DD,HH:mm:ss").format("D MMM YYYY HH:mm")+'z - '+ moment(data[0]["DATETIME.STOP"], "YYYY-MM-DD,HH:mm:ss").format("HH:mm") + "z\u2007\u2007 Profiles: 1" );

				addErrorBars();
			}

		}
		////////////////////////////////////////////////////////////////////////////////////////////////
		// UPDATES DIMENSIONS ON LOAD AND RELOAD
		function updateDimensions(winWidth, winHeight){
			
			
			
			if(type){
				cmargin.top =  winHeight < breakpoint ? 80 : .15 * winHeight;
				cmargin.right =  winWidth < breakpoint ? 80 : .05 * winWidth;
				cmargin.left =  winWidth < breakpoint ? 80 : .05 * winWidth;
				cmargin.bottom =  winHeight < breakpoint ? 80 : .15 * winHeight;
				cwidth = winWidth - cmargin.left - cmargin.right - 400;
				cheight = Math.min.apply(Math,[winWidth * (2/3), winHeight - cmargin.top - cmargin.bottom]);
				
			}
			else{
				pmargin.top =  winHeight < breakpoint ? 80 : .15 * winHeight;
				pmargin.right =  winWidth < breakpoint ? 80 : .05 * winWidth;
				pmargin.left =  winWidth < breakpoint ? 80 : .05 * winWidth;
				pmargin.bottom =  winHeight < breakpoint ? 80 : .15 * winHeight;
				pheight = winHeight - pmargin.top - pmargin.bottom;
				pwidth = Math.min.apply(Math, [(winHeight)*(2/3), winWidth - pmargin.left - pmargin.right-400]);
				
			}

			
		}
		////////////////////////////////////////////////////////////////////////////////////////////////
		function initProfile(div){
			//initialize scales
			pxExtent = d3.extent(data, function(d,i){return d["O3.MIXING.RATIO.VOLUME_DERIVED"]});
			pyExtent = d3.extent(data, function(d,i){return d.ALTITUDE});

			//console.log("xExtent: " + xExtent);
			//console.log("yExtent: " + yExtent);

			px = d3.scale.linear().domain(pxExtent);
			py = d3.scale.linear().domain(pyExtent);

			//initialize axis
			pxAxis = d3.svg.axis().orient('bottom');
			pyAxis = d3.svg.axis().orient('left');



			// path generator for the plot
			pline = d3.svg.line()
				.x( function(d){return px(d["O3.MIXING.RATIO.VOLUME_DERIVED"]) })
				.y( function(d){return py(d.ALTITUDE) });

			// initialize svg
			psvg = d3.select(div).append('svg');
			pplotWrapper = psvg.append('g');
			pplotWrapper.append('g').classed('x axis', true);
			pplotWrapper.append('g').classed('y axis', true);

			 
			/*plotWrapper.append("svg.title")
				.text(function(d){return "Alt: "+d.y + "\n o3 Mix: " + d.x;});*/

		}
		////////////////////////////////////////////////////////////////////////////////////////////////"#bcc0f0","#8aa1df","#6b9ed8","#4a93c9","#502424", "#3a7a7c" ,"#468d84"
		// IF NUMPROFILES IS GREATER THAN 1, PLOT CURTAIN PLOT
		function initCurtain(div){


			colors = ["#ffffff","#e5e3f9","#97ebd0","#43aec5","#8d8d46","#762a2a","#3c2630","#30212e","#0a0a25"];
			colorPos = [ 0,15,30,45,60,80,100,500,1000];

			/*colors = 
				["#ffffff","#fdfcf3","#e5e3f9","#bcc0f0","#97abd0"
				,"#97bbd0","#97cbd0","#97dbd0","#97ebd0","#6aebb4"
				,"#68dac7","#00cbb7","#43aec5","#2a6769","#3a5254"
				,"#5a3e3e","#5a3434","#762a2a","#3c2630"
				,"#30212e","#221928","#0a0a25","#000000"];
			colorPos = 
				[  0,  4,  8, 12, 16
				, 20, 24, 28, 32, 36
				, 40, 44, 48, 52, 56
				, 60, 68, 76, 94,102
				,200,500,1000];*/
			//colors = ["#fdfcf3","ff8cff", "dd6ff2", "bb52e5", "9935d8", "7718cb", "0000bb", "002ccc", "0058dd", "0084ee", "00afff", "00ebff"
			//	, "27ffd7", "63ff9b", "a3ff5b", "d3ff2b", "ffff00", "ffcf00", "ff9f00", "ff6f00", "ff3f00", "ff0000", "d8000f"
			//	, "b2001f", "8c002f", "66003f", "343434", "606060", "8c8c8c", "b8b8b8", "e4e4e4"];
			//colorPos=[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,125,175,250,500,1000];

			colorScale = d3.scale.linear().domain(colorPos)
				.range(colors);

			// X EXTENT IS BASED ON BOTH START TIME AND STOP TIME
			cxExtent = d3.extent(function(darray, names){
				var values = [];
				darray.forEach(function(d){
					names.forEach(function(n){
						values = values.concat(str2jsDate(d[n]));
					});
				});
				return values;
			}(data, ["DATETIME.START","DATETIME.STOP"]));
			cyExtent = d3.extent(data, function(d,i){return d.ALTITUDE;});

			console.log("cxExtent: " + cxExtent);

			cx = d3.time.scale.utc().domain(cxExtent);
			cy = d3.scale.linear().domain(cyExtent);

			//initialize axis
			cxAxis = d3.svg.axis().orient('bottom');
			cyAxis = d3.svg.axis().orient('left');

			csvg = d3.select(div).append('svg');
			cplotWrapper = csvg.append('g');
			cplotWrapper.append('g').classed('x axis', true);
			cplotWrapper.append('g').classed('y axis', true);


		}

		function addErrorBars(){
			var opacity = checkBox.checked ? 1 : 0;

			bars = psvg.append("g").selectAll("line")
				.data(data).enter()
				.append("line")
				.attr("class","error-line")
				.attr("x1", function(d){
					return px(d["O3.MIXING.RATIO.VOLUME_DERIVED"] - d["O3.MIXING.RATIO.VOLUME_DERIVED_UNCERTAINTY.COMBINED.STANDARD"]) + pmargin.left + 1;
				})
				.attr("y1", function(d){
					return py(d.ALTITUDE) + pmargin.top + 1;
				})
				.attr("x2", function(d){
					return px(d["O3.MIXING.RATIO.VOLUME_DERIVED"] + d["O3.MIXING.RATIO.VOLUME_DERIVED_UNCERTAINTY.COMBINED.STANDARD"]) + pmargin.left + 1;
				})
				.attr("y2", function(d){
					return py(d.ALTITUDE) + pmargin.top + 1;
				})
				.style("opacity", opacity);
			//bars.append("title").text(function(d){return "Error: " + d["O3.MIXING.RATIO.VOLUME_DERIVED_UNCERTAINTY.COMBINED.STANDARD"] + "[ppbv]";} );

			psvg.append("g").selectAll("line")
				.data(data).enter()
				.append("line")
				.attr("class","error-cap")
				.attr("x1", function(d){
					return px(d["O3.MIXING.RATIO.VOLUME_DERIVED"] + d["O3.MIXING.RATIO.VOLUME_DERIVED_UNCERTAINTY.COMBINED.STANDARD"]) + pmargin.left + 1;
				})
				.attr("y1", function(d){
					return py(d.ALTITUDE)-4 + pmargin.top + 1;
				})
				.attr("x2", function(d){
					return px(d["O3.MIXING.RATIO.VOLUME_DERIVED"] + d["O3.MIXING.RATIO.VOLUME_DERIVED_UNCERTAINTY.COMBINED.STANDARD"]) + pmargin.left + 1;
				})
				.attr("y2", function(d){
					return py(d.ALTITUDE) + 4 + pmargin.top + 1;
				})
				.style("opacity", opacity);

			psvg.append("g").selectAll("line")
				.data(data).enter()
				.append("line")
				.attr("class","error-cap")
				.attr("x1", function(d){
					return px(d["O3.MIXING.RATIO.VOLUME_DERIVED"] - d["O3.MIXING.RATIO.VOLUME_DERIVED_UNCERTAINTY.COMBINED.STANDARD"]) + pmargin.left + 1;
				})
				.attr("y1", function(d){
					return py(d.ALTITUDE)-4 + pmargin.top + 1;
				})
				.attr("x2", function(d){
					return px(d["O3.MIXING.RATIO.VOLUME_DERIVED"] - d["O3.MIXING.RATIO.VOLUME_DERIVED_UNCERTAINTY.COMBINED.STANDARD"]) + pmargin.left + 1;
				})
				.attr("y2", function(d){
					return py(d.ALTITUDE) + 4 + pmargin.top + 1;
				})
				.style("opacity", opacity);
		}


		function addColorBar(){
			legendWrapper = csvg.append("g")
					.attr("class", "legendWrapper")
					.attr("transform", "translate("+(cmargin.left + cwidth + (cmargin.right/5)) + "," +((cmargin.top)) + ")");

				gradient = legendWrapper.append("defs")
					.append("linearGradient")
					.attr("id","legend")
					.attr("x1",'0%').attr('y1','100%')
					.attr('x2','0%').attr('y2','0%')
					.attr('spreadMethod','pad');

				yTickSpacing= cheight/(colors.length - 1);
				

				cprange = [];
				for(var i = 0; i < colorPos.length; i++){
					cprange[i]= i * yTickSpacing;
					gradient.append('stop')
						.attr('offset',cprange[i]/cheight)
						.attr('stop-color', colors[i] );
				}

			

				legendWrapper.append('rect')
					.attr('x1',0)
					.attr('y1', 0)
					.attr('width', 10)
					.attr('height', cheight)
					.style('fill','url(#legend)');
					//.style('stroke','url(#legend)');

				legendScale = d3.scale.linear()
					.domain(colorPos)
					.range(cprange.reverse());

				console.log("Cheight: " + cheight);
				console.log(cprange);

				legendAxis = d3.svg.axis()
					.scale(legendScale)
					.orient('right')
					.tickValues(colorPos);

				legendWrapper.append("g")
					.attr("class", "legend axis")
					.attr("transform", "translate(" + (10) + ", 0)")
					.call(legendAxis);
		}

		var inModalPlot = function(startTime){
			var modaldiv = document.getElementById('modal-plot');
			while(modaldiv.firstChild){
				modaldiv.removeChild(modaldiv.firstChild);
			}
			data = [];
			data2.forEach(function(d,i){
				if(d["DATETIME.START"]== startTime){
					data.push(d);
				}
			});
			console.log("data");
			console.log(data);
			// set type of new plot to Profile
			type = 0;
			initProfile('#modal-plot');
			render();

			return {render : render};

		}


		return { render : render };

	});

	
	////////////////////////////////////////////////////////////////////////////////////////////////
	//pulls file list from given directory
	function getFileList(){
		
		try {
				// THIS FUNCTION PULLS ALL JSON FILES FROM THE GIVEN DIRECTORY. THIS WILL NEED TO BE ALTERED FOR THE FILE SCHEME USED ON THE NEW SERVER
				// I BELIEVE YOU GUYS ARE HASHING THE FILE PATHS?
				$.get(listingfilepath, function(d){
						$(d).find("a:contains(.json)").each( function(){
							temp = $(this).attr("href");
							console.log("found file: " + listingfilepath + temp);
							datasets.push(listingfilepath + temp);
							} ); 
						populatePage();
					}
					);  
						
			
		} catch (e){
			console.log(e);
			throw e;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Initial call to populate the page. Initiates plot and side navigation buttons called dataset-picker
	function populatePage(){

		datasets.sort((a,b) => (getDate(a)<getDate(b) ? 1 : -1));
		console.log(datasets);
		

		// SWAP COMMENT FOR THIS LINE FOR REALWORLD DEPLOYMENT
		filename = datasets[0];
		//filename = datafilepath + "?filename=" + datasets[0];
		Plot(window, d3, filename);
		

		datasetpicker = d3.select("#dataset-picker").selectAll(".dataset-button")
			.data(datasets);
		datasetpicker.enter()
			.append("input")
			.attr("value", function(d){ return getButtonText(d);})
			.attr("type", "button")
			.attr("class", "dataset-button")
			.on("click", function(d){
				var maindiv = document.getElementById('plot');
				while(maindiv.firstChild){
					maindiv.removeChild(maindiv.firstChild);
				}
				// SWAP COMMENT FOR THIS LINE FOR REALWORLD DEPLOYMENT
				fname = d;
				// fname = datafilepath + "?filename=" + d;
				Plot(window, d3, fname);
			});
		checkBox = document.getElementById("Box");
		console.log("setting checkbox");
		///////////// CHECKBOX CHANGE LISTENER, CHANGES OPACITY OF ERROR BARS
		$('#Box').change(function(){
			console.log("checkbox Toggled");
			var errorBars = document.getElementsByClassName(".error-line");
			var errorCaps = document.getElementsByClassName(".error-cap");
			var opacity = this.checked ? 1 : 0;
		
			for(var i =0; i< errorBars.length; i++){
				errorBars[i].style("opacity", opacity);
			}
			for(var i =0; i< errorCaps.length; i++){
				errorCaps[i].style("opacity", opacity);
			}
		});

	}

	////////////////////////////////////////////////////////////////////////////////////////////////
	// parses filename for date and time range for button values
	function getButtonText(filename){
		
		if (filename.includes(".hdf")) {
			const splits = filename.split("_");
			const DATE1 = splits[splits.length-3];
			const DATE2 = splits[splits.length-2];
			return moment(DATE1, "YYYYMMDDtHHmmssz").format("D MMM YYYY HH:mm") + 'z - ' + moment(DATE2, "YYYYMMDDtHHmmssz").format("HH:mm") + 'z';
		}
		else if (filename.includes(".dat")) {
			const splits = filename.split("_");
			const DATE1 = splits[2];
			return moment(DATE1, "YYYYMMDD").format("D MMM YYYY");
		}
		else {
			return "Unknown filename format"
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// used for sorting the list of files
	function getDate(filename){

		if (filename.includes(".hdf")) {
			const splits = filename.split("_");
			return new Date(moment(splits[splits.length-3],"YYYYMMDDtHHmmssz").format("D MMM YYYY"));
		}
		else if (filename.includes(".dat")) {
			const splits = filename.split("_");
			return new Date(moment(splits[2], "YYYYMMDD").format("D MMM YYYY"));
		}
	}


	////////////////////////////////////////////////////////////////////////////////////////////////
	// converts the date ISO string to javascript Date Object
	var timeFormat = d3.time.format('%Y-%m-%d,%H:%M:%S');
	function str2jsDate(timestamp){
		//return new Date(moment(timestamp, "YYYY-MM-DD,HH:mm:ss").format("YYYY-MM-DDTHH:mm:ss") + "Z");
		return timeFormat.parse(timestamp);
		
	}



	

	////////////////////////////////////////////////////////////////////////////////////////////////
	// STARTS EVERYTHING OFF
	getFileList();


});







