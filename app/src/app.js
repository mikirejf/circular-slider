import CircularSlider from './CircularSlider';
import Label from './Label';

const data = [
  { label: 'Transportation', color: '#674478', min: 0, max: 400, step: 4, percent: 1 },
  { label: 'Food', color: '#0078c1', min: 300, max: 1000, step: 10, percent: 0.82 },
  { label: 'Insurance', color: '#00a000', min: 900, max: 2000, step: 10, percent: 0.65 },
  { label: 'Entertainment', color: '#fe8130', min: 0, max: 600, step: 10, percent: 0.47 },
  { label: 'Health care', color: '#ff3335', min: 0, max: 300, step: 10, percent: 0.3 },
];

const sliderContainer = document.querySelector('.sliders-container');
const labelContainer = document.querySelector('.labels-container');

data.forEach((record, i) => {
  const sliderProps = {
    container: sliderContainer,
    min: record.min,
    max: record.max,
    step: record.step,
    color: record.color,
    percent: record.percent,
    radius: 350 - (i * 60)
  };

  const labelProps = {
    container: labelContainer,
    color: record.color,
    label: record.label
  };

  const slider = new CircularSlider(sliderProps);
  const label = new Label(labelProps);

  label.value = `$${slider.value}`;

  slider.on('value-changed', (val) => {
    label.value = `$${val}`;
  });
});