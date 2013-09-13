
var glusterNodes = new Array();
var keyAdded = new Array();
var keyFailed = new Array();


function fade(elementName,state) {
	
	// Give state a default to disable the element
	var state = state || 'disable'
	
	// Toggle the fade attribute of the given element
	
	if (document.getElementById(elementName).className == 'fade') {
		document.getElementById(elementName).className ='';
	}
	else {
		document.getElementById(elementName).className ='fade'
		
		if (state == "disable") {
			disableDiv(elementName)
		}
	}
}

function disableDiv(divName) {
	// Disable the div first
	document.getElementById(divName).disabled = true;
	
	// now loop through the other elements in the div and disable them 
	var nodes = document.getElementById(divName).getElementsByTagName('*');
	for(var i = 0; i < nodes.length; i++) {
		nodes[i].disabled = true;
	}
}

function validateKey() {
	var userKey = document.getElementById('password').value ;
	
	/* if (userKey != accessKey) {
		// user suppled invalid password, so indicate the error
		document.getElementById('password').value = '';
		document.getElementById('password').className = 'error';
		document.getElementById('password').focus()
	}
	else {
	*/
	
		document.getElementById('password').className = '';
		fade('access');
		disableDiv('access');
		

		
		// Enable the next button and slide the overview page into view
		document.getElementById('overview').className = 'slide';
		document.getElementById('overviewNext').disabled = false;
		document.getElementById('m-overview').className='active';
	// }
}

function slide(oldDiv, newDiv) {

	document.getElementById(newDiv).className = 'slide';
	var oldTask = 'm-' + oldDiv
	var newTask = 'm-' + newDiv
	document.getElementById(oldTask).className = 'pending';
	document.getElementById(newTask).className = 'active';
	disableDiv(oldDiv);
	
}
function showBusy(msg) {
	
	var msg = msg || '';
	document.getElementById('busyMsg').innerHTML = msg;
	if (document.getElementById('busy').style.visibility == 'visible') {
		document.getElementById('busy').style.visibility = 'hidden';
	}
	else {
		document.getElementById('busy').style.visibility = 'visible';
	}
	
}

function subnetSetup(req) {
	
	// request returns a string containing subnets separated by spaces
	// split this into an array and update the pulldown
	subnetString =req.responseText;
	subnet = subnetString.split(" "); 
	
	dropdown = document.getElementById("network-select");
	
	// If we have subnets to select, populate the pulldown and enable the 
	// button
	if (subnet.length > 0) {
		
		for (var n=0; n<subnet.length; ++n) {
			dropdown[dropdown.length] = new Option(subnet[n]);
		}
		
		document.getElementById('network-scan-btn').disabled = false;
	}
}

function startNodesPage() {
	// drop the access/password layer right back out of the way
	document.getElementById('access').style.zIndex=-99;

	// call ajax to get list of networks available
	xml_http_post('../www/main.html','subnetList', subnetSetup);
	
	slide("overview","nodes") ;
}

function nodeSelect(req) {
	// display the nodes discovered
	
	// turn off the showbusy spinner
	showBusy();
	
	//document.getElementById('network-scan-btn').disabled = false;
	document.getElementById('nodeSelect').className = 'show';
	
	var nodes = req.responseText;
	nodeList = nodes.split(" ");
	candidate = document.getElementById('candidateNodes') ;
	selected = document.getElementById('selectedNodes') ;
	if (nodeList.length > 0) {
		for (var n=0; n<nodeList.length; ++n) {
			
			// if the node name has a '*' suffix place it in the selected box, 

			if (nodeList[n].indexOf('*') != -1) {
				
				// add node to the selected box
				selected[selected.length] = new Option(nodeList[n]);
				//selected.options[selected.length].disabled = true;
			}
			else {
				//this host is not the host we're running on so add to candidate box
				candidate[candidate.length] = new Option(nodeList[n]);
			}
		}
	}
	
}

function scanSubnet() {
	// grab the current value from the pulldown list
	// ajax call 'findNodes'
	targetSubnet = document.getElementById('network-select').value;
	document.getElementById('network-select').disabled=true;
	document.getElementById('network-scan-btn').disabled = true;
	showBusy('Scanning ' + targetSubnet);
	callerString = "findNodes|" + targetSubnet;
	xml_http_post('../www/main.html', callerString, nodeSelect);
}

function enableButton(buttonName) {

	document.getElementById(buttonName).disabled = false;
}

function promoteNodes() {
	
	// move the nodes from candidate to selected nodes
	var candidate = document.getElementById('candidateNodes');
	var selected = document.getElementById('selectedNodes');
	
	// Copy the selected items over to the selected box
	for (var n = 0; n < candidate.options.length; n++) {
		if (candidate.options[n].selected == true) {
			selected[selected.length] = new Option(candidate.options[n].value);
		}
	}	
	
	// remove the items copied from the candidate box (must be done bottom up!)
	for (var n=candidate.options.length-1; n >=0; n--) {
		if (candidate.options[n].selected == true) {
			candidate.remove(n);
		}
	}
	
	// enable the create cluster button
	document.getElementById('createCluster').disabled = false;	
	
	// if the select nodes box is empty, disable the add nodes button
	if (candidate.options.length == 0) {
		document.getElementById('addNodes').disabled=true;
	}
}

