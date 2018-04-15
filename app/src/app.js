import CircularSlider from './CircularSlider';

const data = [
  { label: 'Transportation', color: 'purple', min: 0, max: 1000, step: 10 },
  { label: 'Food', color: 'blue', min: 0, max: 1000, step: 10 },
  { label: 'Insurance', color: 'green', min: 0, max: 700, step: 10 },
  { label: 'Entertainment', color: 'orange', min: 0, max: 600, step: 10 },
  { label: 'Health care', color: 'red', min: 0, max: 500, step: 10 },
];

const container = document.querySelector('.sliders');

data.forEach((record, i) => {
  const props = {
    container: container,
    min: record.min,
    max: record.max,
    step: record.step,
    color: record.color,
    radius: 350 - (i * 60)
  };

  new CircularSlider(props);
});