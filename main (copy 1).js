const Nightmare = require('nightmare')
const nightmare = Nightmare({ show: true })
const robot = require('robotjs')
const fs = require('fs');

//Google Seacrh Bar Selector
const googleSBq = '#tsf > div:nth-child(2) > div > div.RNNXgb > div > div.a4bIc > input';
//Google Input Selector
const googleIq = '#tsf > div:nth-child(2) > div > div.RNNXgb > div > div.a4bIc > div';

const yandexSbq = 'body > div.container.rows > div.row.rows__row.rows__row_main > div.col.main.widgets > div:nth-child(2) > div > eflll > fwap > div > div.col.col_home-arrow > div > div.home-arrow__search-wrapper'
const yandexIq = '';

let google = true;

let sWidth = robot.getScreenSize().width;
let sHeight = robot.getScreenSize().height;

let tremor = 0;
let reaction = 0;

let wDelta = 24; //Разница между UI для точной навигации мыши
let sDelta;      //Количество пикселей за скролл

let mousePos = {
    x:0,
    y:0
};

let core;
let request;

function readingCore() {
  return new Promise(function(resolve,reject) {
      fs.readFile('core.json', function readFileCallback(err, data){
      if (err){
          console.log(err);
          return reject(err);
      } else {
          core = getRandomArrayElement(JSON.parse(data));
          console.log(core);
          return resolve(core);
      }
    });
  })
}

function randomize() {
  return new Promise(function(resolve,reject) {
    tremor = Math.random() * 10.0;
    reaction = Math.random() * 1000;
    console.log('Randomized');
    resolve('Randomized');
  }) 
}

start();

async function start() {
  await randomize();
  //await hide();
  await readingCore();
  if (google) {
    await googleSearch();
    let parsingResult = await googleParse();
    if (parsingResult === false) {
      nightmare.end();
      console.log('end');
      process.exit();
      return 'finished';
    }
  } else {
    await yandexSearch();
  }
  await humanize();
  //exit
}

let links = [];

async function yandexSearch() {
  customSetMouse(sWidth * Math.random(), sHeight * Math.random());
  nightmare.goto('https://yandex.ru');
  await nightmare.wait(2000);
  console.log('Зашли в яндекс');
  wDelta = await nightmare.evaluate(function() {
      return window.outerHeight - window.innerHeight;
  })
  mousePos = await nightmare.evaluate(function(wDelta,selector) {
      let s = document.getElementsByClassName('home-arrow__search');
      let sgb  = s[0].getBoundingClientRect();
      console.log(sgb);
      return {
        x: sgb.left + window.screenX + (sgb.right - sgb.left)*Math.random()*0.7,
        y: sgb.top + window.screenY + (sgb.bottom - sgb.top)*Math.random() + wDelta
      };
    },wDelta,yandexSbq)
  await customMouseMove(mousePos.x,mousePos.y)
  await robot.mouseClick();
  await nightmare.wait(1000 * Math.random());
  //Разобраться с селекторами
  await nightmare.type('input__control input__input',core + '\u000d');
  return 'done';
}


async function googleSearch() {
  customSetMouse(sWidth * Math.random(), sHeight * Math.random());
  await nightmare.goto('https://google.ru')
  wDelta = await nightmare.evaluate(function() {
      return window.outerHeight - window.innerHeight;
  })
  mousePos = await nightmare.evaluate(function(wDelta,selector) {
      let s = document.querySelector(selector);
      let sgb  = s.getBoundingClientRect();
      return {
        x: sgb.left + window.screenX + (sgb.right - sgb.left)*Math.random(),
        y: sgb.top + window.screenY + (sgb.bottom - sgb.top)*Math.random() + wDelta
      };
    },wDelta,googleSBq)
  await customMouseMove(mousePos.x,mousePos.y)
  await robot.mouseClick();
  await nightmare.wait(1000 * Math.random());
  await nightmare.type(googleIq,core + '\u000d');
  return 'done';
}

async function googleParse() {
  await nightmare.wait('#taw');
  mousePos = await parseGoogle();
  if (mousePos != false) {
    await customMouseMove(mousePos.x,mousePos.y);
    await robot.mouseClick();
    await nightmare.wait(500 + Math.random() * 500);
    return 'parsed';
  } else {
    return false;
  }
}

async function humanize() {
  await disableNewWindowLinks();
  await dumb();
  await findAllDumbLinks();
}

async function dumb(i = 0) {
  if (Math.random() > 0.3) {
    let win = await getRandomWindowCoord(128);
    await customMouseMove(win.x, win.y);
  } 
  if (Math.random() > 0.3) {
    await customScroll(0,-Math.round(Math.random() * 20) - 10);
  }
  if (Math.random() > 0.7) {
    await nightmare.wait(3000 * Math.random());
  }

  if (i < 10) {
    i++;
    console.log(i);
    await dumb(i);
  }
  return 'done';
}

