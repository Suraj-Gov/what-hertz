// https://stackoverflow.com/questions/69237143/how-do-i-get-the-audio-frequency-from-my-mic-using-javascript
// Don't listen to high freq sounds (> 10k Hz) for a long time.
const freqSpan = document.querySelector("#freq");
const body = document.querySelector("body");

const ctx = new window.AudioContext();
const analyzerNode = ctx.createAnalyser();
let audioData = new Float32Array(analyzerNode.fftSize);
let corrolatedSignal = new Float32Array(analyzerNode.fftSize);
const localMaxima = Array.from(Array(10), () => 0);

const start = () => {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      const micStream = ctx.createMediaStreamSource(stream);
      micStream.connect(analyzerNode);
      setInterval(() => {
        analyzerNode.getFloatTimeDomainData(audioData);
        const pitch = getAutocorrolatedPitch();
        freqSpan.innerHTML = `${pitch.toFixed(2)}`;
        if (pitch > 8600) {
          body.style.backgroundColor = "red";
        } else {
          body.style.backgroundColor = "white";
        }
      }, 30);
    })
    .catch((reason) => {
      alert("Error", reason);
    });
};

const getAutocorrolatedPitch = () => {
  // First: autocorrolate the signal

  let maximaCount = 0;

  for (let l = 0; l < analyzerNode.fftSize; l++) {
    corrolatedSignal[l] = 0;
    for (let i = 0; i < analyzerNode.fftSize - l; i++) {
      corrolatedSignal[l] += audioData[i] * audioData[i + l];
    }
    if (l > 1) {
      if (
        corrolatedSignal[l - 2] - corrolatedSignal[l - 1] < 0 &&
        corrolatedSignal[l - 1] - corrolatedSignal[l] > 0
      ) {
        localMaxima[maximaCount] = l - 1;
        maximaCount++;
        if (maximaCount >= localMaxima.length) break;
      }
    }
  }

  // Second: find the average distance in samples between maxima

  let maximaMean = localMaxima[0];

  for (let i = 1; i < maximaCount; i++)
    maximaMean += localMaxima[i] - localMaxima[i - 1];

  maximaMean /= maximaCount;

  return ctx.sampleRate / maximaMean;
};
