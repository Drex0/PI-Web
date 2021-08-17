const myURL = 'http://localhost:80/pis';
const myPiURL = 'http://localhost:80';
const socket = io();

function piReboot(name) {
  fetch(myURL, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({name: name, action: 'reboot'})
    })
    .then(r =>  r.json().then(data => ({status: r.status, body: data})))
    .then(obj => {
    //.then(obj => console.log(obj.body.message));
    //.then(obj => console.log(obj.status));
    switch(obj.status){
        case 201:
          showSnackbar(obj.body.message);
          break
        case 400:      
          showSnackbar('Error '+ obj.status)    
          console.log('this is a client (probably invalid JSON) error, but also might be a server error (bad JSON parsing/validation)')          
          break
        case 500:
          showSnackbar(obj.body.message);
          break
        default:
          console.log('unhandled');
          break
      }
    })
    .catch(err => {
      console.error(err)
    });
}

function piReload(name) {
  fetch(myURL, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({name: name, action: 'reload'})
    })
    .then(r =>  r.json().then(data => ({status: r.status, body: data})))
    .then(obj => {
    //.then(obj => console.log(obj.body.message));
    //.then(obj => console.log(obj.status));
    switch(obj.status){
        case 201:
          showSnackbar(obj.body.message);
          break
        case 400:      
          showSnackbar('Error '+ obj.status)    
          console.log('this is a client (probably invalid JSON) error, but also might be a server error (bad JSON parsing/validation)')          
          break
        case 500:
          showSnackbar(obj.body.message);
          break
        default:
          console.log('unhandled');
          break
      }
    })
    .catch(err => {
      console.error(err)
    });
}

function piRename(name) {
  var element = document.getElementById(name+"newName");
  var newName = element.value;

  if(newName != ""){
    fetch(myURL, {
        method: 'post',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({name: name, action: 'rename', newname: newName})
      })
      .then(r =>  r.json().then(data => ({status: r.status, body: data})))
      .then(obj => {
      //.then(obj => console.log(obj.body.message));
      //.then(obj => console.log(obj.status));
      switch(obj.status){
          case 201:
            showSnackbar(obj.body.message);
            break
          case 400:      
            showSnackbar('Error '+ obj.status)    
            console.log('this is a client (probably invalid JSON) error, but also might be a server error (bad JSON parsing/validation)')          
            break
          case 500:
            showSnackbar(obj.body.message);
            break
          default:
            console.log('unhandled');
            break
        }
      })
      .catch(err => {
        console.error(err)
      });
    
    element.value = "";
  }
  else{
    element.classList.add("noInput");
  }
}

// Need to incorporate a function to handle all json responses similar to below
// this function is not used yet
function fetchHandler(response) {
  if (response.ok) {
      return response.json().then(json => {
          // the status was ok and there is a json body
          return Promise.resolve({json: json, response: response});
      }).catch(err => {
          // the status was ok but there is no json body
          return Promise.resolve({response: response});
      });

  } else {
      return response.json().catch(err => {
          // the status was not ok and there is no json body
          throw new Error(response.statusText);
      }).then(json => {
          // the status was not ok but there is a json body
          throw new Error(json.error.message); // example error message returned by a REST API
      });
  }
}

/**
 * Adds a istener for specific tags for elements that may not yet
 * exist.
 * @param scope a reference to an element to look for elements in (i.e. document)
 * @param selector the selector in form [tag].[class] (i.e. a.someBtn)
 * @param event and event (i.e. click)
 * @param funct a function reference to execute on an event
 */
function addLiveListener(scope, selector, event, funct) {
  /**
   * Set up interval to check for new items that do not 
   * have listeners yet. This will execute every 1/10 second and
   * apply listeners to 
   */
  setInterval(function() {
    var selectorParts = selector.split('.');
    var tag = selectorParts.shift();
    var className;
    if (selectorParts.length)
      className = selectorParts.shift();

    if (tag != "") {
      tag = tag.toUpperCase();
      var elements = scope.getElementsByTagName(tag);
    } else
      var elements = scope.getElementsByClassName(className);

    for (var i = 0; i < elements.length; i++) {
      if (elements[i][event + '_processed'] === undefined && (tag == "" || elements[i].tagName == tag)) {
        elements[i].addEventListener(event, funct);
      }
    }
  }, 1000);
}

