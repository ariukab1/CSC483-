// A really bad idea
// This would almose be a good use case for Vue-esque SFC
//   but we don't want to overburden our target...

window.Plugins = new class PluginManager {
  constructor() {
    this.plugins = {};
    this.active = [];
  }

  render() {
    console.log('Renderin');

    // To be called once everybody has registered, and the page is ready
    for (let element of document.querySelectorAll('div[data-plugin]')) {
      console.log('Plugin @', element);

      let instance = new (this.plugins[element.dataset.plugin])(element.dataset);
      this.active.push(instance);
      
      // Do rendering
      console.log('Getting data');
      instance.data().then(data => {
        // Doop
        console.log('Got data');
        window.d = data;
        return nunjucks.render(instance.template(), data);
      }).then(html => {
        // XXX Safe as houses
        element.innerHTML = html;
      });
    }
  }

  registerPlugin(plugin) {
    this.plugins[plugin.name] = plugin;
  }
}

class Plugin {
  constructor(params) {
    // Takes an element dataset to pass to plugin
    this.params = params;
  }
}

// Thing
function get(url) {
  return new Promise((resolve, reject) => {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function() {
      if (this.status !== 200) return reject(this.responseText);
      resolve(this.responseText);
    });
    oReq.open("GET", url);
    oReq.send();
  });
}

class OpenWeatherMap extends Plugin {
  template() {
    return 'OpenWeatherMap.njk';
  }

  data() {
    // So basically, we just gather our data here and do the template thing
    let apiRoot = 'https://api.openweathermap.org/data/2.5/forecast?'
    let iconRoot = 'https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/';

    let apiUrl = apiRoot + [
      'appid=' + this.params.apikey,
      'q=' + this.params.location,
      'units=' + 'imperial'
    ].join('&');

    return get(apiUrl).then(JSON.parse).then(res => {
      // Mucking time

      let week = [];
      for (let d = 0; d < 7; d++)
        week[d] = {
          samples: 0,
          minTemp: Infinity,
          maxTemp: -Infinity,
          avgTemp: 0,
          weathers: [],
          weathericons: []
        };

      for (let sample of res.list) {
        let dow = new Date(sample.dt * 1000).getDay();
        let agg = week[dow];
        // Just temperature and thing for the moment
        agg.minTemp = Math.min(sample.main.temp_min, agg.minTemp);
        agg.maxTemp = Math.max(sample.main.temp_max, agg.maxTemp);
        agg.avgTemp = (agg.samples * agg.avgTemp + sample.main.temp) / (agg.samples + 1);
        agg.weathers.push(sample.weather[0].description)
        agg.weathericons.push(sample.weather[0].icon)
        agg.samples++;

      }

      window.week = week;

      // Well, oh well
      let d = new Date().getDay();
      let o = [];
      let dayDescriptions = ['Today', 'Tomorrow', 'Later'];
      for (let i = 0; i < 3; i++) {
        let at = (d + i) % 7;
        let datum = week[at];
        o.push({
          low: datum.minTemp.toFixed(0),
          high: datum.maxTemp.toFixed(0),
          description: datum.weathers[Math.floor(datum.samples / 2)],
          icon: datum.weathericons[Math.floor(datum.samples / 2)],
          day: dayDescriptions[i]
        })
      }

      return {
        days: o
      };
    });

  }
}

// Close enough
Plugins.registerPlugin(OpenWeatherMap);
addEventListener('load', () => Plugins.render());