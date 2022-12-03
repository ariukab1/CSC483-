// XXX <3 singletons
let PlaylistDefault = {
  duration: parseDuration('0:05')

}

class Playlist extends EventEmitter {
  constructor(el) {
    super();

    this.el = el;

    // Asserting that we just have things beneath us
    this.items = Array.from(el.children);

    // Turn em all off
    this.items.forEach(el => {
      el.classList.remove('active');
      el.classList.remove('old');
    });

    // Start if we have items
    if (this.items.length > 1)
      this.start();
    // Otherwise, already done, dunno
    else
      this.emit('done');
  }

  start() {
    // Start our ticker
    this.atIdx = -1;
    this.at = this.items[0];
    this.at.classList.add('active');
    // eh...
    this.old = this.at;

    this.next();
  }

  next() {
    // Move up!
    this.old.classList.remove('old');
    this.at.classList.add('old');
    this.at.classList.remove('active');
    this.old = this.at;

    this.atIdx++;

    // Are we done?
    if (this.atIdx >= this.items.length) {
      console.log('Playlist done');
      this.emit('done');
    }

    this.atIdx %= this.items.length;
    this.at = this.items[this.atIdx];

    //console.log('at=', this.atIdx);

    this.at.classList.add('active');

    let dt = parseDuration(this.at.dataset.duration) || PlaylistDefault.duration;
    //console.log('dt=', dt);

    this.nextTick = setTimeout(() => this.next(), dt * 1000);
  }
}

class TemplateMgr extends EventEmitter {
  constructor(el) {
    super();
    this.el = el;
    this.init();
  }

  init() {
    // Gather up all of our lists
    this.lists = Array.from(this.el.querySelectorAll('div.playlist')).map(el => new Playlist(el));
  }

  // Da dum
  activate() {
    removeClasses(this.el, 'old');
    addClasses(this.el, 'active');
    // TODO start playlists

    let leftToDone = this.lists.length;
    this.lists.forEach(list => {
      list.once('done', () => {
        leftToDone--;
        if (leftToDone === 0) {
          console.log('Template Done');
          this.emit('done');
        }
      })
    })
  }

  background() {
    removeClasses(this.el, 'active');
    addClasses(this.el, 'old');
  }

  deactivate() {
    removeClasses(this.el, 'active old');
    // TODO deactivate/reset playlists?
  }
}

// In charge of all the scheduling
let FlowMgr = new class FlowMgr {
  constructor() {
    addEventListener('load', () => this.init());
  }

  init() {
    // So, at the top we have a bunch of templates
    // We might just flow through them, or we might have events trigger them
    // Flowing through is the default, though
    this.root = document.getElementById('player-root');
    this.templateElements = this.root.getElementsByClassName('template')
    this.templates = Array.from(this.templateElements).map(el => new TemplateMgr(el));

    if (this.templates.length > 1) {
      this.initFlow();
    } else {
      // Just activate first
      addClasses(this.templates, 'active');
    }

  }

  initFlow() {
    // Set em up
    // Assume the first template is always "the one"
    // Also assume that everything else starts not active
    this.templates[0].activate();

    // Start knocking em dead
    this.at = -1;
    this.last = false;

    this.flow();
  }

  flow() {
    if (this.last)
      this.templates[this.last].deactivate();

    if (this.at !== -1) {
      this.templates[this.at].background();
      this.last = this.at;
    }

    this.at++;
    this.at %= this.templates.length;

    this.templates[this.at].activate();

    // Determine who tells us to be done
    let data = this.templates[this.at].el.dataset;
    if (data.duration) {
      // Wait, then go
      console.log('Waiting on time:', data.duration);
      //debugger;
      setTimeout(() => this.flow(), 1000 * (parseDuration(data.duration) || 10));
    } else {
      console.log('Waiting on lists');
      this.templates[this.at].once('done', () => this.flow());
    }
  }
}


// Derp
function addClasses(el, cll) {
  if (el instanceof HTMLCollection)
    for (let subel of el)
      addClasses(subel, cll);
  else
    for (let cl of cll.split(' '))
      el.classList.add(cl);
}

function removeClasses(el, cll) {
  if (el instanceof HTMLCollection)
    for (let subel of el)
      removeClasses(subel, cll);
  else
    for (let cl of cll.split(' '))
      el.classList.remove(cl);
}

function toggleClasses(el, cll) {
  if (el instanceof HTMLCollection)
    for (let subel of el)
      toggleClasses(subel, cll);
  else
    for (let cl of cll.split(' '))
      el.classList.toggle(cl);
}