// Adds a dynamic listener to any input.sometext class so I can remove the noInput on click 
addLiveListener(document, "input.sometext", "click", function() {
  this.classList.remove("noInput");
});

// Snackbar 
function showSnackbar(text) {
  var x = document.getElementById("snackbar");
  x.innerText = text;
  x.className = "show";
  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

// Receive pi array and render it
socket.on('piInfo', data => {
  // render the pi data
  //console.log('received data= ', data);
  var pis = document.getElementById("pis");  

  if(pis.innerHTML == ""){

    for(var i = 0; i < data.length; i++) {
      // list
      var list = document.createElement('li');
      list.classList.add("piitem", "list-group-item", "d-flex", "align-items-start", "justify-content-around");
      list.setAttribute("id", data[i].name);

      // info column
      var info = document.createElement('div');
      info.classList.add("col-md-3");

      var piName = document.createElement('h4');
      piName.classList.add("piNameText");
      piName.innerText = data[i].name;

      var piIp = document.createElement('div');
      piIp.classList.add("descriptionText");
      piIp.innerText = data[i].ip;

      var piMac = document.createElement('div');
      piMac.classList.add("descriptionText");
      piMac.innerText = data[i].mac;

      info.appendChild(piName);
      info.appendChild(piIp);
      info.appendChild(piMac);

      // status column
      var status = document.createElement('div');
      status.classList.add("status");
      
      var ifOnline = document.createElement('span');
      ifOnline.setAttribute("id", data[i].name+"status");
      ifOnline.innerText = data[i].lastCheckIn;
      if(data[i].online){
        ifOnline.classList.add("badge", "badge-success");

      }else {
        ifOnline.classList.add("badge", "badge-danger");
      }
      status.appendChild(ifOnline);

      // control column
      var control = document.createElement('div');
      control.classList.add("form-inline");

      var btn1 = document.createElement('button');
      btn1.classList.add("btn", "btn-outline-info", "btn-sm");
      btn1.setAttribute("name", data[i].name);
      btn1.setAttribute("onclick", "piReload(this.name)");
      btn1.innerText = "Update Slides";

      var btn2 = document.createElement('button');
      btn2.classList.add("btn", "btn-outline-danger", "btn-sm");
      btn2.setAttribute("name", data[i].name);
      btn2.setAttribute("onclick", "piReboot(this.name)");
      btn2.innerText = "Reboot";

      var btn3 = document.createElement('button');
      btn3.classList.add("btn", "btn-outline-secondary", "btn-sm");
      btn3.setAttribute("name", data[i].name);
      btn3.setAttribute("onclick", "piRename(this.name)");
      btn3.innerText = "Rename";

      var nameInput = document.createElement('input');
      nameInput.classList.add("form-control-sm", "sometext");
      nameInput.setAttribute("id", data[i].name+"newName");
      nameInput.setAttribute("placeholder", "new name");
      nameInput.setAttribute("type", "text");

      control.appendChild(btn1);
      control.appendChild(btn2);
      control.appendChild(btn3);    
      control.appendChild(nameInput);

      // append columns
      list.appendChild(info);
      list.appendChild(status);
      list.appendChild(control);
      pis.appendChild(list);
    }
  }
  // if elements are there update the last check in time 
  else {
    for(var i = 0; i < data.length; i++){
      elementId = document.getElementById(data[i].name+"status");
      elementId.innerText = data[i].lastCheckIn;
      if(data[i].online){
        elementId.classList.remove("badge-danger");
        elementId.classList.add("badge-success");

      }else {
        elementId.classList.remove("badge-success");
        elementId.classList.add("badge-danger");
      }
    }
  }
});

// Get Pi Info
function requestPiInfo(){
  //console.log('sending request...');
  socket.emit('requestPiInfo');
}

// On window load
window.onload = function() {
  myWindow = setInterval(requestPiInfo, 5000);
};