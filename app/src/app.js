import CircularSlider from './CircularSlider';

var c = window.c = new CircularSlider({
  container: document.getElementById('container'),
  min: 0,
  max: 200,
  step: 20,
  color: 'red',
  radius: 200
});