function startKeyMgmt() {
	showBusy();
	
	// populate the div with the nodes
	
	// alert('these are the nodes to act upon' + glusterNodes.join());
	
	keysTable = document.getElementById("keysTable");
	
	for (var n=0; n<glusterNodes.length; n++) {
		thisNode = glusterNodes[n];
		// need to add code to define a class for the row to highlight
		var newRow = keysTable.insertRow(-1);
		var col1 = newRow.insertCell(0);
		var col2 = newRow.insertCell(1);
		col1.innerHTML=thisNode;
		boxName = thisNode + "-pswd"
		inputBox = '<input type="text" id="' + boxName + '" disabled size="16">'
		col2.innerHTML=inputBox;
		
	}
	
	
	slide('nodes','keys');
	
	document.getElementById('busyButton').style.visibility = 'hidden';
	document.getElementById('busyGraphic').className = 'spinner';
	
}


function clusterHandler(req) {
	// Handle the response from creating a cluster
	// turn off show busy
	// showBusy(); // turn show busy off
	
	// [0] = success, [1] failed
	var respData = req.responseText.split(' ');

	var failed = parseInt(respData[1]);

	document.getElementById('busyMsg').innerHTML = "Cluster created<br>" +
													"Successful: " + respData[0] + " Failures: " + respData[1];
	if (failed > 0) {
		document.getElementById('busyGraphic').className = 'error';
		// change the spinner to a warning sign
		alert('Problems creating the cluster\nPlease Investigate');
	}
	else {
		document.getElementById('busyGraphic').className = 'success';
		// change the spinner to a green tick
																										
		document.getElementById('busyButton').disabled = false;
		document.getElementById('busyButton').style.visibility = 'visible';
		document.getElementById('busyButton').onclick = function() { startKeyMgmt();};
		document.getElementById('selectedNodes').disabled = true;
		

		
		
	}
		

	//document.getElementById('keysNext').style.visibility = 'visible';
	//document.getElementById('keysNext').disabled = false;


}

function createCluster() {

	// disable the candidate and selected boxes
	document.getElementById('addNodes').disabled = true;
	document.getElementById('createCluster').disabled = true;
	document.getElementById('candidateNodes').disabled = true;
	selected = document.getElementById('selectedNodes');

	
	var nodesString = "";
	var nodeCount = 0;
	
	for (var n = 0 ; n < selected.options.length; n++) {
		thisNode = selected.options[n].value; 
		if (thisNode.indexOf("*") == -1) {
			nodesString = nodesString + thisNode + " ";
			glusterNodes.push(thisNode)
			nodeCount +=1;
		}
	}

	showBusy('Adding ' + nodeCount + ' nodes') ;	
	
	callerString = 'createCluster|' + nodesString.trim() ;

	// pass back to python to execute peer probe
	xml_http_post('../www/main.html', callerString, clusterHandler);

		
}


function boxesHidden(state) {
	
	for (var n=0; n<glusterNodes.length; n++) {
		thisNode = glusterNodes[n];
		elementName = thisNode + '-pswd';
		document.getElementById(elementName).disabled = state;
	}	
}

function togglePassword(passwordType) {
	
	if (passwordType == 'generic') {
		document.getElementById('genericPassword').style.visibility = 'visible';
		boxesHidden(true);
	}
	else {
		document.getElementById('genericPassword').style.visibility = 'hidden';
		// show the password boxes
		boxesHidden(false);
	}

}

function keyResponse() {
	// receive a nodename and a response - success or fail
	// if good, then add this node to the keyAdded array
	//	else add to the keyFailed array
	
	// check size of the keyAdded + keyFailed array - 
	// 		if it matches the size of the glusterNodes array - we're done
	//			update the spinner indicating success/failure
	//			update the text
	//			activate button if all successful
}


function pushKeys() {
	// if generic password selected - ensure the password field is not blank
	
	// validate the password 
	
	passwordType = document.querySelector('input[name="passwordMethod"]:checked').value;
	
	if (passwordType == 'generic') {
		if (document.getElementById('genericPassword').value.length == 0) {
			document.getElementById('genericPassword').className = 'error';
		}
		else { // user selected generic password and provided a password
			
		}
	}
	else { // each node in the table must have a password provided
		passwordsOK = true;
		for (var n=0; n<glusterNodes.length; n++) {
			boxName = glusterNodes[n] + '-pswd';
			thisPassword = document.getElementById(boxName).value;
			if (thisPassword.length == 0) {
				document.getElementById(boxName).className = 'error';
				passwordsOK = false;
			}
			else {
				document.getElementById(boxName).className = '';
			}
			
		}
		
		
	}
		
	// if unique is selected - ensure each row has a password
	
	
	// if passwords are ready
	// 	disable all boxes and button
	// 	enable showbusy and set a message indicating the key distribution has started
	//	for each node
	// 		send request to webserver - nodename/password and establish handler

	
}
