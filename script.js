const findoutmore = document.getElementById('findoutmore');
const gotoCOFEC = document.getElementById('cofecbtn');

if (findoutmore) {
    findoutmore.addEventListener('click', gotoContact);
}

if (gotoCOFEC) {
    gotoCOFEC.addEventListener('click', gotoCOFECSite);
}

function gotoContact() {
    window.location.href = 'contact.html';
}

function gotoCOFECSite() {
    window.location.assign('https://cofec.org');
}