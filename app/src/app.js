import CircularSlider from './CircularSlider';
import Label from './Label';

const data = [
  { label: 'Transportation', color: '#674478', min: 0, max: 400, step: 100 },
  { label: 'Food', color: '#0078c1', min: 300, max: 1000, step: 10 },
  { label: 'Insurance', color: '#00a000', min: 0, max: 700, step: 10 },
  { label: 'Entertainment', color: '#fe8130', min: 0, max: 600, step: 10 },
  { label: 'Health care', color: '#ff3335', min: 0, max: 500, step: 10 },
];

const sliderContainer = document.querySelector('.sliders');
const labelContainer = document.querySelector('.labels');

data.forEach((record, i) => {
  const sliderProps = {
    container: sliderContainer,
    min: record.min,
    max: record.max,
    step: record.step,
    color: record.color,
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