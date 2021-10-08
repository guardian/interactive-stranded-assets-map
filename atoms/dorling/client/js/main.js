const isLocal = window.location.href.indexOf("localhost") > -1;
const hasAmpName = window.name.indexOf('amp_iframe') > -1;

// if (true) {
if (hasAmpName) {
  console.log('amp version')
  var el = document.createElement('script');
  el.src = '<%= atomPath %>/ampApp.js';
  document.body.appendChild(el);

} else if (!isLocal) {


  const styles = [].slice.apply(document.querySelectorAll("style"));

const wrapper = document.querySelector("#scrolly-1");

//console.log('Here 1')

const parentPage = window.parent.document;


//console.log('Here 2')

styles.forEach(style => {
  parentPage.body.appendChild(style);
});


//console.log('Here 3')

window.frameElement.parentNode.innerHTML = wrapper.outerHTML;

console.log('Appending app.js tag ...')

var el = parentPage.createElement('script');
el.src = '<%= atomPath %>/app.js';
parentPage.body.appendChild(el);


} else {

  var el = document.createElement('script');
  el.src = '<%= atomPath %>/app.js';
  document.body.appendChild(el);
  

}



setTimeout(() => {
  if (window.resize) {  
    const html = document.querySelector('html')
    const body = document.querySelector('body')
  
    html.style.overflow = 'hidden'
    html.style.margin = '0px'
    html.style.padding = '0px'
  
    body.style.overflow = 'hidden'
    body.style.margin = '0px'
    body.style.padding = '0px'
  
  window.resize()
  }
},100)