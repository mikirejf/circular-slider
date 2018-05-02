import CircularSlider from './CircularSlider';
import Label from './Label';

const data = [
  { label: 'Transportation', color: '#674478', min: 100, max: 1300, step: 10 },
  { label: 'Food', color: '#0078c1', min: 0, max: 800, step: 8 },
  { label: 'Insurance', color: '#00a000', min: 0, max: 1500, step: 20 },
  { label: 'Entertainment', color: '#f37a1d', min: 0, max: 600, step: 10 },
  { label: 'Health care', color: '#ff3335', min: 0, max: 300, step: 10 }
];

const sliderContainer = document.querySelector('.sliders-container');
const labelContainer = document.querySelector('.labels-container');

data.forEach((expense, i) => {
  // Slider's radius is based on 400px. For each slider, we need 45px for its
  // width and 30px for the gap.
  const radius = (400 - i * 75) / 400;
  const sliderProps = {
    container: sliderContainer,
    min: expense.min,
    max: expense.max,
    step: expense.step,
    color: expense.color,
    radius: radius,
  };
  const labelProps = {
    container: labelContainer,
    color: expense.color,
    label: expense.label
  };

  const slider = new CircularSlider(sliderProps);
  const label = new Label(labelProps);
  
  label.value = `$${slider.value}`;

  slider.on('value-changed', (val) => {
    label.value = `$${val}`;
  });
});