async function findAllDumbLinks() {
  await nightmare.evaluate(function() {
    let links = document.getElementsByTagName('a');
    let superLinks = [];
    let s = /Контакт/i;
    for(i = 0; i < links.length; i++) {
      if (links[i].innerHTML.search(s) > 0) {
        superLinks.push(links[i]);
      }
    }

    if (superLinks.length > 0) {
      console.log(superLinks[0].getBoundingClientRect());
    }
    return superLinks;
  })   
}

async function getRandomWindowCoord(radius = 0) {
  let mouse = robot.getMousePos();
  return await nightmare.evaluate(function(mouse,radius) {
    function gtr() {
      return {
        x: window.screenX + Math.random() * document.documentElement.clientWidth,
        y: window.screenY + Math.random() * document.documentElement.clientHeight
      }
    }
    if (radius === 0){
      return gtr();
    } else {
      let newMouse = gtr();
      while (Math.abs(newMouse.x - mouse.x) > radius && Math.abs(newMouse.y - mouse.y) > radius) {
        newMouse = gtr();
      }
      return newMouse;
    }

  },mouse,radius);
}

function customSetMouse(x,y) {
  return new Promise(function(resolve,reject) {
    robot.moveMouse(x,y);
    resolve('Mouse setted');
  });
}

async function parseGoogle() {
  let id = await nightmare.evaluate(function() {
    a = document.getElementsByClassName('ad_cclk');
    return Math.round((a.length - 1) * Math.random());
  })

  if (id >= 0) {
    await disableNewWindowLinks();
    await scrollToClass('ad_cclk',id);
    return await randomizeClass('ad_cclk',id);
  }
  
  return false;
}

async function scrollToClass(selector, id) {
  let pos = await nightmare.evaluate(function(selector, id) {
    a = document.getElementsByClassName(selector);
    abc = a[id].getBoundingClientRect();
    return {
      x:  abc.left + window.screenX,
      y:  abc.top +  window.screenY,
    }
  },selector, id); 

  console.log(pos);

  if (pos.y > sHeight * 0.5 + wDelta) {
    await customScroll(0,-4 - Math.round(Math.random() * 2));
    await scrollToClass(selector,id);
  } else if (pos.y < 150 + wDelta) {
    await customScroll(0, 2);
    await scrollToClass(selector,id);
  } else {
    return 'done';
  }

  return 'exit';
}

async function randomizeClass(selector, id) {
  return await nightmare.evaluate(function(selector, id, wDelta) {
    a = document.getElementsByClassName(selector);
    abc = a[id].getBoundingClientRect();
    return {
      x: abc.left + window.screenX + (abc.right - abc.left) * Math.random() * 0.33 + 6 + wDelta,
      y: abc.top + window.screenY + (abc.bottom - abc.top) * Math.random() * 0.33 + 6 + wDelta,
    }
  },selector, id, wDelta); 
}

async function customScroll(x,y) {
  await robot.scrollMouse(x,y);
  await nightmare.wait(500 + 250 * Math.random());
  return 'done';
}

async function disableNewWindowLinks() {
  await nightmare.evaluate(function() {
    Array.from(document.querySelectorAll('a[target="_blank"]'))
      .forEach(link => link.removeAttribute('target')); 
  });
  return 'done';
}

function getRandomArrayElement(arr) {
  return arr[Math.floor(arr.length * Math.random())];
}

function customMouseMove(x,y) {
  return new Promise(function(resolve, reject) {
    getMousePoints(x,y)
    .then(function(arr) {
      while(arr.length > 0) {
        robot.moveMouse(arr[0].x,arr[0].y);
        arr.shift();
      }
      robot.moveMouse(x,y);
    });
    resolve('Mouse moved');
  })
}

function getMousePoints(x,y) {
  return new Promise(function(resolve,reject) {
    let sx = robot.getMousePos().x;
    let sy = robot.getMousePos().y;

    let c = [];

    let fx = fm(sx,Math.random() * sWidth,Math.random() * sWidth,x);
    let fy = fm(sy,Math.random() * sHeight,Math.random() * sHeight,y);
    
    let i = 0;
    let n = 3.1415;
    while(true) {
      n += Math.random()*0.1;
      i = (Math.cos(n) + 1)/2;
      
      if (i > 0.9985) {
        c.push({
          x: fx(1),
          y: fy(1)
        })
        break;
      }

      c.push({
        x: fx(i) + (0.5 - Math.random()) * tremor,
        y: fy(i) + (0.5 - Math.random()) * tremor
      })
    }

    if (c.length > 0) {
      resolve(c);
    } else {
      reject('error');
    }
  });
}

//Возвращает функцию для определения координат движения мыши
function fm(x,y,z,w) {
  return function(t) {
    return (1-t)*(1-t)*(1-t)*x + 3*(1-t) * (1-t) * t * y + 3 * (1-t)*t*t*z + t*t*t*w;
  }
}

//Начать парсить яндекс